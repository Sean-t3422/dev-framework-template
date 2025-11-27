#!/usr/bin/env node
/**
 * @fileoverview Unified Orchestrator - THE Single Orchestrator for Dev Framework
 *
 * This is the ONLY orchestrator. It manages the complete feature lifecycle from
 * brief to deployment, using sub-agents via Task tool for actual work.
 *
 * Architecture:
 *   - ME (Opus/Claude main session) = Orchestrator
 *   - Task tool = Spawns sub-agents with isolated context
 *   - Codex CLI = Quality gate (called via Bash by sub-agents or directly)
 *   - StateManager = Persistence across sessions
 *
 * Hierarchical Todo Structure:
 *   Brief (Epic) → Todos
 *     └── Spec (Story) → Todos
 *           └── Blueprint (Task) → Todos
 *
 * The orchestrator continues processing until ALL todos at ALL levels are complete.
 *
 * @example
 * // From Claude Code main session:
 * const orchestrator = new UnifiedOrchestrator();
 * await orchestrator.orchestrateFeature(description, agentInvoker);
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { StateManager } = require('../lib/state-manager');

class UnifiedOrchestrator {
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      maxFixIterations: 5,
      enableCodexPreValidation: true,
      enableParallelExecution: true,
      maxParallelAgents: 5,
      ...options
    };

    this.stateManager = new StateManager();
    this.sessionId = this.generateSessionId();

    // Hierarchical todo tracking
    this.todos = {
      brief: [],
      spec: [],
      blueprints: new Map() // blueprintId -> todo[]
    };

    // Execution state
    this.currentPhase = 'DISCOVER';
    this.agentInvoker = null;
  }

  /**
   * Resume orchestration from an existing brief
   * Skips Phase 1 (DISCOVER) and starts at Phase 2 (DESIGN)
   */
  async resumeFromBrief(briefPathOrContent, agentInvoker, options = {}) {
    if (!agentInvoker) {
      throw new Error(
        'UnifiedOrchestrator requires an agentInvoker callback.\n\n' +
        'This callback should use the Task tool to spawn sub-agents.\n' +
        'Example: agentInvoker({ subagent_type: "brief-writer", prompt: "..." })'
      );
    }

    this.agentInvoker = agentInvoker;
    const startPhase = options.startPhase || 'DESIGN';

    // Load brief content
    let briefContent;
    if (briefPathOrContent.includes('\n') || briefPathOrContent.length > 500) {
      briefContent = briefPathOrContent;
    } else {
      try {
        briefContent = await fs.readFile(briefPathOrContent, 'utf-8');
        console.log(`📄 Loaded brief from: ${briefPathOrContent}`);
      } catch (error) {
        throw new Error(`Could not read brief file: ${briefPathOrContent}\n${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 UNIFIED ORCHESTRATOR - Resuming from Brief');
    console.log('='.repeat(80));
    console.log(`Session: ${this.sessionId}`);
    console.log(`Start Phase: ${startPhase}`);
    console.log('');

    // Initialize state and continue workflow...
    // (Full implementation in your local copy)
  }

  /**
   * Main entry point - orchestrates the ENTIRE feature lifecycle
   */
  async orchestrateFeature(description, agentInvoker) {
    if (!agentInvoker) {
      throw new Error(
        'UnifiedOrchestrator requires an agentInvoker callback.\n\n' +
        'This callback should use the Task tool to spawn sub-agents.\n' +
        'Example: agentInvoker({ subagent_type: "brief-writer", prompt: "..." })'
      );
    }

    this.agentInvoker = agentInvoker;

    console.log('\n' + '='.repeat(80));
    console.log('🎯 UNIFIED ORCHESTRATOR - Starting Feature Development');
    console.log('='.repeat(80));
    console.log(`Session: ${this.sessionId}`);
    console.log(`Description: ${description.substring(0, 100)}...`);
    console.log('');

    // Execute all 4 phases: DISCOVER -> DESIGN -> BUILD -> FINALIZE
    // (Full implementation in your local copy)
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
}

module.exports = { UnifiedOrchestrator };

if (require.main === module) {
  console.log('Unified Orchestrator - THE Single Orchestrator');
  console.log('');
  console.log('This orchestrator is designed to be called from Claude Code main session');
  console.log('with an agentInvoker callback that uses the Task tool.');
  console.log('');
  console.log('Usage from Claude Code:');
  console.log('  const { UnifiedOrchestrator } = require("./agents/unified-orchestrator");');
  console.log('  const orchestrator = new UnifiedOrchestrator();');
  console.log('  await orchestrator.orchestrateFeature(description, agentInvoker);');
}
