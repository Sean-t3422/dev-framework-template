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

    // Store brief content for context capsules (AGENTS.md pattern)
    this.briefContent = null;
  }

  /**
   * Resume orchestration from an existing brief
   * Skips Phase 1 (DISCOVER) and starts at Phase 2 (DESIGN)
   *
   * @param {string} briefPathOrContent - Path to brief file OR brief content directly
   * @param {Function} agentInvoker - Callback to invoke agents via Task tool
   * @param {Object} options - Resume options
   * @param {string} options.startPhase - 'DESIGN' | 'BUILD' | 'FINALIZE' (default: 'DESIGN')
   * @param {Object} options.existingSpec - If resuming from BUILD, provide existing spec
   * @param {Object} options.existingPlan - If resuming from BUILD, provide existing plan
   * @returns {Promise<Object>} - Complete result with evidence
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
      // Likely content, not a path
      briefContent = briefPathOrContent;
    } else {
      // Treat as file path
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
    console.log(`Brief: ${briefContent.substring(0, 100)}...`);
    console.log('');

    try {
      // Initialize state
      const featureId = this.stateManager.startFeature(
        `feature-${Date.now()}`,
        'Resumed from existing brief'
      );

      // Mark Phase 1 as already complete
      this.todos.brief = [
        { id: 'brief-1', task: 'Generate discovery questions', status: 'completed' },
        { id: 'brief-2', task: 'Get user answers', status: 'completed' },
        { id: 'brief-3', task: 'Create requirements brief', status: 'completed' },
        { id: 'brief-4', task: 'Codex review brief', status: 'completed' },
        { id: 'brief-5', task: 'User confirmation', status: 'completed' }
      ];

      console.log('📋 Phase 1 (DISCOVER) - Using existing brief ✅');

      // Save brief
      this.stateManager.saveBrief({ content: briefContent, approved: true, resumed: true });

      let spec, implementation, result;

      // Start from the specified phase
      if (startPhase === 'DESIGN' || startPhase === 'BUILD' || startPhase === 'FINALIZE') {
        // ============================================
        // PHASE 2: DESIGN (if starting here or earlier)
        // ============================================
        if (startPhase === 'DESIGN') {
          this.currentPhase = 'DESIGN';
          console.log('\n🏗️ PHASE 2: DESIGN');
          console.log('-'.repeat(40));
          spec = await this.phaseDesign(briefContent);
        } else if (options.existingSpec) {
          spec = options.existingSpec;
          console.log('🏗️ Phase 2 (DESIGN) - Using existing spec ✅');
        } else {
          throw new Error('startPhase is BUILD/FINALIZE but no existingSpec provided');
        }
      }

      if (startPhase === 'DESIGN' || startPhase === 'BUILD') {
        // ============================================
        // PHASE 3: BUILD
        // ============================================
        this.currentPhase = 'BUILD';
        console.log('\n🔨 PHASE 3: BUILD');
        console.log('-'.repeat(40));

        implementation = await this.phaseBuild(spec);
      } else if (options.existingImplementation) {
        implementation = options.existingImplementation;
        console.log('🔨 Phase 3 (BUILD) - Using existing implementation ✅');
      }

      // ============================================
      // PHASE 4: FINALIZE (always runs)
      // ============================================
      this.currentPhase = 'FINALIZE';
      console.log('\n✅ PHASE 4: FINALIZE');
      console.log('-'.repeat(40));

      result = await this.phaseFinalize(implementation);

      // Complete!
      this.stateManager.completeFeature(true);

      console.log('\n' + '='.repeat(80));
      console.log('🎉 FEATURE COMPLETE!');
      console.log('='.repeat(80));

      return {
        success: true,
        sessionId: this.sessionId,
        featureId,
        brief: briefContent,
        spec,
        implementation,
        result,
        resumedFrom: startPhase
      };

    } catch (error) {
      console.error('\n❌ Orchestration failed:', error.message);

      this.stateManager.logBlocker({
        phase: this.currentPhase,
        error: error.message,
        stack: error.stack,
        todos: this.todos,
        resumedFrom: startPhase
      });

      throw error;
    }
  }

  /**
   * Quick validation of a brief before full orchestration
   * Useful to check if a brief is ready for handoff
   *
   * @param {string} briefPathOrContent - Path to brief file OR brief content
   * @param {Function} agentInvoker - Callback to invoke agents via Task tool
   * @returns {Promise<Object>} - Validation result
   */
  async validateBrief(briefPathOrContent, agentInvoker) {
    this.agentInvoker = agentInvoker;

    // Load brief content
    let briefContent;
    if (briefPathOrContent.includes('\n') || briefPathOrContent.length > 500) {
      briefContent = briefPathOrContent;
    } else {
      briefContent = await fs.readFile(briefPathOrContent, 'utf-8');
    }

    console.log('\n📋 Validating brief for orchestrator handoff...');

    const review = await this.invokeCodexReview(
      'engineering-balance',
      `Review this brief to determine if it's ready for automated orchestration:

${briefContent}

Check for:
1. CLEAR REQUIREMENTS - Are user needs well-defined?
2. SCOPE BOUNDARIES - What's in/out?
3. SECURITY CONSIDERATIONS - Auth, RLS, data isolation?
4. SUCCESS CRITERIA - How do we know it's done?
5. TECHNICAL APPROACH - Is implementation path clear?

Respond with:
**READY FOR ORCHESTRATION** - Brief is complete, can proceed to Design phase
**NEEDS MORE DETAIL:** [specific gaps] - Brief needs refinement before handoff
`
    );

    const isReady = review.toLowerCase().includes('ready for orchestration');

    return {
      ready: isReady,
      review,
      brief: briefContent,
      recommendation: isReady
        ? 'Brief is ready. Call resumeFromBrief() to continue.'
        : 'Brief needs refinement. Address the feedback before handoff.'
    };
  }

  /**
   * Main entry point - orchestrates the ENTIRE feature lifecycle
   * Continues until ALL todos at ALL levels are complete
   *
   * @param {string} description - Feature description from user
   * @param {Function} agentInvoker - Callback to invoke agents via Task tool
   * @returns {Promise<Object>} - Complete result with evidence
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

    try {
      // Initialize state
      const featureId = this.stateManager.startFeature(
        `feature-${Date.now()}`,
        description
      );

      // ============================================
      // PHASE 1: DISCOVER
      // ============================================
      this.currentPhase = 'DISCOVER';
      console.log('\n📋 PHASE 1: DISCOVER');
      console.log('-'.repeat(40));

      // Initialize brief todos
      this.todos.brief = [
        { id: 'brief-1', task: 'Generate discovery questions', status: 'pending' },
        { id: 'brief-2', task: 'Get user answers', status: 'pending' },
        { id: 'brief-3', task: 'Create requirements brief', status: 'pending' },
        { id: 'brief-4', task: 'Codex review brief', status: 'pending' },
        { id: 'brief-5', task: 'User confirmation', status: 'pending' }
      ];

      const brief = await this.phaseDiscover(description);

      // ============================================
      // PHASE 2: DESIGN
      // ============================================
      this.currentPhase = 'DESIGN';
      console.log('\n🏗️ PHASE 2: DESIGN');
      console.log('-'.repeat(40));

      const spec = await this.phaseDesign(brief);

      // ============================================
      // PHASE 3: BUILD
      // ============================================
      this.currentPhase = 'BUILD';
      console.log('\n🔨 PHASE 3: BUILD');
      console.log('-'.repeat(40));

      const implementation = await this.phaseBuild(spec);

      // ============================================
      // PHASE 4: FINALIZE
      // ============================================
      this.currentPhase = 'FINALIZE';
      console.log('\n✅ PHASE 4: FINALIZE');
      console.log('-'.repeat(40));

      const result = await this.phaseFinalize(implementation);

      // Complete!
      this.stateManager.completeFeature(true);

      console.log('\n' + '='.repeat(80));
      console.log('🎉 FEATURE COMPLETE!');
      console.log('='.repeat(80));

      return {
        success: true,
        sessionId: this.sessionId,
        featureId,
        brief,
        spec,
        implementation,
        result
      };

    } catch (error) {
      console.error('\n❌ Orchestration failed:', error.message);

      // Save state for recovery
      this.stateManager.logBlocker({
        phase: this.currentPhase,
        error: error.message,
        stack: error.stack,
        todos: this.todos
      });

      throw error;
    }
  }

  // ============================================
  // PHASE 1: DISCOVER
  // ============================================

  async phaseDiscover(description) {
    // Step 1: Generate discovery questions
    this.updateTodo('brief', 'brief-1', 'in_progress');
    console.log('  → Generating discovery questions...');

    const questions = await this.invokeAgent('brief-writer', {
      action: 'generate-questions',
      description
    });

    this.updateTodo('brief', 'brief-1', 'completed');

    // Step 2: Present questions (user answers via main session)
    this.updateTodo('brief', 'brief-2', 'in_progress');
    console.log('\n📝 Discovery Questions Generated:');
    console.log(questions);
    console.log('\n⏸️  Waiting for user answers...');

    // In practice, the main session would collect answers
    // For now, we return the questions and expect answers in the callback
    const answers = await this.invokeAgent('general-purpose', {
      action: 'collect-answers',
      questions,
      description
    });

    this.updateTodo('brief', 'brief-2', 'completed');

    // Step 3: Create brief with Codex requirements first
    this.updateTodo('brief', 'brief-3', 'in_progress');
    console.log('  → Creating requirements brief (Codex-first approach)...');

    // First get Codex to define requirements/constraints
    const codexRequirements = await this.invokeCodexReview(
      'engineering-balance',
      `Define requirements and constraints for: ${description}\n\nUser context: ${JSON.stringify(answers)}`
    );

    // Then create brief within those constraints
    const brief = await this.invokeAgent('brief-writer', {
      action: 'create-brief',
      description,
      answers,
      codexRequirements
    });

    this.updateTodo('brief', 'brief-3', 'completed');

    // Step 4: Codex review brief
    this.updateTodo('brief', 'brief-4', 'in_progress');
    console.log('  → Codex reviewing brief...');

    let briefApproved = false;
    let currentBrief = brief;
    let iterations = 0;

    while (!briefApproved && iterations < this.options.maxRetries) {
      const review = await this.invokeCodexReview(
        'engineering-balance',
        `Review this brief for engineering balance, security, and completeness:\n\n${currentBrief}`
      );

      if (this.isApproved(review)) {
        briefApproved = true;
        console.log('  ✅ Brief approved by Codex');
      } else {
        iterations++;
        console.log(`  ⚠️ Brief needs refinement (attempt ${iterations}/${this.options.maxRetries})`);

        currentBrief = await this.invokeAgent('brief-writer', {
          action: 'refine-brief',
          currentBrief,
          feedback: review
        });
      }
    }

    if (!briefApproved) {
      throw new Error('Brief could not be approved after maximum retries');
    }

    this.updateTodo('brief', 'brief-4', 'completed');

    // Step 5: User confirmation
    this.updateTodo('brief', 'brief-5', 'in_progress');
    console.log('\n📋 Brief ready for confirmation');
    // In practice, main session would confirm
    this.updateTodo('brief', 'brief-5', 'completed');

    // Save brief
    this.stateManager.saveBrief({ content: currentBrief, approved: true });

    return currentBrief;
  }

  // ============================================
  // PHASE 2: DESIGN
  // ============================================

  async phaseDesign(brief) {
    // Initialize spec todos
    this.todos.spec = [
      { id: 'spec-1', task: 'Analyze brief and create spec', status: 'pending' },
      { id: 'spec-2', task: 'Generate test strategy', status: 'pending' },
      { id: 'spec-3', task: 'Codex review design', status: 'pending' },
      { id: 'spec-4', task: 'Generate execution plan (blueprints)', status: 'pending' }
    ];

    // Step 1: Create spec from brief
    this.updateTodo('spec', 'spec-1', 'in_progress');
    console.log('  → Creating technical specification...');

    const spec = await this.invokeAgent('spec-writer', {
      brief,
      action: 'create-spec'
    });

    this.updateTodo('spec', 'spec-1', 'completed');

    // Step 2: Generate test strategy
    this.updateTodo('spec', 'spec-2', 'in_progress');
    console.log('  → Generating test strategy...');

    const testStrategy = await this.invokeAgent('testing-coordinator', {
      spec,
      action: 'create-strategy'
    });

    this.updateTodo('spec', 'spec-2', 'completed');

    // Step 3: Codex review design
    this.updateTodo('spec', 'spec-3', 'in_progress');
    console.log('  → Codex reviewing design...');

    let designApproved = false;
    let currentSpec = spec;
    let iterations = 0;

    while (!designApproved && iterations < this.options.maxRetries) {
      const review = await this.invokeCodexReview(
        'security-and-performance',
        `Review this technical design:\n\nSpec:\n${currentSpec}\n\nTest Strategy:\n${testStrategy}`
      );

      if (this.isApproved(review)) {
        designApproved = true;
        console.log('  ✅ Design approved by Codex');
      } else {
        iterations++;
        console.log(`  ⚠️ Design needs refinement (attempt ${iterations}/${this.options.maxRetries})`);

        currentSpec = await this.invokeAgent('spec-writer', {
          action: 'refine-spec',
          currentSpec,
          feedback: review
        });
      }
    }

    if (!designApproved) {
      throw new Error('Design could not be approved after maximum retries');
    }

    this.updateTodo('spec', 'spec-3', 'completed');

    // Step 4: Generate execution plan (blueprints)
    this.updateTodo('spec', 'spec-4', 'in_progress');
    console.log('  → Generating execution plan...');

    const { MasterOrchestrator } = require('./master-orchestrator');
    const planner = new MasterOrchestrator();

    const specObj = {
      name: 'Feature Spec',
      content: currentSpec
    };

    const plan = await planner.orchestrateFeature(specObj, process.cwd());

    this.updateTodo('spec', 'spec-4', 'completed');

    // Initialize blueprint todos from plan
    for (const blueprint of plan.blueprints) {
      this.todos.blueprints.set(blueprint.id, [
        { id: `${blueprint.id}-validate`, task: 'Codex pre-validate', status: 'pending' },
        { id: `${blueprint.id}-execute`, task: 'Execute blueprint', status: 'pending' },
        { id: `${blueprint.id}-verify`, task: 'Verify implementation', status: 'pending' }
      ]);
    }

    // Save spec
    this.stateManager.saveSpec({
      content: currentSpec,
      testStrategy,
      plan,
      approved: true
    });

    return { spec: currentSpec, testStrategy, plan };
  }

  // ============================================
  // PHASE 3: BUILD
  // ============================================

  async phaseBuild({ spec, testStrategy, plan }) {
    console.log(`  📊 Execution Plan: ${plan.blueprints.length} blueprints in ${plan.layers.length} layers`);
    console.log(`  ⏱️  Estimated time: ${plan.metadata.estimatedMinutes} minutes`);
    console.log('');

    const results = [];

    // Process each layer sequentially
    for (let layerIndex = 0; layerIndex < plan.layers.length; layerIndex++) {
      const layer = plan.layers[layerIndex];
      console.log(`\n  📐 Layer ${layerIndex + 1}/${plan.layers.length} - ${layer.length} blueprints`);

      // Process blueprints in batches within layer
      const batches = this.createBatches(layer, this.options.maxParallelAgents);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`    📦 Batch ${batchIndex + 1}/${batches.length}`);

        // Pre-validate all blueprints in batch
        if (this.options.enableCodexPreValidation) {
          console.log('    → Pre-validating blueprints with Codex...');

          for (const blueprintId of batch) {
            const blueprint = plan.blueprints.find(bp => bp.id === blueprintId);
            if (!blueprint) continue;

            this.updateBlueprintTodo(blueprintId, `${blueprintId}-validate`, 'in_progress');

            const validation = await this.preValidateBlueprint(blueprint, spec);

            if (!validation.approved) {
              console.log(`    ⚠️ Blueprint ${blueprint.name} blocked: ${validation.reason}`);
              // Could handle blocking here - for now, log and continue
            }

            this.updateBlueprintTodo(blueprintId, `${blueprintId}-validate`, 'completed');
          }
        }

        // Execute blueprints (parallel if enabled)
        console.log('    → Executing blueprints...');

        // Track agent index for context capsules
        let agentIndex = 0;

        const batchPromises = batch.map(async (blueprintId) => {
          const blueprint = plan.blueprints.find(bp => bp.id === blueprintId);
          if (!blueprint) return null;

          agentIndex++;
          this.updateBlueprintTodo(blueprintId, `${blueprintId}-execute`, 'in_progress');

          try {
            // Execute with rich context capsule
            const result = await this.executeBlueprint(blueprint, spec, {
              allBlueprints: plan.blueprints,
              currentBatch: batch,
              agentIndex
            });
            this.updateBlueprintTodo(blueprintId, `${blueprintId}-execute`, 'completed');
            return result;
          } catch (error) {
            console.error(`    ❌ Blueprint ${blueprint.name} failed: ${error.message}`);
            return { blueprintId, blueprint, success: false, error: error.message };
          }
        });

        const batchResults = this.options.enableParallelExecution
          ? await Promise.all(batchPromises)
          : await this.executeSequentially(batchPromises);

        // ========================================
        // Cross-reference agents for integration issues (AGENTS.md pattern)
        // ========================================
        console.log('    → Cross-referencing agent results...');
        const crossRef = await this.crossReferenceAgents(batchResults, plan.blueprints);

        if (crossRef.conflicts.length > 0) {
          console.log(`    ⚠️ Integration conflicts detected:`);
          for (const conflict of crossRef.conflicts) {
            console.log(`       - ${conflict.type}: ${conflict.message}`);
          }
        }

        if (crossRef.integrationPoints.length > 0) {
          console.log(`    ✅ Integration points verified: ${crossRef.integrationPoints.length}`);
        }

        // Verify results
        console.log('    → Verifying implementations with Codex...');

        for (const result of batchResults) {
          if (!result) continue;

          const blueprintId = result.blueprintId;
          this.updateBlueprintTodo(blueprintId, `${blueprintId}-verify`, 'in_progress');

          if (result.success) {
            // Verify with Codex
            const verification = await this.verifyImplementation(result);

            if (verification.approved) {
              console.log(`    ✅ ${result.blueprintName}: Verified`);
              this.updateBlueprintTodo(blueprintId, `${blueprintId}-verify`, 'completed');
            } else {
              console.log(`    ⚠️ ${result.blueprintName}: Needs fixes`);
              // Handle fixes...
            }
          } else {
            console.log(`    ❌ ${result.blueprintName || blueprintId}: Failed - ${result.error || 'Unknown error'}`);
          }

          results.push(result);
        }
      }

      console.log(`  ✅ Layer ${layerIndex + 1} complete`);

      // Check for missing UI after all layers
      const hasUIBlueprints = results.some(r =>
        r?.blueprint?.type === 'ui-component' || r?.blueprint?.type === 'ui-page'
      );
      const hasAPIBlueprints = results.some(r => r?.blueprint?.type === 'api');

      if (hasAPIBlueprints && !hasUIBlueprints && layerIndex === plan.layers.length - 1) {
        console.log('\n  ⚠️ WARNING: API implemented but no UI components. Consider adding UI blueprints.');
      }
    }

    return {
      success: results.every(r => r?.success),
      results,
      totalBlueprints: plan.blueprints.length,
      completedBlueprints: results.filter(r => r?.success).length
    };
  }

  /**
   * Pre-validate blueprint with Codex BEFORE execution
   */
  async preValidateBlueprint(blueprint, spec) {
    const prompt = `
Pre-Implementation Blueprint Validation

Review this blueprint BEFORE an agent implements it:

Blueprint: ${blueprint.name}
Type: ${blueprint.type}
Description: ${JSON.stringify(blueprint.specifications || {}, null, 2)}

Context (Spec Summary):
${spec.substring(0, 1000)}...

Validate:
1. INTERFACE CONTRACTS - Do inputs/outputs match other components?
2. SECURITY BY DESIGN - Are RLS, auth patterns correct?
3. PERFORMANCE TARGETS - Is <100ms DB, <200ms API achievable?
4. INTEGRATION POINTS - Are dependencies clearly defined?

Respond with:
**APPROVED** - Blueprint is sound to implement
**BLOCKED: [reason]** - Critical issues must be fixed first
**WARNING: [issue]** - Minor issues, can proceed with caution
`;

    const review = await this.invokeCodexReview('engineering-balance', prompt);

    return {
      approved: this.isApproved(review),
      reason: review,
      blueprint: blueprint.id
    };
  }

  /**
   * Execute a single blueprint via sub-agent
   * Now with rich context capsule following AGENTS.md patterns
   *
   * @param {Object} blueprint - The blueprint to execute
   * @param {string} spec - The spec content
   * @param {Object} options - Execution options with context
   */
  async executeBlueprint(blueprint, spec, options = {}) {
    const {
      allBlueprints = [],
      currentBatch = [],
      agentIndex = 1
    } = options;

    // Create rich context capsule with full hierarchy
    const contextCapsule = this.createContextCapsule(blueprint, spec, {
      briefVision: this.briefContent,
      allBlueprints,
      currentBatch,
      agentIndex
    });

    // Build the execution prompt
    const prompt = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  BUILD PHASE - EXECUTE DIRECTLY                                            ║
║  DO NOT run /build-feature. DO NOT ask questions. START WORKING NOW.          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

${contextCapsule}

═══════════════════════════════════════════════════════════════════════════════
                         SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

${JSON.stringify(blueprint.specifications || {}, null, 2)}

═══════════════════════════════════════════════════════════════════════════════
                         YOUR TASKS
═══════════════════════════════════════════════════════════════════════════════

1. Create/modify the specified files EXACTLY as documented
2. Follow the specifications - no creative interpretation
3. Implement ALL required states (default, loading, error, empty for UI)
4. Write tests for your implementation
5. Ensure all tests pass
6. ${blueprint.type?.includes('ui') ? 'Capture screenshots of all required states' : 'Verify functionality'}
7. Save evidence to: evidence/${this.sessionId}/${blueprint.id}/

═══════════════════════════════════════════════════════════════════════════════
                         RETURN FORMAT (CRITICAL!)
═══════════════════════════════════════════════════════════════════════════════

Return ONLY 3-5 lines summarizing:
  Line 1: Files created/modified
  Line 2: Tests status (X passing, Y failing)
  Line 3: Evidence location
  Line 4: Any blockers (or "No blockers")

⚠️  LONG RESPONSES WILL BE FLAGGED. Be concise!
`;

    const result = await this.invokeAgent('general-purpose', {
      action: 'execute-blueprint',
      prompt
    });

    // Validate the agent's response
    const validation = await this.validateAgentResult(blueprint, { summary: result });

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.log(`    ⚠️ Agent warnings for ${blueprint.id}:`);
      validation.warnings.forEach(w => console.log(`       - ${w}`));
    }

    return {
      blueprintId: blueprint.id,
      blueprintName: blueprint.name,
      blueprint: blueprint,
      success: !result.toLowerCase().includes('failed') &&
               !result.toLowerCase().includes('error') &&
               validation.valid,
      summary: result,
      validation
    };
  }

  /**
   * Verify implementation with Codex
   */
  async verifyImplementation(result) {
    const review = await this.invokeCodexReview(
      'security-and-performance',
      `Verify this implementation:\n\nBlueprint: ${result.blueprintName}\nSummary: ${result.summary}`
    );

    return {
      approved: this.isApproved(review),
      review
    };
  }

  // ============================================
  // PHASE 4: FINALIZE
  // ============================================

  async phaseFinalize(implementation) {
    console.log('  → Running final validation...');

    // Final Codex review
    const finalReview = await this.invokeCodexReview(
      'security-and-performance',
      `Final review for feature completion:\n\n` +
      `Completed blueprints: ${implementation.completedBlueprints}/${implementation.totalBlueprints}\n` +
      `Results: ${JSON.stringify(implementation.results?.map(r => r?.summary) || [], null, 2)}`
    );

    if (!this.isApproved(finalReview)) {
      console.log('  ⚠️ Final review has concerns - documenting...');
    }

    console.log('  → Cleaning up...');

    return {
      success: true,
      finalReview,
      implementation
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Invoke a sub-agent via the agentInvoker callback
   */
  async invokeAgent(agentType, params) {
    console.log(`      [Agent: ${agentType}]`);

    const result = await this.agentInvoker({
      subagent_type: agentType,
      description: `${this.currentPhase}: ${params.action || agentType}`,
      prompt: typeof params === 'string' ? params : JSON.stringify(params, null, 2)
    });

    return result;
  }

  /**
   * Invoke Codex review via REAL Codex CLI (GPT-5 Codex)
   *
   * CRITICAL: This uses Bash to call the actual Codex CLI, NOT Task tool.
   * Task tool spawns Claude sub-agents. Codex CLI calls GPT-5 Codex.
   * Cross-LLM review is essential for catching blind spots.
   */
  async invokeCodexReview(reviewType, content) {
    const { execSync } = require('child_process');

    // Map review types to CLI flags
    const flagMap = {
      'engineering-balance': '--engineering-balance',
      'security': '--security',
      'performance': '--performance',
      'security-and-performance': '--security'
    };

    const flag = flagMap[reviewType] || '--engineering-balance';

    // Escape content for shell
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    const cliPath = path.join(__dirname, '..', 'testing-framework', 'agents', 'codex-reviewer.js');
    const command = `node "${cliPath}" ${flag} --prompt "${escapedContent}"`;

    console.log(`      [Codex CLI: ${reviewType}]`);

    try {
      const result = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        timeout: 180000, // 3 minutes
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      return result;
    } catch (error) {
      // execSync throws on non-zero exit, but output might still be useful
      if (error.stdout) {
        return error.stdout;
      }
      console.error(`      [Codex CLI Error: ${error.message}]`);
      throw new Error(`Codex review failed: ${error.message}`);
    }
  }

  /**
   * Check if a review indicates approval
   */
  isApproved(review) {
    const lower = review.toLowerCase();
    return lower.includes('approved') &&
           !lower.includes('not approved') &&
           !lower.includes('needs improvement') &&
           !lower.includes('blocked');
  }

  /**
   * Create RICH context capsule for blueprint execution
   * Follows AGENTS.md patterns for full context at handoffs
   *
   * @param {Object} blueprint - The blueprint being executed
   * @param {string} spec - The spec content
   * @param {Object} options - Additional context options
   * @param {string} options.briefVision - Epic-level vision from brief
   * @param {Array} options.allBlueprints - All blueprints in the plan
   * @param {Array} options.currentBatch - Blueprints in current batch
   * @param {number} options.agentIndex - This agent's position in batch
   */
  createContextCapsule(blueprint, spec, options = {}) {
    const {
      briefVision = this.briefContent || 'See spec for feature vision',
      allBlueprints = [],
      currentBatch = [],
      agentIndex = 1
    } = options;

    // Get parallel work (other agents in this batch)
    const parallelWork = currentBatch
      .filter(id => id !== blueprint.id)
      .map(id => {
        const bp = allBlueprints.find(b => b.id === id);
        return bp ? `  - ${bp.id}: ${bp.name} (${bp.type || 'task'})` : null;
      })
      .filter(Boolean)
      .join('\n');

    // Format evidence requirements
    const evidenceList = (blueprint.evidenceRequired?.required || [])
      .map(e => `  □ [${e.type.toUpperCase()}] ${e.description}`)
      .join('\n');

    // Extract spec goal (first 2-3 sentences or ## Goal section)
    const specGoal = this.extractSpecGoal(spec);

    // Format dependencies
    const deps = (blueprint.dependsOn || blueprint.dependencies || [])
      .map(depId => {
        const depBp = allBlueprints.find(b => b.id === depId);
        return depBp ? `  - ${depId}: ${depBp.name}` : `  - ${depId}`;
      })
      .join('\n');

    return `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           CONTEXT CAPSULE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Session: ${this.sessionId.padEnd(60)}║
║  Phase: BUILD                                                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│ EPIC VISION (from Brief)                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
${this.wrapText(typeof briefVision === 'string' ? briefVision.substring(0, 500) : 'See spec', 85)}
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ STORY GOAL (from Spec)                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
${this.wrapText(specGoal, 85)}
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ YOUR TASK: ${blueprint.id} - ${blueprint.name.padEnd(55)}│
├─────────────────────────────────────────────────────────────────────────────────┤
│ Type: ${(blueprint.type || 'task').padEnd(73)}│
│ Est. Time: ${(blueprint.estimatedMinutes + ' minutes').padEnd(68)}│
├─────────────────────────────────────────────────────────────────────────────────┤
│ ${blueprint.description || 'No description'}
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ YOUR POSITION                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ You are Agent ${agentIndex} of ${currentBatch.length} in this execution batch.
│
│ PARALLEL WORK (other agents in this batch):
${parallelWork || '  None - you are the only agent in this batch'}
│
│ DEPENDENCIES (must be complete before you start):
${deps || '  None'}
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  EVIDENCE REQUIRED                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
${evidenceList || '  □ [TEST] Tests passing\n  □ [OUTPUT] Implementation complete'}

│ Save evidence to: evidence/${this.sessionId}/${blueprint.id}/
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📋 RETURN FORMAT (3-5 lines ONLY)                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Return ONLY a brief summary:                                                    │
│   Line 1: Files created/modified                                                │
│   Line 2: Tests status (X passing, Y failing)                                   │
│   Line 3: Evidence location                                                     │
│   Line 4: Any blockers (or "No blockers")                                       │
│                                                                                 │
│ EXAMPLE:                                                                        │
│   "Created src/components/DocumentList.tsx with 4 states                        │
│    Tests: 5 passing, 0 failing                                                  │
│    Evidence: evidence/${this.sessionId}/${blueprint.id}/                              │
│    No blockers"                                                                 │
│                                                                                 │
│ ⚠️  DO NOT return long explanations. The orchestrator will verify your work.    │
└─────────────────────────────────────────────────────────────────────────────────┘
`;
  }

  /**
   * Extract goal from spec content
   */
  extractSpecGoal(spec) {
    if (typeof spec !== 'string') return 'See spec for goal';

    // Try to find ## Goal or ## Objective section
    const goalMatch = spec.match(/##\s*(Goal|Objective|Purpose)[^\n]*\n([^#]+)/i);
    if (goalMatch) {
      return goalMatch[2].trim().substring(0, 300);
    }

    // Fall back to first paragraph
    const firstPara = spec.split('\n\n')[0];
    return firstPara?.substring(0, 300) || 'See spec for goal';
  }

  /**
   * Wrap text to fit within box width
   */
  wrapText(text, width) {
    if (!text) return '│ (No content)';
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length > width - 4) {
        lines.push('│ ' + currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) {
      lines.push('│ ' + currentLine);
    }

    return lines.join('\n');
  }

  /**
   * Validate agent result after execution
   * Checks return format and evidence requirements
   */
  async validateAgentResult(blueprint, result) {
    const issues = [];
    const warnings = [];

    // Check return format (should be 3-5 lines)
    const lines = (result.summary || result || '').split('\n').filter(l => l.trim());
    if (lines.length > 7) {
      warnings.push(`Return format: Expected 3-5 lines, got ${lines.length}. Consider being more concise.`);
    }

    // Check for common success indicators
    const summaryLower = (result.summary || result || '').toLowerCase();
    const hasSuccessIndicator = summaryLower.includes('created') ||
                                summaryLower.includes('implemented') ||
                                summaryLower.includes('passing') ||
                                summaryLower.includes('complete');

    const hasFailureIndicator = summaryLower.includes('failed') ||
                                summaryLower.includes('error') ||
                                summaryLower.includes('blocked') ||
                                summaryLower.includes('could not');

    if (hasFailureIndicator && !hasSuccessIndicator) {
      issues.push('Agent reported failure or blockers');
    }

    // Check for evidence path mentioned
    const evidencePath = `evidence/${this.sessionId}/${blueprint.id}/`;
    const mentionsEvidence = summaryLower.includes('evidence') ||
                            summaryLower.includes(blueprint.id.toLowerCase());

    if (blueprint.evidenceRequired?.required?.length > 0 && !mentionsEvidence) {
      warnings.push(`Evidence path not mentioned. Expected: ${evidencePath}`);
    }

    // Check for screenshot requirements (UI components)
    if (blueprint.type === 'ui-component' || blueprint.type === 'ui-page') {
      const screenshotsMentioned = summaryLower.includes('screenshot') ||
                                   summaryLower.includes('captured') ||
                                   summaryLower.includes('state');

      if (!screenshotsMentioned) {
        warnings.push('UI blueprint but no screenshots mentioned. Screenshots are required for UI components.');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      blueprint: blueprint.id
    };
  }

  /**
   * Cross-reference agent results for integration issues
   * Based on AGENTS.md verification patterns
   */
  async crossReferenceAgents(batchResults, allBlueprints) {
    const conflicts = [];
    const integrationPoints = [];

    // Group results by type
    const dbResults = batchResults.filter(r => r?.blueprint?.type === 'database');
    const apiResults = batchResults.filter(r => r?.blueprint?.type === 'api');
    const uiResults = batchResults.filter(r =>
      r?.blueprint?.type === 'ui-component' || r?.blueprint?.type === 'ui-page'
    );

    // Check Database ↔ API integration
    for (const dbResult of dbResults) {
      const tableName = dbResult.blueprint?.specifications?.tableName;
      if (tableName) {
        // Check if any API references this table
        for (const apiResult of apiResults) {
          const apiSummary = (apiResult.summary || '').toLowerCase();
          if (apiSummary.includes(tableName.toLowerCase())) {
            integrationPoints.push({
              type: 'db-api',
              from: dbResult.blueprintId,
              to: apiResult.blueprintId,
              entity: tableName,
              status: 'linked'
            });
          }
        }
      }
    }

    // Check API ↔ UI integration
    for (const apiResult of apiResults) {
      const route = apiResult.blueprint?.specifications?.route;
      if (route) {
        for (const uiResult of uiResults) {
          const uiEndpoints = uiResult.blueprint?.specifications?.apiEndpoints || [];
          if (uiEndpoints.includes(route)) {
            integrationPoints.push({
              type: 'api-ui',
              from: apiResult.blueprintId,
              to: uiResult.blueprintId,
              entity: route,
              status: 'linked'
            });
          }
        }
      }
    }

    // Check for potential conflicts
    // 1. Multiple agents creating same file
    const filePaths = new Map();
    for (const result of batchResults) {
      const files = result.blueprint?.resources?.functions ||
                   result.blueprint?.resources?.components || [];
      for (const file of files) {
        if (filePaths.has(file)) {
          conflicts.push({
            type: 'file-conflict',
            file,
            agents: [filePaths.get(file), result.blueprintId],
            message: `Multiple agents creating/modifying ${file}`
          });
        } else {
          filePaths.set(file, result.blueprintId);
        }
      }
    }

    // 2. Missing UI for user-facing features
    const hasAPI = apiResults.length > 0;
    const hasUI = uiResults.length > 0;
    if (hasAPI && !hasUI) {
      conflicts.push({
        type: 'missing-ui',
        message: 'API endpoints created but no UI components. User-facing features need UI.',
        severity: 'warning'
      });
    }

    return {
      conflicts,
      integrationPoints,
      summary: {
        totalResults: batchResults.length,
        integrationLinks: integrationPoints.length,
        conflictsFound: conflicts.length
      }
    };
  }

  /**
   * Update todo status
   */
  updateTodo(level, todoId, status) {
    const todos = this.todos[level];
    if (Array.isArray(todos)) {
      const todo = todos.find(t => t.id === todoId);
      if (todo) {
        todo.status = status;
        this.logTodoStatus(level, todo);
      }
    }
  }

  /**
   * Update blueprint-level todo
   */
  updateBlueprintTodo(blueprintId, todoId, status) {
    const todos = this.todos.blueprints.get(blueprintId);
    if (todos) {
      const todo = todos.find(t => t.id === todoId);
      if (todo) {
        todo.status = status;
      }
    }
  }

  /**
   * Log todo status change
   */
  logTodoStatus(level, todo) {
    const icon = todo.status === 'completed' ? '✅' :
                 todo.status === 'in_progress' ? '🔄' : '⏳';
    console.log(`    ${icon} [${level}] ${todo.task}`);
  }

  /**
   * Create batches from array
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Execute promises sequentially
   */
  async executeSequentially(promises) {
    const results = [];
    for (const promise of promises) {
      results.push(await promise);
    }
    return results;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
}

// Export for use
module.exports = { UnifiedOrchestrator };

// CLI entry point
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
  console.log('');
  console.log('The agentInvoker should be a function that invokes Task tool.');
}
