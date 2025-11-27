#!/usr/bin/env node

/**
 * Build Feature Auto Hook
 *
 * This hook AUTOMATICALLY invokes the workflow-orchestrator agent
 * when /build-feature is called, ensuring ALL steps complete without
 * human intervention.
 *
 * This is the KEY to making the workflow foolproof!
 */

const { WorkflowStateMachine } = require('../../cli/testing/workflow-state-machine');
const path = require('path');
const fs = require('fs');

class BuildFeatureAutoHook {
  constructor() {
    this.stateMachine = new WorkflowStateMachine();
  }

  /**
   * Intercept /build-feature command and ensure complete workflow
   */
  async execute(command, args) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BUILD-FEATURE COMPLETE WORKFLOW STARTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This workflow will AUTOMATICALLY:
1. Create a brief
2. Create a spec
3. Generate tests (NO SKIPPING!)
4. Run TDD enforcement (NO SKIPPING!)
5. Show exact function names

All steps run automatically without stopping.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    // Check if continuing from stuck workflow
    if (args.includes('--continue')) {
      console.log('🔄 Continuing from previous workflow state...\n');
      this.stateMachine.continueWorkflow();
      return true;
    }

    // Reset any stuck workflow
    const currentState = this.stateMachine.currentState;
    if (currentState !== 'idle') {
      console.log('⚠️  Previous workflow detected. Resetting...\n');
      this.stateMachine.reset();
    }

    // Extract feature requirements from args
    const requirements = args.join(' ').trim();

    if (!requirements) {
      console.error('❌ Please provide feature requirements:');
      console.error('   /build-feature [what you want to build]');
      return false;
    }

    // Start the workflow
    const featureId = `feature-${Date.now()}`;
    this.stateMachine.startWorkflow(featureId);

    // Signal that workflow-orchestrator agent should be invoked
    console.log(`
📢 INVOKING WORKFLOW ORCHESTRATOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The workflow-orchestrator agent will now handle ALL steps:
- It will invoke brief-writer
- Then spec-writer
- Then testing-coordinator (AUTOMATICALLY!)
- Then tdd-enforcer (AUTOMATICALLY!)
- Then show implementation requirements

Requirements: ${requirements}

IMPORTANT: The workflow-orchestrator agent MUST be invoked now
using the Task tool with these requirements.
`);

    // Write requirements to a file for the orchestrator to read
    const reqFile = path.join(process.cwd(), '.build-feature-requirements.txt');
    fs.writeFileSync(reqFile, requirements);

    console.log(`
Requirements saved to: ${reqFile}

The workflow-orchestrator agent should:
1. Read this file for requirements
2. Execute all 5 steps automatically
3. Not stop until complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    // State is already set by startWorkflow, no need to transition again

    return true;
  }

  /**
   * Check if workflow is stuck and needs continuation
   */
  checkWorkflowStatus() {
    const status = this.stateMachine.getStatus();

    if (status.isStuck) {
      console.log(`
⚠️  WORKFLOW STUCK AT: ${status.currentState}

The workflow has stopped but is NOT complete!
This should NEVER happen with the orchestrator.

To continue, run:
  /build-feature-complete --continue

Or invoke the workflow-orchestrator agent directly.
`);
      return false;
    }

    return true;
  }
}

// Export for use
module.exports = { BuildFeatureAutoHook };

// If run directly
if (require.main === module) {
  const hook = new BuildFeatureAutoHook();
  const args = process.argv.slice(2);

  hook.execute('build-feature', args).then(success => {
    if (success) {
      // Check status after a delay
      setTimeout(() => {
        hook.checkWorkflowStatus();
      }, 1000);
    }

    process.exit(success ? 0 : 1);
  });
}