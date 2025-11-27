/**
 * @fileoverview Context Manager for Dev Framework Hook System
 * Manages growing context efficiently across sequential hook execution
 * Stores brief, accumulated advice, revisions, and maintains audit trail
 * Part of the Dev Framework Testing System
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Context Manager - Manages context accumulation and provides slices to sub-agents
 */
class ContextManager {
  constructor(options = {}) {
    this.options = {
      persistToFile: true,
      contextDir: options.contextDir || path.join(process.cwd(), '.claude', 'context'),
      maxContextSize: 1024 * 1024, // 1MB max context size
      enableCompression: true, // Compress old context for efficiency
      ...options,
    };

    // Current context
    this.context = {
      sessionId: this.generateSessionId(),
      brief: null,
      advice: [],
      projectContext: null,
      decisions: [],
      revisions: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
      },
    };

    // Context snapshots for rollback
    this.snapshots = [];

    // Audit trail
    this.auditTrail = [];
  }

  /**
   * Initialize context with brief and project context
   * @param {Object} brief - Initial brief/requirements
   * @param {Object} projectContext - Full project context
   */
  async initialize(brief, projectContext = {}) {
    this.context.brief = brief;
    this.context.projectContext = projectContext;
    this.context.metadata.updatedAt = new Date();

    this.audit('initialize', {
      brief: this.summarizeBrief(brief),
      projectContextSize: JSON.stringify(projectContext).length,
    });

    await this.persist();

    return this.context.sessionId;
  }

  /**
   * Add advice from a hook execution
   * @param {string} hookName - Name of the hook
   * @param {string} agentName - Name of the agent
   * @param {Object} advice - Advice object from agent
   */
  async addAdvice(hookName, agentName, advice) {
    const adviceEntry = {
      id: this.generateAdviceId(),
      hookName,
      agentName,
      timestamp: new Date(),
      advice,
    };

    this.context.advice.push(adviceEntry);
    this.context.metadata.updatedAt = new Date();

    this.audit('add_advice', {
      hookName,
      agentName,
      adviceId: adviceEntry.id,
      findingsCount: this.countFindings(advice.findings),
    });

    await this.persist();

    return adviceEntry.id;
  }

  /**
   * Add a revision entry
   * @param {string} hookName - Name of the hook
   * @param {number} iterationCount - Number of iterations
   * @param {Object} finalAdvice - Final advice after revisions
   */
  async addRevision(hookName, iterationCount, finalAdvice) {
    const revision = {
      id: this.generateRevisionId(),
      hookName,
      iterationCount,
      timestamp: new Date(),
      finalAdvice,
    };

    this.context.revisions.push(revision);
    this.context.metadata.updatedAt = new Date();

    this.audit('add_revision', {
      hookName,
      revisionId: revision.id,
      iterationCount,
    });

    await this.persist();

    return revision.id;
  }

  /**
   * Add a human decision
   * @param {string} type - Type of decision (e.g., 'conflict-resolution')
   * @param {Object} details - Decision details
   */
  async addDecision(type, details) {
    const decision = {
      id: this.generateDecisionId(),
      type,
      timestamp: new Date(),
      details,
    };

    this.context.decisions.push(decision);
    this.context.metadata.updatedAt = new Date();

    this.audit('add_decision', {
      type,
      decisionId: decision.id,
    });

    await this.persist();

    return decision.id;
  }

  /**
   * Get context slice for a specific hook
   * Returns only relevant context for the current hook
   * @param {string} hookName - Name of the hook
   * @param {Object} options - Options for context slice
   * @returns {Object} Context slice
   */
  getContextSlice(hookName, options = {}) {
    const {
      includeBrief = true,
      includePreviousAdvice = true,
      includeDecisions = true,
      includeProjectContext = false, // Only orchestrator gets full project context
      maxAdviceEntries = 10, // Limit context size
    } = options;

    const slice = {
      sessionId: this.context.sessionId,
      hookName,
      timestamp: new Date(),
    };

    if (includeBrief) {
      slice.brief = this.context.brief;
    }

    if (includePreviousAdvice) {
      // Get advice from previous hooks only (sequential context building)
      const previousAdvice = this.context.advice
        .slice(-maxAdviceEntries)
        .map(entry => ({
          hookName: entry.hookName,
          agentName: entry.agentName,
          timestamp: entry.timestamp,
          findings: entry.advice.findings,
          priority: entry.advice.priority,
          confidence: entry.advice.confidence,
        }));

      slice.previousAdvice = previousAdvice;
    }

    if (includeDecisions) {
      slice.decisions = this.context.decisions.map(d => ({
        type: d.type,
        timestamp: d.timestamp,
        summary: this.summarizeDecision(d),
      }));
    }

    if (includeProjectContext) {
      slice.projectContext = this.context.projectContext;
    }

    return slice;
  }

  /**
   * Get full context for orchestrator
   * Orchestrator needs complete context for validation
   * @returns {Object} Full context
   */
  getFullContext() {
    return {
      ...this.context,
      auditTrail: this.auditTrail,
      snapshotCount: this.snapshots.length,
    };
  }

  /**
   * Create a snapshot of current context (for rollback)
   * @param {string} label - Label for the snapshot
   * @returns {string} Snapshot ID
   */
  createSnapshot(label = '') {
    const snapshot = {
      id: this.generateSnapshotId(),
      label,
      timestamp: new Date(),
      context: JSON.parse(JSON.stringify(this.context)), // Deep copy
    };

    this.snapshots.push(snapshot);

    this.audit('create_snapshot', {
      snapshotId: snapshot.id,
      label,
    });

    return snapshot.id;
  }

  /**
   * Restore from a snapshot
   * @param {string} snapshotId - Snapshot ID to restore
   * @returns {boolean} Success
   */
  async restoreSnapshot(snapshotId) {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    this.context = JSON.parse(JSON.stringify(snapshot.context)); // Deep copy
    this.context.metadata.updatedAt = new Date();

    this.audit('restore_snapshot', {
      snapshotId,
      label: snapshot.label,
    });

    await this.persist();

    return true;
  }

  /**
   * Get context size in bytes
   * @returns {number} Size in bytes
   */
  getContextSize() {
    return JSON.stringify(this.context).length;
  }

  /**
   * Check if context size is within limits
   * @returns {boolean} Whether size is acceptable
   */
  isContextSizeAcceptable() {
    return this.getContextSize() <= this.options.maxContextSize;
  }

  /**
   * Compress old advice to reduce context size
   * Keeps summaries instead of full details for old entries
   */
  compressOldAdvice() {
    if (!this.options.enableCompression) {
      return;
    }

    const keepRecentCount = 5; // Keep last 5 full entries
    const compressCount = this.context.advice.length - keepRecentCount;

    if (compressCount <= 0) {
      return;
    }

    // Compress old entries
    for (let i = 0; i < compressCount; i++) {
      const entry = this.context.advice[i];

      if (!entry.compressed) {
        entry.compressed = true;
        entry.summary = this.summarizeAdvice(entry.advice);
        // Remove detailed findings
        delete entry.advice.findings;
      }
    }

    this.audit('compress_advice', {
      compressedCount: compressCount,
    });
  }

  /**
   * Persist context to file
   */
  async persist() {
    if (!this.options.persistToFile) {
      return;
    }

    try {
      // Ensure directory exists
      await fs.mkdir(this.options.contextDir, { recursive: true });

      const filename = `context-${this.context.sessionId}.json`;
      const filepath = path.join(this.options.contextDir, filename);

      const data = {
        context: this.context,
        auditTrail: this.auditTrail,
        snapshots: this.snapshots.map(s => ({
          id: s.id,
          label: s.label,
          timestamp: s.timestamp,
        })),
        persistedAt: new Date(),
      };

      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to persist context:', error.message);
    }
  }

  /**
   * Load context from file
   * @param {string} sessionId - Session ID to load
   */
  async load(sessionId) {
    const filename = `context-${sessionId}.json`;
    const filepath = path.join(this.options.contextDir, filename);

    try {
      const data = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(data);

      this.context = parsed.context;
      this.auditTrail = parsed.auditTrail || [];

      // Restore snapshot metadata only (not full snapshots to save memory)
      this.snapshots = [];

      this.audit('load_context', {
        sessionId,
        adviceCount: this.context.advice.length,
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to load context: ${error.message}`);
    }
  }

  /**
   * Get summary statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      sessionId: this.context.sessionId,
      totalAdvice: this.context.advice.length,
      totalRevisions: this.context.revisions.length,
      totalDecisions: this.context.decisions.length,
      totalAuditEntries: this.auditTrail.length,
      contextSize: this.getContextSize(),
      contextSizeAcceptable: this.isContextSizeAcceptable(),
      createdAt: this.context.metadata.createdAt,
      updatedAt: this.context.metadata.updatedAt,
      snapshotCount: this.snapshots.length,
    };
  }

  /**
   * Export context for analysis
   * @returns {Object} Exportable context
   */
  exportContext() {
    return {
      context: this.context,
      auditTrail: this.auditTrail,
      stats: this.getStats(),
      exportedAt: new Date(),
    };
  }

  /**
   * Clear context (for testing)
   */
  clear() {
    this.context = {
      sessionId: this.generateSessionId(),
      brief: null,
      advice: [],
      projectContext: null,
      decisions: [],
      revisions: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
      },
    };
    this.snapshots = [];
    this.auditTrail = [];
  }

  /**
   * Add entry to audit trail
   * @param {string} action - Action name
   * @param {Object} details - Action details
   */
  audit(action, details = {}) {
    this.auditTrail.push({
      timestamp: new Date(),
      action,
      details,
    });

    // Keep audit trail size manageable
    if (this.auditTrail.length > 1000) {
      this.auditTrail = this.auditTrail.slice(-500);
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique advice ID
   * @returns {string} Advice ID
   */
  generateAdviceId() {
    return `advice-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique revision ID
   * @returns {string} Revision ID
   */
  generateRevisionId() {
    return `revision-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique decision ID
   * @returns {string} Decision ID
   */
  generateDecisionId() {
    return `decision-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique snapshot ID
   * @returns {string} Snapshot ID
   */
  generateSnapshotId() {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Summarize brief for audit trail
   * @param {Object} brief - Brief object
   * @returns {string} Summary
   */
  summarizeBrief(brief) {
    if (typeof brief === 'string') {
      return brief.substring(0, 100);
    }
    return brief.title || brief.description || 'Untitled brief';
  }

  /**
   * Count findings in advice
   * @param {Object} findings - Findings object
   * @returns {number} Total count
   */
  countFindings(findings) {
    if (!findings) return 0;
    return (
      (findings.issues?.length || 0) +
      (findings.suggestions?.length || 0) +
      (findings.risks?.length || 0)
    );
  }

  /**
   * Summarize advice for compression
   * @param {Object} advice - Advice object
   * @returns {string} Summary
   */
  summarizeAdvice(advice) {
    const findings = advice.findings || {};
    const counts = this.countFindings(findings);
    return `${counts} findings (priority: ${advice.priority}, confidence: ${advice.confidence})`;
  }

  /**
   * Summarize decision
   * @param {Object} decision - Decision object
   * @returns {string} Summary
   */
  summarizeDecision(decision) {
    return `${decision.type} - ${new Date(decision.timestamp).toISOString()}`;
  }
}

module.exports = ContextManager;
