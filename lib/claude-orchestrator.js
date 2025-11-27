#!/usr/bin/env node
/**
 * @fileoverview Claude Orchestrator - THE Single Source of Truth
 *
 * This is a HELPER for Claude Code, not a replacement for it.
 * Claude Code IS the orchestrator - this file provides:
 *   1. Phase tracking and validation
 *   2. State persistence
 *   3. Context restoration
 *   4. Checkpoint enforcement
 *
 * CRITICAL DESIGN DECISION:
 * - JS cannot invoke Claude Code agents (Task tool)
 * - Claude Code cannot be called from JS hooks
 * - Therefore: Claude Code drives, JS helpers assist
 *
 * Usage from Claude Code:
 *   1. Read current state: node lib/claude-orchestrator.js status
 *   2. Validate phase transition: node lib/claude-orchestrator.js validate-transition DISCOVER DESIGN
 *   3. Save checkpoint: node lib/claude-orchestrator.js checkpoint "brief completed"
 */

const fs = require('fs');
const path = require('path');
const { StateManager } = require('./state-manager');

class ClaudeOrchestrator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.stateManager = new StateManager(projectRoot);

    // Phase sequence - cannot skip phases
    this.phases = ['DISCOVER', 'DESIGN', 'BUILD', 'FINALIZE'];

    // What each phase requires before it can be entered
    this.phaseRequirements = {
      DISCOVER: [],
      DESIGN: ['brief'],
      BUILD: ['brief', 'spec'],
      FINALIZE: ['brief', 'spec', 'implementation']
    };

    // Codex checkpoints per phase
    this.checkpoints = {
      DISCOVER: ['brief_review'],
      DESIGN: ['spec_review', 'test_strategy_review'],
      BUILD: ['migration_review', 'api_review', 'ui_review', 'integration_review'],
      FINALIZE: ['final_review']
    };
  }

  /**
   * Get current workflow status
   */
  getStatus() {
    const feature = this.stateManager.getActiveFeature();

    if (!feature) {
      return {
        hasActiveFeature: false,
        message: 'No active feature. Start with: startFeature(description)'
      };
    }

    const summary = this.stateManager.getFeatureSummary();
    const nextActions = this.getNextActions(feature);
    const requiredCheckpoints = this.getPendingCheckpoints(feature);

    return {
      hasActiveFeature: true,
      feature: summary,
      currentPhase: feature.phase,
      nextActions,
      pendingCheckpoints: requiredCheckpoints,
      canAdvance: requiredCheckpoints.length === 0
    };
  }

  /**
   * Start a new feature
   */
  startFeature(description) {
    const existing = this.stateManager.getActiveFeature();

    if (existing) {
      return {
        success: false,
        error: `Active feature exists: ${existing.featureId}. Complete or abandon it first.`,
        existingFeature: existing.featureId
      };
    }

    const featureId = `feature-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const state = this.stateManager.startFeature(featureId, description);

    return {
      success: true,
      featureId,
      phase: 'DISCOVER',
      message: `Feature started. Begin DISCOVER phase.`,
      nextActions: this.getNextActions(state)
    };
  }

  /**
   * Validate if a phase transition is allowed
   */
  validateTransition(fromPhase, toPhase) {
    const feature = this.stateManager.getActiveFeature();

    if (!feature) {
      return { allowed: false, reason: 'No active feature' };
    }

    // Check phase sequence
    const fromIndex = this.phases.indexOf(fromPhase);
    const toIndex = this.phases.indexOf(toPhase);

    if (toIndex !== fromIndex + 1) {
      return {
        allowed: false,
        reason: `Cannot skip from ${fromPhase} to ${toPhase}. Next phase is ${this.phases[fromIndex + 1]}`
      };
    }

    // Check requirements for target phase
    const requirements = this.phaseRequirements[toPhase];
    const missing = [];

    if (requirements.includes('brief') && !feature.brief) {
      missing.push('brief');
    }
    if (requirements.includes('spec') && !feature.spec) {
      missing.push('spec');
    }

    if (missing.length > 0) {
      return {
        allowed: false,
        reason: `Missing required artifacts: ${missing.join(', ')}`
      };
    }

    // Check pending checkpoints
    const pendingCheckpoints = this.getPendingCheckpoints(feature);
    if (pendingCheckpoints.length > 0) {
      return {
        allowed: false,
        reason: `Pending Codex checkpoints: ${pendingCheckpoints.join(', ')}`
      };
    }

    return { allowed: true };
  }

  /**
   * Advance to next phase
   */
  advancePhase() {
    const feature = this.stateManager.getActiveFeature();

    if (!feature) {
      return { success: false, error: 'No active feature' };
    }

    const currentIndex = this.phases.indexOf(feature.phase);
    const nextPhase = this.phases[currentIndex + 1];

    if (!nextPhase) {
      return { success: false, error: 'Already at final phase' };
    }

    const validation = this.validateTransition(feature.phase, nextPhase);

    if (!validation.allowed) {
      return { success: false, error: validation.reason };
    }

    // Mark current phase complete
    this.stateManager.updatePhase(feature.phase, 'completed');

    // Start next phase
    this.stateManager.updatePhase(nextPhase, 'in_progress');

    return {
      success: true,
      previousPhase: feature.phase,
      currentPhase: nextPhase,
      nextActions: this.getNextActions(this.stateManager.getActiveFeature())
    };
  }

  /**
   * Record a Codex checkpoint review
   */
  recordCheckpoint(checkpointName, result) {
    const feature = this.stateManager.getActiveFeature();

    if (!feature) {
      return { success: false, error: 'No active feature' };
    }

    this.stateManager.logReview({
      checkpoint: checkpointName,
      approved: result.approved,
      issues: result.issues || [],
      recommendations: result.recommendations || []
    });

    return {
      success: true,
      checkpointName,
      approved: result.approved,
      pendingCheckpoints: this.getPendingCheckpoints(this.stateManager.getActiveFeature())
    };
  }

  /**
   * Get pending checkpoints for current phase
   */
  getPendingCheckpoints(feature) {
    const phaseCheckpoints = this.checkpoints[feature.phase] || [];
    const completedCheckpoints = feature.reviews
      .filter(r => r.phase === feature.phase && r.approved)
      .map(r => r.checkpoint);

    return phaseCheckpoints.filter(cp => !completedCheckpoints.includes(cp));
  }

  /**
   * Get recommended next actions
   */
  getNextActions(feature) {
    const actions = [];

    switch (feature.phase) {
      case 'DISCOVER':
        if (!feature.brief) {
          actions.push({
            action: 'create_brief',
            description: 'Create feature brief with discovery questions',
            agent: 'brief-writer'
          });
        } else {
          actions.push({
            action: 'review_brief',
            description: 'Get Codex review of brief',
            checkpoint: 'brief_review'
          });
        }
        break;

      case 'DESIGN':
        if (!feature.spec) {
          actions.push({
            action: 'create_spec',
            description: 'Create technical specification',
            agent: 'spec-writer'
          });
        } else {
          const pendingDesignCheckpoints = this.getPendingCheckpoints(feature);
          pendingDesignCheckpoints.forEach(cp => {
            actions.push({
              action: `checkpoint_${cp}`,
              description: `Complete Codex checkpoint: ${cp}`,
              checkpoint: cp
            });
          });
        }
        break;

      case 'BUILD':
        actions.push({
          action: 'analyze_complexity',
          description: 'Run complexity analysis to determine orchestration approach',
          command: 'node utils/complexity-detector.js'
        });
        break;

      case 'FINALIZE':
        actions.push({
          action: 'final_review',
          description: 'Run final Codex security and performance review',
          checkpoint: 'final_review'
        });
        break;
    }

    return actions;
  }

  /**
   * Get context capsule for agent handoff
   * This is what agents need to understand the full feature context
   */
  getContextCapsule() {
    const feature = this.stateManager.getActiveFeature();

    if (!feature) {
      return null;
    }

    return {
      // Feature identity
      featureId: feature.featureId,
      description: feature.description,

      // Current position
      phase: feature.phase,
      status: feature.status,

      // Key artifacts (summaries, not full content)
      briefSummary: feature.brief ? this.summarizeBrief(feature.brief) : null,
      specSummary: feature.spec ? this.summarizeSpec(feature.spec) : null,

      // Decision context
      keyDecisions: feature.decisions.slice(-5), // Last 5 decisions

      // Requirements/constraints
      requirements: feature.brief?.requirements || [],

      // What's been reviewed
      approvedCheckpoints: feature.reviews
        .filter(r => r.approved)
        .map(r => r.checkpoint),

      // Active blockers
      blockers: feature.blockers.filter(b => b.status === 'open')
    };
  }

  /**
   * Summarize brief for context capsule
   */
  summarizeBrief(brief) {
    if (!brief) return null;

    return {
      title: brief.title,
      vision: brief.vision?.substring(0, 200),
      requirementCount: brief.requirements?.length || 0,
      approvedBy: brief.approvedBy
    };
  }

  /**
   * Summarize spec for context capsule
   */
  summarizeSpec(spec) {
    if (!spec) return null;

    return {
      title: spec.title,
      componentCount: spec.components?.length || 0,
      testStrategyType: spec.testStrategy?.type,
      architecturePattern: spec.architecture?.pattern
    };
  }

  /**
   * Abandon current feature
   */
  abandonFeature(reason) {
    const feature = this.stateManager.getActiveFeature();

    if (!feature) {
      return { success: false, error: 'No active feature' };
    }

    this.stateManager.logDecision({
      type: 'abandon',
      reason
    });

    return this.stateManager.completeFeature(false);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const orchestrator = new ClaudeOrchestrator();

  const command = args[0];

  switch (command) {
    case 'status':
      const status = orchestrator.getStatus();
      console.log('\n📊 Workflow Status:');
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'start':
      const description = args.slice(1).join(' ') || 'New feature';
      const result = orchestrator.startFeature(description);
      console.log('\n🚀 Start Feature:');
      console.log(JSON.stringify(result, null, 2));
      break;

    case 'validate-transition':
      const [from, to] = args.slice(1);
      const validation = orchestrator.validateTransition(from, to);
      console.log('\n✅ Validate Transition:');
      console.log(JSON.stringify(validation, null, 2));
      break;

    case 'advance':
      const advanceResult = orchestrator.advancePhase();
      console.log('\n➡️ Advance Phase:');
      console.log(JSON.stringify(advanceResult, null, 2));
      break;

    case 'context':
      const context = orchestrator.getContextCapsule();
      console.log('\n📦 Context Capsule:');
      console.log(JSON.stringify(context, null, 2));
      break;

    case 'checkpoint':
      const checkpointName = args[1];
      const approved = args[2] !== 'false';
      const cpResult = orchestrator.recordCheckpoint(checkpointName, { approved });
      console.log('\n✓ Checkpoint Recorded:');
      console.log(JSON.stringify(cpResult, null, 2));
      break;

    default:
      console.log('Claude Orchestrator - Workflow State Management');
      console.log('');
      console.log('Usage:');
      console.log('  node claude-orchestrator.js status                    - Get current status');
      console.log('  node claude-orchestrator.js start "description"       - Start new feature');
      console.log('  node claude-orchestrator.js validate-transition FROM TO - Check if transition allowed');
      console.log('  node claude-orchestrator.js advance                   - Move to next phase');
      console.log('  node claude-orchestrator.js context                   - Get context capsule');
      console.log('  node claude-orchestrator.js checkpoint NAME [true/false] - Record checkpoint');
      console.log('');
      console.log('Phases: DISCOVER → DESIGN → BUILD → FINALIZE');
  }
}

module.exports = { ClaudeOrchestrator };
