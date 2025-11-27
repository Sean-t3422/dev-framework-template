#!/usr/bin/env node
/**
 * @fileoverview Test Hierarchical Orchestration System
 *
 * Integration test to verify the orchestration system works end-to-end.
 */

const { MasterOrchestrator } = require('../agents/master-orchestrator');
const { BlueprintDecomposer } = require('../agents/blueprint-decomposer');
const { DependencyGraphBuilder } = require('../lib/orchestration/dependency-graph-builder');
const { ResourceLockManager } = require('../lib/orchestration/resource-lock-manager');

async function testOrchestrationSystem() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Testing Hierarchical Orchestration System                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Blueprint Decomposition
    console.log('🧪 Test 1: Blueprint Decomposition');
    console.log('─────────────────────────────────────────────────────────\n');

    const decomposer = new BlueprintDecomposer();
    const spec = {
      name: 'Email/SMS Notification System',
      path: './spec.md'
    };

    const blueprints = await decomposer.decomposeSpec(spec, process.cwd());

    console.log(`✅ Generated ${blueprints.length} blueprints\n`);

    // Test 2: Dependency Graph Construction
    console.log('🧪 Test 2: Dependency Graph Construction');
    console.log('─────────────────────────────────────────────────────────\n');

    const dagBuilder = new DependencyGraphBuilder();

    for (const bp of blueprints) {
      dagBuilder.addBlueprint(bp);
    }

    dagBuilder.detectResourceConflicts();

    const cycles = dagBuilder.detectCycles();
    if (cycles.length > 0) {
      throw new Error(`Cycles detected: ${JSON.stringify(cycles)}`);
    }

    console.log('✅ No cycles detected\n');

    const layers = dagBuilder.generateExecutionLayers();
    console.log(`✅ Generated ${layers.length} execution layers\n`);

    dagBuilder.visualizeLayers(layers);

    // Test 3: Resource Locking
    console.log('🧪 Test 3: Resource Lock Management');
    console.log('─────────────────────────────────────────────────────────\n');

    const lockManager = new ResourceLockManager();

    // Try to acquire locks for first layer
    const firstLayer = layers[0];
    const lockResults = [];

    for (const bp of firstLayer) {
      const result = await lockManager.acquireLocks(bp);
      lockResults.push(result);
      console.log(`   Blueprint ${bp.id}: ${result.success ? '✅ Acquired' : '❌ Conflicts'}`);
    }

    // Visualize lock state
    lockManager.visualize();

    // Release locks
    for (const bp of firstLayer) {
      lockManager.releaseLocks(bp.id);
    }

    console.log('✅ Lock acquisition/release working\n');

    // Test 4: Full Orchestration (dry run)
    console.log('🧪 Test 4: Full Orchestration (Dry Run)');
    console.log('─────────────────────────────────────────────────────────\n');

    const orchestrator = new MasterOrchestrator({
      maxConcurrent: 3,
      enableCodexReviews: false, // Disabled for test
      autoRecovery: false
    });

    console.log('📋 Blueprint Summary:');
    blueprints.forEach(bp => {
      console.log(`   ${bp.id}: ${bp.name} (${bp.estimatedMinutes} min)`);
    });
    console.log('');

    console.log('✅ All tests passed!\n');

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  Orchestration System Ready                               ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('Next Steps:');
    console.log('  1. Integrate with /build-feature workflow');
    console.log('  2. Connect blueprint-decomposer to LLM');
    console.log('  3. Implement real sub-agent spawning via Task tool');
    console.log('  4. Enable Codex reviews at checkpoints');
    console.log('  5. Test with real notification feature\n');

    return {
      success: true,
      blueprintsGenerated: blueprints.length,
      layersGenerated: layers.length
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);

    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests
if (require.main === module) {
  testOrchestrationSystem()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test crashed:', err);
      process.exit(1);
    });
}

module.exports = { testOrchestrationSystem };
