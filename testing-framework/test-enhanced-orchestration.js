#!/usr/bin/env node

/**
 * @fileoverview Test the Enhanced Orchestration System
 * Demonstrates the complete workflow with all improvements
 */

const EnhancedOrchestration = require('./enhanced-orchestration');
const path = require('path');

// Test feature for demonstration
const testFeature = {
  title: 'User Profile Management',
  name: 'user-profile',
  type: 'crud',
  complexity: 'complex',

  brief: {
    title: 'User Profile Management',
    description: 'Allow users to view and edit their profile information including avatar upload',
    requirements: [
      'Display user profile with avatar, name, email, bio',
      'Edit profile information with validation',
      'Upload and crop avatar images',
      'Dark mode support for all UI',
      'Mobile responsive design',
      'RLS policies for data security'
    ],
    type: 'crud',
    complexity: 'complex'
  },

  // Optional: path to existing spec
  specPath: null, // Set to actual spec file if exists
};

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('    ENHANCED ORCHESTRATION SYSTEM - DEMONSTRATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('This test demonstrates:');
  console.log('  ✓ Spec review before test generation');
  console.log('  ✓ Blueprint matching for pattern reuse');
  console.log('  ✓ Sequential hook execution with context');
  console.log('  ✓ Orchestrator validation with conflicts');
  console.log('  ✓ Feedback loops for revisions');
  console.log('  ✓ Implementation plan generation');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Initialize the enhanced orchestration system
  const orchestration = new EnhancedOrchestration({
    enableSpecReview: true,
    enableOrchestration: true,
    enableBlueprints: true,
    maxIterations: 3
  });

  try {
    // Execute the complete workflow
    const result = await orchestration.executeFeatureWorkflow(testFeature);

    // Display detailed results
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    EXECUTION RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (result.success) {
      console.log('\n✅ WORKFLOW COMPLETED SUCCESSFULLY!\n');

      // Display spec review results
      if (result.specReview) {
        console.log('📄 SPEC REVIEW:');
        console.log(`   Status: ${result.specReview.success ? 'Approved' : 'Failed'}`);
        if (result.specReview.iterations) {
          console.log(`   Iterations: ${result.specReview.iterations}`);
        }
      }

      // Display blueprint match
      if (result.blueprintMatch) {
        console.log('\n📘 BLUEPRINT MATCH:');
        console.log(`   Blueprint: ${result.blueprintMatch.name}`);
        console.log(`   Patterns: ${result.blueprintMatch.patterns.join(', ')}`);
        console.log(`   Components: ${result.blueprintMatch.components.join(', ')}`);
      }

      // Display orchestrator validation
      if (result.orchestratorValidation) {
        console.log('\n🎯 ORCHESTRATOR VALIDATION:');
        console.log(`   Status: ${result.orchestratorValidation.approved ? 'Approved' : 'Rejected'}`);

        if (result.orchestratorValidation.conflicts?.length > 0) {
          console.log('   Conflicts Resolved:');
          for (const conflict of result.orchestratorValidation.conflicts) {
            console.log(`     - ${conflict.type}: ${conflict.description}`);
          }
        }

        if (result.orchestratorValidation.patternViolations?.length > 0) {
          console.log('   Pattern Violations Fixed:');
          for (const violation of result.orchestratorValidation.patternViolations) {
            console.log(`     - ${violation.pattern}: ${violation.description}`);
          }
        }
      }

      // Display implementation plan
      if (result.implementationPlan) {
        console.log('\n📋 IMPLEMENTATION PLAN:');
        console.log(`   Overview: ${result.implementationPlan.overview}`);
        console.log(`   Blueprint: ${result.implementationPlan.blueprint}`);
        console.log('\n   Sequence:');
        for (const step of result.implementationPlan.sequence) {
          console.log(`     ${step.step}. ${step.description} (${step.type})`);
          for (const task of step.tasks) {
            console.log(`        - ${task}`);
          }
        }

        console.log('\n   Test Strategy:');
        console.log(`     Approach: ${result.implementationPlan.testStrategy.approach}`);
        console.log(`     Coverage: ${result.implementationPlan.testStrategy.coverage}%`);
        console.log(`     Types: ${result.implementationPlan.testStrategy.types.join(', ')}`);

        if (result.implementationPlan.reusableComponents.length > 0) {
          console.log('\n   Reusable Components:');
          for (const component of result.implementationPlan.reusableComponents) {
            console.log(`     - ${component}`);
          }
        }

        console.log('\n   Quality Gates:');
        const gates = result.implementationPlan.qualityGates;
        console.log(`     Tests: ${gates.tests.minimumCoverage}% coverage required`);
        console.log(`     TypeScript: ${gates.typeScript.required ? 'Required' : 'Optional'}`);
        console.log(`     Cross-LLM Review: ${gates.crossLLMReview.required ? 'Required' : 'Optional'}`);

        console.log('\n   Next Steps:');
        for (let i = 0; i < result.implementationPlan.nextSteps.length; i++) {
          console.log(`     ${i + 1}. ${result.implementationPlan.nextSteps[i]}`);
        }
      }

      // Display metrics
      console.log('\n📊 EXECUTION METRICS:');
      console.log(`   Duration: ${(result.metrics.duration / 1000).toFixed(1)}s`);
      console.log(`   Iterations: ${result.metrics.iterations}`);
      console.log(`   Spec Reviewed: ${result.metrics.specReviewed ? 'Yes' : 'No'}`);
      console.log(`   Blueprint Matched: ${result.metrics.blueprintMatched ? 'Yes' : 'No'}`);
      console.log(`   Orchestrator Approved: ${result.metrics.orchestratorApproved ? 'Yes' : 'No'}`);

    } else {
      console.log('\n❌ WORKFLOW FAILED\n');

      if (result.error) {
        console.log(`Error: ${result.error}`);
      }

      if (result.orchestratorValidation && !result.orchestratorValidation.approved) {
        console.log('\nOrchestrator rejected due to:');

        if (result.orchestratorValidation.conflicts?.length > 0) {
          console.log('  Unresolved Conflicts:');
          for (const conflict of result.orchestratorValidation.conflicts) {
            console.log(`    - ${conflict.description}`);
          }
        }

        if (result.orchestratorValidation.patternViolations?.length > 0) {
          console.log('  Pattern Violations:');
          for (const violation of result.orchestratorValidation.patternViolations) {
            console.log(`    - ${violation.description}`);
          }
        }

        if (result.orchestratorValidation.missingRequirements?.length > 0) {
          console.log('  Missing Requirements:');
          for (const req of result.orchestratorValidation.missingRequirements) {
            console.log(`    - ${req.requirement}`);
          }
        }
      }
    }

    // Display system statistics
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    SYSTEM STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const stats = orchestration.getStatistics();
    console.log(`\nTotal Features Processed: ${stats.totalFeatures}`);
    console.log(`Spec Reviews Performed: ${stats.specReviewsPerformed}`);
    console.log(`Blueprints Matched: ${stats.blueprintsMatched}`);
    console.log(`Orchestrator Approval Rate: ${stats.orchestratorApprovalRate}%`);
    console.log(`Average Iterations: ${stats.averageIterations}`);

    if (stats.topIssues.length > 0) {
      console.log('\nMost Common Issues:');
      for (const issue of stats.topIssues) {
        console.log(`  - ${issue.type}: ${issue.count} occurrences`);
      }
    }

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    console.error(error.stack);
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('              TEST COMPLETE - SYSTEM READY');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Handle async errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest, testFeature };