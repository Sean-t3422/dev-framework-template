#!/usr/bin/env node
/**
 * @fileoverview Master Orchestrator - PLANNER ONLY
 *
 * Creates execution plans for hierarchical task orchestration.
 * DOES NOT EXECUTE - returns plan for Claude Code main session to execute.
 *
 * Architecture:
 *   Spec → Blueprint Decomposer → Master Orchestrator (THIS)
 *       ↓
 *   Build DAG + Analyze Dependencies
 *       ↓
 *   Generate Execution Layers
 *       ↓
 *   RETURN PLAN (Claude Code executes it)
 */

const { DependencyGraphBuilder } = require('../lib/orchestration/dependency-graph-builder');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MasterOrchestrator {
  constructor(options = {}) {
    this.options = {
      ...options
    };

    this.dagBuilder = new DependencyGraphBuilder();
  }

  /**
   * Main orchestration entry point
   * Returns an execution plan WITHOUT executing it
   */
  async orchestrateFeature(spec, projectPath) {
    console.log('\n🎯 [Master Orchestrator] Creating execution plan');
    console.log(`   Feature: ${spec.name}`);
    console.log(`   Project: ${projectPath}\n`);

    try {
      // 1. Decompose feature into blueprints
      console.log('📋 Step 1: Decomposing feature into blueprints...');
      const blueprints = await this.decomposeFeature(spec, projectPath);

      console.log(`   Generated ${blueprints.length} blueprints\n`);

      // 2. Build dependency graph
      console.log('🔗 Step 2: Building dependency graph...');
      for (const bp of blueprints) {
        this.dagBuilder.addBlueprint(bp);
      }

      this.dagBuilder.detectResourceConflicts();

      const cycles = this.dagBuilder.detectCycles();
      if (cycles.length > 0) {
        throw new Error(`Circular dependencies detected: ${JSON.stringify(cycles)}`);
      }

      const layers = this.dagBuilder.generateExecutionLayers();
      console.log(`   Created ${layers.length} execution layers\n`);

      this.dagBuilder.visualizeLayers(layers);

      // 3. Calculate estimates
      console.log('📊 Step 3: Calculating estimates...');
      const estimatedTime = this.calculateEstimatedTime(blueprints, layers);
      const parallelizationPotential = this.calculateParallelizationPotential(layers);
      const maxParallelism = Math.max(...layers.map(l => l.length));

      console.log(`   Estimated time: ${estimatedTime} minutes`);
      console.log(`   Parallelization potential: ${Math.round(parallelizationPotential * 100)}%`);
      console.log(`   Max parallel blueprints: ${maxParallelism}\n`);

      // 4. Calculate spec checksum for staleness detection
      const specChecksum = await this.calculateSpecChecksum(spec);

      // 5. Build and return execution plan
      const plan = {
        id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),

        spec: {
          name: spec.name,
          path: spec.path,
          checksum: specChecksum
        },

        blueprints,
        layers,

        metadata: {
          totalBlueprints: blueprints.length,
          totalLayers: layers.length,
          estimatedMinutes: estimatedTime,
          parallelizationPotential,
          maxParallelism,

          // Breakdown by type
          databaseBlueprints: blueprints.filter(bp => bp.type === 'database').length,
          apiBlueprints: blueprints.filter(bp => bp.type === 'api').length,
          uiBlueprints: blueprints.filter(bp => bp.type === 'ui').length,
          serviceBlueprints: blueprints.filter(bp => bp.type === 'service').length
        },

        executionStrategy: 'Execute layers sequentially, blueprints in parallel within each layer'
      };

      console.log('✅ Execution plan created successfully\n');

      // Display plan summary
      this.displayPlanSummary(plan);

      return plan;

    } catch (error) {
      console.error('\n❌ [Master Orchestrator] Plan creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Decompose feature into prescriptive blueprints
   */
  async decomposeFeature(spec, projectPath) {
    const { BlueprintDecomposer } = require('./blueprint-decomposer');

    const decomposer = new BlueprintDecomposer();
    const blueprints = await decomposer.decomposeSpec(spec, projectPath);

    return blueprints;
  }

  /**
   * Calculate estimated time for execution
   * Based on blueprint complexity and parallelization
   */
  calculateEstimatedTime(blueprints, layers) {
    // Base time per blueprint type (minutes)
    const timeEstimates = {
      database: 8,    // Migrations + RLS
      api: 7,         // API routes with validation
      service: 6,     // Service functions
      ui: 10,         // UI components + styling
      test: 5,        // Test files
      other: 7        // Default
    };

    // Calculate sequential time (if no parallelization)
    let sequentialTime = 0;
    for (const bp of blueprints) {
      const baseTime = timeEstimates[bp.type] || timeEstimates.other;
      sequentialTime += baseTime;
    }

    // Calculate parallel time (accounting for layers)
    let parallelTime = 0;
    for (const layer of layers) {
      // Time for layer = time of longest blueprint in that layer
      const layerTime = Math.max(
        ...layer.map(bpId => {
          const bp = blueprints.find(b => b.id === bpId);
          if (!bp) {
            console.warn(`   ⚠️  Blueprint not found: ${bpId}`);
            return timeEstimates.other;
          }
          return timeEstimates[bp.type] || timeEstimates.other;
        })
      );
      parallelTime += layerTime;
    }

    // Add overhead for reviews (2 min per blueprint)
    const reviewTime = blueprints.length * 2;

    return Math.round(parallelTime + reviewTime);
  }

  /**
   * Calculate parallelization potential (0-1 scale)
   */
  calculateParallelizationPotential(layers) {
    if (layers.length === 0) return 0;

    // Count total "slots" if all layers were fully parallel
    const totalSlots = layers.reduce((sum, layer) => sum + layer.length, 0);

    // Count actual parallel opportunities (blueprints beyond first in each layer)
    const parallelSlots = layers.reduce((sum, layer) => {
      return sum + Math.max(0, layer.length - 1);
    }, 0);

    // Ratio of parallel work to total work
    return parallelSlots / totalSlots;
  }

  /**
   * Calculate checksum of spec content for staleness detection
   */
  async calculateSpecChecksum(spec) {
    let content = '';

    if (spec.path) {
      try {
        content = await fs.readFile(spec.path, 'utf8');
      } catch (error) {
        console.warn(`   ⚠️  Could not read spec file: ${error.message}`);
        content = spec.content || '';
      }
    } else {
      content = spec.content || '';
    }

    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Display plan summary
   */
  displayPlanSummary(plan) {
    console.log('📊 Execution Plan Summary:');
    console.log(`   Plan ID: ${plan.id}`);
    console.log(`   Blueprints: ${plan.metadata.totalBlueprints}`);
    console.log(`   Layers: ${plan.metadata.totalLayers}`);
    console.log(`   Estimated time: ${plan.metadata.estimatedMinutes} minutes`);
    console.log(`   Parallelization: ${Math.round(plan.metadata.parallelizationPotential * 100)}%`);
    console.log(`   Max concurrent: ${plan.metadata.maxParallelism} blueprints\n`);

    console.log('📋 Blueprint Breakdown:');
    console.log(`   Database: ${plan.metadata.databaseBlueprints}`);
    console.log(`   API: ${plan.metadata.apiBlueprints}`);
    console.log(`   Services: ${plan.metadata.serviceBlueprints}`);
    console.log(`   UI: ${plan.metadata.uiBlueprints}\n`);

    console.log('🔀 Execution Layers:');
    for (let i = 0; i < plan.layers.length; i++) {
      const layer = plan.layers[i];
      const blueprintNames = layer.map(bpId => {
        const bp = plan.blueprints.find(b => b.id === bpId);
        return bp ? bp.name : `[Unknown: ${bpId}]`;
      });

      console.log(`   Layer ${i + 1}: ${layer.length} blueprint${layer.length > 1 ? 's' : ''} ${layer.length > 1 ? '(parallel)' : '(sequential)'}`);
      blueprintNames.forEach(name => {
        console.log(`      - ${name}`);
      });
    }
    console.log('');
  }

  /**
   * Validate plan before execution
   * Checks if spec has changed since plan was created
   */
  async validatePlan(plan) {
    if (!plan.spec.path) {
      return { valid: true };
    }

    try {
      const currentChecksum = await this.calculateSpecChecksum({
        path: plan.spec.path
      });

      if (currentChecksum !== plan.spec.checksum) {
        return {
          valid: false,
          reason: 'Spec has changed since plan was created',
          currentChecksum,
          planChecksum: plan.spec.checksum
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Could not validate spec: ${error.message}`
      };
    }
  }
}

// CLI entry point (for testing)
if (require.main === module) {
  const spec = {
    name: 'Test Feature',
    path: process.argv[2] || './spec.md',
    content: 'Test spec content'
  };

  const projectPath = process.cwd();

  const orchestrator = new MasterOrchestrator();
  orchestrator.orchestrateFeature(spec, projectPath)
    .then(plan => {
      console.log('✅ Plan created successfully');

      // Save plan to file
      const planPath = path.join(projectPath, '.dev-framework', 'plans', `${plan.id}.json`);
      require('fs').mkdirSync(path.dirname(planPath), { recursive: true });
      require('fs').writeFileSync(planPath, JSON.stringify(plan, null, 2));

      console.log(`\n💾 Plan saved to: ${planPath}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Plan creation failed:', err);
      process.exit(1);
    });
}

module.exports = { MasterOrchestrator };
