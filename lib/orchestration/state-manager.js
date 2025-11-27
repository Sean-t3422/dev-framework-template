/**
 * @fileoverview State Manager
 *
 * Provides persistent tracking of orchestration execution with crash recovery,
 * progress visualization, event logging, and rollback capabilities.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class StateManager {
  constructor(projectPath, featureName) {
    this.projectPath = projectPath;
    this.featureName = featureName;
    this.sessionPath = null;
    this.state = null;
    this.eventStream = null;
  }

  /**
   * Initialize new orchestration session
   */
  async initializeSession(spec, blueprints, dependencyGraph) {
    this.sessionPath = await this.createSessionDirectory();

    const session = {
      sessionId: this.generateSessionId(),
      projectPath: this.projectPath,
      featureName: this.featureName,
      specPath: spec.path || null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'initializing',
      currentLayer: 0,

      blueprints: blueprints.map((bp, index) => this.initializeBlueprintState(bp, index)),

      dependencyGraph: {
        layers: dependencyGraph,
        edges: this.extractEdges(blueprints)
      },

      execution: this.initializeExecutionState(blueprints, dependencyGraph),
      locks: this.initializeLockState(),
      stats: this.initializeStats(blueprints)
    };

    this.state = session;

    // Create event stream
    this.eventStream = fsSync.createWriteStream(
      path.join(this.sessionPath, 'events.ndjson'),
      { flags: 'a' }
    );

    await this.saveState();
    await this.logEvent('session_started', {
      featureName: this.featureName,
      blueprintCount: blueprints.length,
      layerCount: dependencyGraph.length
    });

    return session;
  }

  /**
   * Initialize blueprint state
   */
  initializeBlueprintState(blueprint, layerIndex) {
    return {
      id: blueprint.id,
      name: blueprint.name,
      description: blueprint.description || '',
      layer: layerIndex,
      estimatedMinutes: blueprint.estimatedMinutes || 5,
      dependsOn: blueprint.dependsOn || [],
      blockedBy: [],
      resources: blueprint.resources || {
        tables: [],
        migrations: [],
        routes: [],
        components: [],
        functions: []
      },
      status: 'pending',
      locksHeld: [],
      outputs: null,
      error: null
    };
  }

  /**
   * Initialize execution state
   */
  initializeExecutionState(blueprints, layers) {
    return {
      currentLayer: 0,
      totalLayers: layers.length,
      pending: blueprints.length,
      ready: 0,
      executing: 0,
      completed: 0,
      failed: 0,
      maxConcurrent: 5, // Max sub-agents in parallel
      currentConcurrent: 0,
      overallProgress: 0
    };
  }

  /**
   * Initialize lock state
   */
  initializeLockState() {
    return {
      locks: {},
      waiting: {},
      history: []
    };
  }

  /**
   * Initialize statistics
   */
  initializeStats(blueprints) {
    return {
      totalBlueprints: blueprints.length,
      completedBlueprints: 0,
      failedBlueprints: 0,
      totalDurationSeconds: 0,
      averageBlueprintDuration: 0,
      longestBlueprintDuration: 0,
      shortestBlueprintDuration: 0,
      tokensSaved: 0,
      contextReductionPercentage: 0,
      layersExecuted: 0,
      blueprintsInParallel: 0,
      timeSavedByParallelization: 0,
      codexReviews: 0,
      codexApprovals: 0,
      codexRejections: 0,
      averageRetries: 0
    };
  }

  /**
   * Extract dependency edges from blueprints
   */
  extractEdges(blueprints) {
    const edges = [];

    for (const bp of blueprints) {
      if (bp.dependsOn) {
        for (const depId of bp.dependsOn) {
          edges.push([depId, bp.id]);
        }
      }
    }

    return edges;
  }

  /**
   * Update blueprint status
   */
  async updateBlueprintStatus(blueprintId, status, updates = {}) {
    const blueprint = this.state.blueprints.find(bp => bp.id === blueprintId);
    if (!blueprint) {
      throw new Error(`Blueprint not found: ${blueprintId}`);
    }

    const oldStatus = blueprint.status;
    blueprint.status = status;

    // Apply additional updates
    Object.assign(blueprint, updates);

    // Update timing
    if (status === 'executing' && !blueprint.startedAt) {
      blueprint.startedAt = new Date().toISOString();
    } else if (status === 'completed' && blueprint.startedAt) {
      blueprint.completedAt = new Date().toISOString();
      const start = new Date(blueprint.startedAt);
      const end = new Date(blueprint.completedAt);
      blueprint.durationSeconds = Math.floor((end - start) / 1000);
    }

    this.state.updatedAt = new Date().toISOString();

    await this.saveState();
    await this.logEvent(`blueprint_${status}`, {
      blueprintId,
      previousStatus: oldStatus,
      ...updates
    });

    this.updateExecutionState();
  }

  /**
   * Record lock acquisition
   */
  async recordLockAcquisition(blueprintId, resourceIds) {
    const blueprint = this.state.blueprints.find(bp => bp.id === blueprintId);
    if (!blueprint) return;

    blueprint.locksHeld = resourceIds;
    blueprint.locksAcquiredAt = new Date().toISOString();

    await this.saveState();
    await this.logEvent('lock_acquired', { blueprintId, resourceIds });
  }

  /**
   * Record lock release
   */
  async recordLockRelease(blueprintId) {
    const blueprint = this.state.blueprints.find(bp => bp.id === blueprintId);
    if (!blueprint) return;

    const resourceIds = blueprint.locksHeld;
    blueprint.locksHeld = [];

    await this.saveState();
    await this.logEvent('lock_released', { blueprintId, resourceIds });
  }

  /**
   * Create checkpoint for recovery
   */
  async createCheckpoint(name) {
    const checkpointPath = path.join(
      this.sessionPath,
      'checkpoints',
      `${name}.json`
    );

    await fs.mkdir(path.dirname(checkpointPath), { recursive: true });
    await fs.writeFile(
      checkpointPath,
      JSON.stringify(this.state, null, 2)
    );

    await this.logEvent('checkpoint_created', { name, path: checkpointPath });

    console.log(`[State] Checkpoint created: ${name}`);
  }

  /**
   * Resume from checkpoint
   */
  async resumeFromCheckpoint(checkpointName) {
    let checkpointPath;

    if (checkpointName) {
      checkpointPath = path.join(
        this.sessionPath,
        'checkpoints',
        `${checkpointName}.json`
      );
    } else {
      checkpointPath = path.join(this.sessionPath, 'state.json');
    }

    const stateJson = await fs.readFile(checkpointPath, 'utf8');
    this.state = JSON.parse(stateJson);
    this.state.status = 'running';
    this.state.updatedAt = new Date().toISOString();

    await this.saveState();
    await this.logEvent('checkpoint_restored', { checkpointName });

    console.log(`[State] Resumed from checkpoint: ${checkpointName || 'latest'}`);

    return this.state;
  }

  /**
   * Save current state to disk
   */
  async saveState() {
    if (!this.sessionPath) return;

    const statePath = path.join(this.sessionPath, 'state.json');
    await fs.writeFile(
      statePath,
      JSON.stringify(this.state, null, 2)
    );

    // Update active session pointer
    const orchestrationRoot = path.join(
      path.dirname(path.dirname(path.dirname(this.sessionPath))),
      'active.json'
    );

    await fs.mkdir(path.dirname(orchestrationRoot), { recursive: true });
    await fs.writeFile(
      orchestrationRoot,
      JSON.stringify({
        sessionId: this.state.sessionId,
        path: this.sessionPath,
        featureName: this.featureName,
        updatedAt: this.state.updatedAt
      })
    );
  }

  /**
   * Append event to log
   */
  async logEvent(type, data) {
    if (!this.eventStream) return;

    const event = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: this.state.sessionId,
      type,
      data
    };

    this.eventStream.write(JSON.stringify(event) + '\n');
  }

  /**
   * Update execution state based on blueprint statuses
   */
  updateExecutionState() {
    const exec = this.state.execution;

    exec.pending = this.state.blueprints.filter(bp => bp.status === 'pending').length;
    exec.ready = this.state.blueprints.filter(bp => bp.status === 'ready').length;
    exec.executing = this.state.blueprints.filter(bp =>
      bp.status === 'executing' || bp.status === 'reviewing'
    ).length;
    exec.completed = this.state.blueprints.filter(bp => bp.status === 'completed').length;
    exec.failed = this.state.blueprints.filter(bp => bp.status === 'failed').length;

    exec.overallProgress = Math.round(
      (exec.completed / this.state.stats.totalBlueprints) * 100
    );
  }

  /**
   * Get session statistics
   */
  getStats() {
    const completed = this.state.blueprints.filter(bp => bp.status === 'completed');
    const durations = completed
      .filter(bp => bp.durationSeconds)
      .map(bp => bp.durationSeconds);

    const now = new Date();
    const start = new Date(this.state.startedAt);

    return {
      ...this.state.stats,
      totalDurationSeconds: Math.floor((now - start) / 1000),
      completedBlueprints: completed.length,
      averageBlueprintDuration: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      longestBlueprintDuration: Math.max(...durations, 0),
      shortestBlueprintDuration: durations.length > 0 ? Math.min(...durations) : 0
    };
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `sess-${timestamp}-${random}`;
  }

  /**
   * Generate event ID
   */
  generateEventId() {
    return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create session directory
   */
  async createSessionDirectory() {
    const sessionId = this.generateSessionId();
    const sessionPath = path.join(
      this.projectPath,
      '.orchestration',
      'sessions',
      sessionId
    );

    await fs.mkdir(sessionPath, { recursive: true });
    await fs.mkdir(path.join(sessionPath, 'checkpoints'), { recursive: true });
    await fs.mkdir(path.join(sessionPath, 'artifacts'), { recursive: true });

    return sessionPath;
  }

  /**
   * Close event stream
   */
  async close() {
    if (this.eventStream) {
      this.eventStream.end();
      this.eventStream = null;
    }
  }

  /**
   * Load existing session from disk
   */
  static async loadSession(sessionPath) {
    const statePath = path.join(sessionPath, 'state.json');
    const stateJson = await fs.readFile(statePath, 'utf8');
    const state = JSON.parse(stateJson);

    const stateManager = new StateManager(state.projectPath, state.featureName);
    stateManager.sessionPath = sessionPath;
    stateManager.state = state;

    // Reopen event stream
    stateManager.eventStream = fsSync.createWriteStream(
      path.join(sessionPath, 'events.ndjson'),
      { flags: 'a' }
    );

    return stateManager;
  }

  /**
   * Detect crashed sessions and offer recovery
   */
  static async detectCrashedSession(projectPath) {
    const activePath = path.join(projectPath, '.orchestration', 'active.json');

    try {
      const activeJson = await fs.readFile(activePath, 'utf8');
      const { sessionId, path: sessionPath } = JSON.parse(activeJson);

      const statePath = path.join(sessionPath, 'state.json');
      const stateJson = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(stateJson);

      // Check if session needs recovery
      if (state.status === 'completed' || state.status === 'failed') {
        return null; // No recovery needed
      }

      return { sessionPath, state };
    } catch (err) {
      // No active session
      return null;
    }
  }
}

module.exports = { StateManager };
