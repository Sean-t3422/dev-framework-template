#!/usr/bin/env node
/**
 * @fileoverview Execution Runner
 *
 * Executes hierarchical orchestration plans created by master-orchestrator.
 * Used by Claude Code main session to run blueprints in parallel layers.
 *
 * Features:
 * - Layer-by-layer execution
 * - Parallel blueprint execution within layers
 * - Checkpoint tracking for crash recovery
 * - Plan validation before execution
 * - Progress reporting
 */

const fs = require('fs').promises;
const path = require('path');
const { ResourceLockManager } = require('./resource-lock-manager');
const { StateManager } = require('./state-manager');
const { ContextAssembler } = require('./context-assembler');

class ExecutionRunner {
  constructor(options = {}) {
    this.options = {
      maxConcurrent: 5,              // Max parallel blueprints
      enableCodexReviews: true,       // Codex review after each blueprint
      enableResourceLocking: true,    // Prevent conflicts
      enableContextSlicing: true,     // 95% token reduction
      checkpointFrequency: 'layer',   // 'layer' | 'blueprint' | 'never'
      ...options
    };

    this.lockManager = null;
    this.stateManager = null;
    this.contextAssembler = null;
    this.completedBlueprints = [];
    this.currentPlan = null;
  }

  /**
   * Execute an orchestration plan
   * @param {Object} plan - Execution plan from master-orchestrator
   * @param {Function} agentInvoker - Callback to invoke agents (Task tool)
   * @returns {Object} Execution result with stats
   */
  async executePlan(plan, agentInvoker) {
    if (!agentInvoker || typeof agentInvoker !== 'function') {
      throw new Error('agentInvoker callback is required');
    }

    this.agentInvoker = agentInvoker;
    this.currentPlan = plan;

    console.log('\n🚀 [Execution Runner] Starting plan execution');
    console.log(`   Plan ID: ${plan.id}`);
    console.log(`   Blueprints: ${plan.metadata.totalBlueprints}`);
    console.log(`   Layers: ${plan.metadata.totalLayers}`);
    console.log(`   Estimated time: ${plan.metadata.estimatedMinutes} minutes\n`);

    try {
      // 1. Validate plan hasn't become stale
      await this.validatePlan(plan);

      // 2. Check for existing checkpoint
      const checkpoint = await this.loadCheckpoint(plan.id);
      const startLayer = checkpoint ? checkpoint.currentLayer + 1 : 0;

      if (checkpoint) {
        console.log(`🔄 Resuming from checkpoint: Layer ${startLayer + 1}/${plan.layers.length}`);
        this.completedBlueprints = checkpoint.completedBlueprints || [];
      }

      // 3. Initialize components
      if (this.options.enableResourceLocking) {
        this.lockManager = new ResourceLockManager();
      }

      if (this.options.enableContextSlicing) {
        this.contextAssembler = new ContextAssembler(process.cwd());
        await this.contextAssembler.initialize();
      }

      // 4. Execute layers
      const startTime = Date.now();

      for (let i = startLayer; i < plan.layers.length; i++) {
        await this.executeLayer(i, plan.layers[i], plan);

        // Save checkpoint after each layer
        if (this.options.checkpointFrequency === 'layer') {
          await this.saveCheckpoint(plan.id, i);
        }
      }

      const totalTime = Math.floor((Date.now() - startTime) / 1000);

      console.log('\n✅ [Execution Runner] Plan execution completed successfully!');
      console.log(`   Total time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
      console.log(`   Blueprints completed: ${this.completedBlueprints.length}/${plan.metadata.totalBlueprints}\n`);

      // Clean up checkpoint
      await this.clearCheckpoint(plan.id);

      return {
        success: true,
        planId: plan.id,
        completedBlueprints: this.completedBlueprints.length,
        totalBlueprints: plan.metadata.totalBlueprints,
        totalTimeSeconds: totalTime,
        layersCompleted: plan.layers.length
      };

    } catch (error) {
      console.error('\n❌ [Execution Runner] Execution failed:', error.message);

      // Save checkpoint on failure for recovery
      if (this.options.checkpointFrequency !== 'never') {
        const currentLayer = Math.max(0, this.completedBlueprints.length - 1);
        await this.saveCheckpoint(plan.id, currentLayer);
      }

      throw error;
    }
  }

  /**
   * Execute a single layer
   */
  async executeLayer(layerIndex, layer, plan) {
    console.log(`\n=== Layer ${layerIndex + 1}/${plan.layers.length} ===`);
    console.log(`Blueprints: ${layer.length}`);
    console.log(`Strategy: ${layer.length > 1 ? 'Parallel' : 'Sequential'}\n`);

    const layerStartTime = Date.now();

    // Execute blueprints in parallel (with concurrency limit)
    const results = await this.executeBlueprintsInParallel(layer, plan);

    // Check for failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.error(`\n❌ Layer ${layerIndex + 1} failed: ${failures.length}/${layer.length} blueprints failed`);

      failures.forEach(f => {
        console.error(`   - ${f.blueprintName}: ${f.error}`);
      });

      throw new Error(`Layer ${layerIndex + 1} execution failed`);
    }

    const layerTime = Math.floor((Date.now() - layerStartTime) / 1000);
    console.log(`\n✅ Layer ${layerIndex + 1} completed in ${layerTime}s`);
  }

  /**
   * Execute blueprints in parallel with concurrency control
   */
  async executeBlueprintsInParallel(layer, plan) {
    const results = [];
    const executing = [];

    for (const blueprintId of layer) {
      // Wait if we hit max concurrent limit
      while (executing.length >= this.options.maxConcurrent) {
        await Promise.race(executing);
      }

      const blueprint = plan.blueprints.find(bp => bp.id === blueprintId);
      if (!blueprint) {
        console.error(`   ⚠️  Blueprint not found: ${blueprintId}`);
        continue;
      }

      // Execute blueprint
      const promise = this.executeBlueprint(blueprint, plan)
        .then(result => {
          const index = executing.indexOf(promise);
          if (index > -1) executing.splice(index, 1);
          results.push(result);
          return result;
        })
        .catch(error => {
          const index = executing.indexOf(promise);
          if (index > -1) executing.splice(index, 1);
          results.push({
            success: false,
            blueprintId: blueprint.id,
            blueprintName: blueprint.name,
            error: error.message
          });
        });

      executing.push(promise);
    }

    // Wait for all remaining to complete
    await Promise.all(executing);

    return results;
  }

  /**
   * Execute a single blueprint
   */
  async executeBlueprint(blueprint, plan) {
    console.log(`\n🔨 [${blueprint.id}] ${blueprint.name}`);

    try {
      // 1. Acquire resource locks (if enabled)
      if (this.options.enableResourceLocking && this.lockManager) {
        const lockResult = await this.lockManager.acquireLocks(blueprint);

        if (!lockResult.success) {
          console.log(`   → Waiting for locks (${lockResult.conflicts.length} conflicts)...`);

          // Retry every 2 seconds
          let retries = 0;
          while (retries < 30) { // Max 60 seconds wait
            await this.sleep(2000);
            const retryResult = await this.lockManager.acquireLocks(blueprint);

            if (retryResult.success) {
              break;
            }

            retries++;
          }

          if (retries >= 30) {
            throw new Error('Timeout waiting for resource locks');
          }
        }

        console.log(`   → Locks acquired`);
      }

      // 2. Assemble context slice (if enabled)
      let context = { schema: {}, conventions: {} };

      if (this.options.enableContextSlicing && this.contextAssembler) {
        console.log(`   → Assembling context slice...`);
        context = await this.contextAssembler.assembleContextForBlueprint(
          blueprint,
          this.completedBlueprints
        );

        const savings = context.tokenSavings || 0;
        console.log(`   → Context prepared (${savings}% token reduction)`);
      }

      // 3. Build prompt for sub-agent
      const prompt = this.buildBlueprintPrompt(blueprint, context);

      // 4. Invoke sub-agent
      console.log(`   → Spawning sub-agent...`);

      const result = await this.agentInvoker({
        subagent_type: 'general-purpose',
        description: `Execute blueprint: ${blueprint.name}`,
        prompt
      });

      console.log(`   → Sub-agent completed`);

      // 5. Codex review (if enabled)
      if (this.options.enableCodexReviews) {
        console.log(`   → Codex reviewing...`);

        const reviewPrompt = this.buildCodexReviewPrompt(blueprint, result);

        const review = await this.agentInvoker({
          subagent_type: 'codex-reviewer',
          description: `Review blueprint: ${blueprint.name}`,
          prompt: reviewPrompt
        });

        const approved = this.parseCodexReview(review);

        if (!approved) {
          console.error(`   ⚠️  Codex rejected implementation`);
          throw new Error('Codex review rejected');
        }

        console.log(`   → Codex approved`);
      }

      // 6. Release locks
      if (this.options.enableResourceLocking && this.lockManager) {
        this.lockManager.releaseLocks(blueprint.id);
      }

      // 7. Track completion
      this.completedBlueprints.push({
        id: blueprint.id,
        name: blueprint.name,
        type: blueprint.type,
        completedAt: new Date().toISOString()
      });

      // Save checkpoint per blueprint if configured
      if (this.options.checkpointFrequency === 'blueprint') {
        await this.saveCheckpoint(this.currentPlan.id, -1);
      }

      console.log(`   ✅ Completed`);

      return {
        success: true,
        blueprintId: blueprint.id,
        blueprintName: blueprint.name
      };

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);

      // Release locks on failure
      if (this.options.enableResourceLocking && this.lockManager) {
        this.lockManager.releaseLocks(blueprint.id);
      }

      throw error;
    }
  }

  /**
   * Build prompt for sub-agent execution
   */
  buildBlueprintPrompt(blueprint, context) {
    return `You are executing a prescriptive blueprint as part of a hierarchical orchestration system.

# Blueprint: ${blueprint.name}

${blueprint.description}

## Type
${(blueprint.type || 'general').toUpperCase()} blueprint

## Specifications (MUST FOLLOW 100%)

${JSON.stringify(blueprint.specifications, null, 2)}

## Resources

${this.formatResources(blueprint.resources)}

## Context

### Database Schema (relevant tables only)
${JSON.stringify(context.schema || {}, null, 2)}

### Project Conventions
${JSON.stringify(context.conventions || {}, null, 2)}

## Validation Rules

⚠️  **CRITICAL**: You MUST follow these rules:

1. **Use exact names** specified in the specifications
2. **DO NOT** invent new table, column, or function names
3. **DO NOT** change the architecture or structure
4. **DO NOT** add features not in the specifications
5. **Follow prescriptive instructions 100%** - no creativity allowed

## Task Instructions

${this.getTaskInstructions(blueprint)}

## What to Report

After completing the task, report:
1. Files created (with full paths)
2. Files modified (with full paths)
3. Any issues or errors encountered
4. Confirmation that specifications were followed exactly`;
  }

  /**
   * Format resources for display
   */
  formatResources(resources) {
    const lines = [];

    if (resources.tables && resources.tables.length > 0) {
      lines.push(`Tables: ${resources.tables.join(', ')}`);
    }
    if (resources.migrations && resources.migrations.length > 0) {
      lines.push(`Migrations: ${resources.migrations.join(', ')}`);
    }
    if (resources.routes && resources.routes.length > 0) {
      lines.push(`Routes: ${resources.routes.join(', ')}`);
    }
    if (resources.components && resources.components.length > 0) {
      lines.push(`Components: ${resources.components.join(', ')}`);
    }
    if (resources.functions && resources.functions.length > 0) {
      lines.push(`Functions: ${resources.functions.join(', ')}`);
    }

    return lines.length > 0 ? lines.join('\n') : 'None';
  }

  /**
   * Get task-specific instructions based on blueprint type
   */
  getTaskInstructions(blueprint) {
    switch (blueprint.type) {
      case 'database':
        return `Create the database migration file at the specified path with the exact schema.
Include all columns, constraints, indexes, and RLS policies as specified.`;

      case 'api':
        return `Create the API route handler at the specified path.
Implement the exact endpoints, request validation, and response format as specified.`;

      case 'service':
        return `Create the service function at the specified path.
Implement the exact function signature and logic as specified.`;

      case 'ui':
        return `Create the UI component at the specified path.
Follow the exact component structure, props, and styling as specified.`;

      default:
        return `Execute the blueprint according to the specifications.`;
    }
  }

  /**
   * Build prompt for Codex review
   */
  buildCodexReviewPrompt(blueprint, result) {
    return `Review this blueprint implementation for security, quality, and spec compliance.

# Blueprint

Name: ${blueprint.name}
Type: ${blueprint.type}
Description: ${blueprint.description}

## Expected Outputs (from spec)

${JSON.stringify(blueprint.specifications, null, 2)}

## Actual Implementation

Files created: ${result.filesCreated?.join(', ') || 'unknown'}
Files modified: ${result.filesModified?.join(', ') || 'unknown'}

## Review Checklist

Please check:

1. **Security**
   - RLS policies present and correct (for database blueprints)
   - Input validation (for API blueprints)
   - XSS/CSRF protection (for UI blueprints)
   - No hardcoded credentials or secrets

2. **Code Quality**
   - Follows project conventions
   - Proper error handling
   - Clear naming
   - Maintainable structure

3. **Regression Risk**
   - No breaking changes to existing code
   - Migrations are reversible (if applicable)
   - No unintended side effects

4. **Engineering Balance**
   - Not over-engineered (unnecessary complexity)
   - Not under-engineered (missing critical features)
   - Appropriate for the task

5. **Spec Compliance**
   - 100% faithful to specifications
   - All required fields/endpoints present
   - No creative additions beyond spec

## Response Format

Provide your review as:

**APPROVED** - If all checks pass
OR
**REJECTED** - If critical issues found

If rejected, explain the specific issues that MUST be fixed.`;
  }

  /**
   * Parse Codex review result
   */
  parseCodexReview(review) {
    const reviewText = (review.response || review.toString()).toLowerCase();

    if (reviewText.includes('approved')) {
      return true;
    }

    if (reviewText.includes('rejected')) {
      return false;
    }

    // If unclear, default to NOT approved (fail-safe)
    return false;
  }

  /**
   * Validate plan before execution
   */
  async validatePlan(plan) {
    if (!plan.spec || !plan.spec.checksum) {
      console.log('   ⚠️  No spec checksum - skipping validation');
      return;
    }

    if (!plan.spec.path) {
      return;
    }

    try {
      const { MasterOrchestrator } = require('../../agents/master-orchestrator');
      const orchestrator = new MasterOrchestrator();

      const validation = await orchestrator.validatePlan(plan);

      if (!validation.valid) {
        throw new Error(`Plan is stale: ${validation.reason}. Please regenerate the plan.`);
      }

      console.log('   ✅ Plan validation passed\n');

    } catch (error) {
      if (error.message.includes('stale')) {
        throw error;
      }
      console.log(`   ⚠️  Could not validate plan: ${error.message}\n`);
    }
  }

  /**
   * Load checkpoint from disk
   */
  async loadCheckpoint(planId) {
    const checkpointPath = path.join(
      process.cwd(),
      '.dev-framework',
      'execution',
      `checkpoint-${planId}.json`
    );

    try {
      const data = await fs.readFile(checkpointPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`   ⚠️  Could not load checkpoint: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Save checkpoint to disk
   */
  async saveCheckpoint(planId, currentLayer) {
    const checkpointDir = path.join(
      process.cwd(),
      '.dev-framework',
      'execution'
    );

    const checkpointPath = path.join(
      checkpointDir,
      `checkpoint-${planId}.json`
    );

    const checkpoint = {
      planId,
      currentLayer,
      completedBlueprints: this.completedBlueprints,
      savedAt: new Date().toISOString()
    };

    try {
      await fs.mkdir(checkpointDir, { recursive: true });
      await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    } catch (error) {
      console.warn(`   ⚠️  Could not save checkpoint: ${error.message}`);
    }
  }

  /**
   * Clear checkpoint after successful execution
   */
  async clearCheckpoint(planId) {
    const checkpointPath = path.join(
      process.cwd(),
      '.dev-framework',
      'execution',
      `checkpoint-${planId}.json`
    );

    try {
      await fs.unlink(checkpointPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        console.warn(`   ⚠️  Could not clear checkpoint: ${error.message}`);
      }
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { ExecutionRunner };
