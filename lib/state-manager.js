#!/usr/bin/env node
/**
 * @fileoverview State Manager - Persistent workflow state across sessions
 *
 * Solves the problem: Claude Code sessions are stateless, but multi-step
 * feature development requires knowing where you left off.
 *
 * State is saved to .dev-framework/state/ after every phase transition.
 */

const fs = require('fs');
const path = require('path');

class StateManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.stateDir = path.join(projectRoot, '.dev-framework', 'state');
    this.activeFeaturePath = path.join(this.stateDir, 'active-feature.json');
    this.historyDir = path.join(this.stateDir, 'history');

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.stateDir, this.historyDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get current active feature state (if any)
   */
  getActiveFeature() {
    if (!fs.existsSync(this.activeFeaturePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.activeFeaturePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read active feature state:', error.message);
      return null;
    }
  }

  /**
   * Start a new feature - creates initial state
   */
  startFeature(featureId, description) {
    const state = {
      featureId,
      description,
      phase: 'DISCOVER',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Phase artifacts
      brief: null,
      spec: null,
      blueprints: [],

      // Phase completion tracking
      phases: {
        discover: { status: 'pending', completedAt: null, artifacts: [] },
        design: { status: 'pending', completedAt: null, artifacts: [] },
        build: { status: 'pending', completedAt: null, artifacts: [] },
        finalize: { status: 'pending', completedAt: null, artifacts: [] }
      },

      // Decision log (for context)
      decisions: [],

      // Blockers encountered
      blockers: [],

      // Codex review results
      reviews: []
    };

    this.saveState(state);
    return state;
  }

  /**
   * Update phase status
   */
  updatePhase(phase, status, artifacts = []) {
    const state = this.getActiveFeature();
    if (!state) {
      throw new Error('No active feature. Call startFeature() first.');
    }

    state.phase = phase;
    state.phases[phase.toLowerCase()] = {
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      artifacts
    };
    state.updatedAt = new Date().toISOString();

    this.saveState(state);
    return state;
  }

  /**
   * Save brief to state
   */
  saveBrief(brief) {
    const state = this.getActiveFeature();
    if (!state) {
      throw new Error('No active feature.');
    }

    state.brief = brief;
    state.updatedAt = new Date().toISOString();

    const briefPath = path.join(this.stateDir, `${state.featureId}-brief.json`);
    fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));

    state.phases.discover.artifacts.push(briefPath);
    this.saveState(state);

    return briefPath;
  }

  /**
   * Save spec to state
   */
  saveSpec(spec) {
    const state = this.getActiveFeature();
    if (!state) {
      throw new Error('No active feature.');
    }

    state.spec = spec;
    state.updatedAt = new Date().toISOString();

    const specPath = path.join(this.stateDir, `${state.featureId}-spec.json`);
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

    state.phases.design.artifacts.push(specPath);
    this.saveState(state);

    return specPath;
  }

  /**
   * Log a blocker
   */
  logBlocker(blocker) {
    const state = this.getActiveFeature();
    if (!state) {
      throw new Error('No active feature.');
    }

    const blockerWithId = {
      id: `blocker-${Date.now()}`,
      timestamp: new Date().toISOString(),
      phase: state.phase,
      status: 'open',
      ...blocker
    };

    state.blockers.push(blockerWithId);
    state.updatedAt = new Date().toISOString();

    const blockerPath = path.join(this.stateDir, 'blockers', `${blockerWithId.id}.json`);
    fs.mkdirSync(path.dirname(blockerPath), { recursive: true });
    fs.writeFileSync(blockerPath, JSON.stringify(blockerWithId, null, 2));

    this.saveState(state);
    return blockerWithId;
  }

  /**
   * Complete the feature
   */
  completeFeature(success = true) {
    const state = this.getActiveFeature();
    if (!state) {
      throw new Error('No active feature.');
    }

    state.status = success ? 'completed' : 'failed';
    state.completedAt = new Date().toISOString();
    state.updatedAt = new Date().toISOString();

    // Move to history
    const historyPath = path.join(this.historyDir, `${state.featureId}.json`);
    fs.writeFileSync(historyPath, JSON.stringify(state, null, 2));

    // Remove active feature
    if (fs.existsSync(this.activeFeaturePath)) {
      fs.unlinkSync(this.activeFeaturePath);
    }

    return state;
  }

  /**
   * Get feature summary for context restoration
   */
  getFeatureSummary() {
    const state = this.getActiveFeature();
    if (!state) {
      return null;
    }

    return {
      featureId: state.featureId,
      description: state.description,
      currentPhase: state.phase,
      status: state.status,
      startedAt: state.startedAt,
      hasBrief: !!state.brief,
      hasSpec: !!state.spec,
      blueprintCount: state.blueprints.length,
      completedPhases: Object.entries(state.phases)
        .filter(([_, v]) => v.status === 'completed')
        .map(([k, _]) => k),
      pendingBlockers: state.blockers.filter(b => b.status === 'open').length,
      totalDecisions: state.decisions.length,
      totalReviews: state.reviews.length
    };
  }

  /**
   * Internal: Save state to disk
   */
  saveState(state) {
    fs.writeFileSync(this.activeFeaturePath, JSON.stringify(state, null, 2));
  }

  /**
   * List all features (active + history)
   */
  listFeatures() {
    const features = [];

    const active = this.getActiveFeature();
    if (active) {
      features.push({ ...active, location: 'active' });
    }

    if (fs.existsSync(this.historyDir)) {
      const historyFiles = fs.readdirSync(this.historyDir).filter(f => f.endsWith('.json'));

      for (const file of historyFiles) {
        try {
          const content = fs.readFileSync(path.join(this.historyDir, file), 'utf8');
          const feature = JSON.parse(content);
          features.push({ ...feature, location: 'history' });
        } catch (e) {
          // Skip invalid files
        }
      }
    }

    return features;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const sm = new StateManager();

  if (args[0] === 'status') {
    const summary = sm.getFeatureSummary();
    if (summary) {
      console.log('\n📊 Active Feature Status:');
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log('\n📊 No active feature');
    }
  } else if (args[0] === 'list') {
    const features = sm.listFeatures();
    console.log('\n📋 All Features:');
    features.forEach(f => {
      console.log(`  ${f.location === 'active' ? '🟢' : '⚪'} ${f.featureId} (${f.status}) - ${f.description?.substring(0, 50)}...`);
    });
  } else if (args[0] === 'start') {
    const desc = args.slice(1).join(' ') || 'New feature';
    const featureId = `feature-${Date.now()}`;
    sm.startFeature(featureId, desc);
    console.log(`\n✅ Started feature: ${featureId}`);
  } else {
    console.log('State Manager - Persistent workflow state');
    console.log('');
    console.log('Usage:');
    console.log('  node state-manager.js status   - Show active feature status');
    console.log('  node state-manager.js list     - List all features');
    console.log('  node state-manager.js start "description" - Start new feature');
  }
}

module.exports = { StateManager };
