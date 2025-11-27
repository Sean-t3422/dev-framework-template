#!/usr/bin/env node
/**
 * @fileoverview CLI for Dev Framework Testing System
 * Usage: node cli.js <command> [options]
 */

const fs = require('fs').promises;
const path = require('path');
const { DevFrameworkTestingSystem } = require('./index');

const system = new DevFrameworkTestingSystem();

/**
 * CLI Commands
 */
const commands = {
  /**
   * Analyze complexity of a feature
   */
  async analyze(featurePath) {
    console.log('📊 Analyzing feature complexity...\n');

    const feature = await loadFeature(featurePath);
    const analysis = await system.analyzeComplexity(feature);

    console.log('Complexity Analysis:');
    console.log(`  Level: ${analysis.level} (${analysis.profile.name})`);
    console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log(`  Test Strategy: ${analysis.profile.testStrategy}`);
    console.log(`  Estimated Time: ${analysis.profile.estimatedFiles}`);
    console.log('\nTest Types Required:');
    analysis.profile.testTypes.forEach((type) => {
      console.log(`  - ${type}`);
    });

    if (analysis.profile.coverage) {
      console.log('\nCoverage Targets:');
      console.log(`  Lines: ${analysis.profile.coverage.lines}%`);
      console.log(`  Branches: ${analysis.profile.coverage.branches}%`);
      console.log(`  Functions: ${analysis.profile.coverage.functions}%`);
    }

    console.log('\nRecommendations:');
    analysis.recommendations.forEach((rec) => {
      console.log(`  - ${rec}`);
    });
  },

  /**
   * Generate tests for a feature
   */
  async generate(featurePath) {
    console.log('🎯 Generating tests for feature...\n');

    const feature = await loadFeature(featurePath);
    const result = await system.generateTests(feature);

    console.log(`Generated ${result.generatedTests.length} test files:\n`);
    result.generatedTests.forEach((test) => {
      console.log(`  ✓ ${test.type}: ${test.fileName}`);
    });

    console.log('\nTest Plan:');
    console.log(`  Complexity: ${result.testPlan.complexity}`);
    console.log(`  Strategy: ${result.testPlan.testStrategy}`);
    console.log(`  Estimated Time: ${result.testPlan.estimatedTime}`);

    console.log('\nNext Steps:');
    result.instructions.forEach((instruction, i) => {
      console.log(`  ${i + 1}. ${instruction}`);
    });
  },

  /**
   * Initialize complete testing workflow
   */
  async init(featurePath) {
    console.log('🚀 Initializing Dev Framework Testing System...\n');

    const feature = await loadFeature(featurePath);
    const result = await system.initializeFeature(feature);

    if (!result.success) {
      console.error('❌ Initialization failed:', result.error);
      process.exit(1);
    }

    console.log('\n✅ Testing System Initialized\n');
    console.log(`Feature: ${feature.title}`);
    console.log(`Complexity: ${result.analysis.level}`);
    console.log(`Tests Generated: ${result.testsGenerated}`);

    if (result.requiresCrossLLMReview) {
      console.log('\n⚠️  CROSS-LLM REVIEW REQUIRED');
      console.log('This feature requires review from multiple LLMs before deployment.');
    }

    console.log('\nNext Steps:');
    result.nextSteps.forEach((step) => {
      console.log(`  ${step}`);
    });
  },

  /**
   * Run cross-LLM review
   */
  async review(featureId, ...files) {
    console.log('🤖 Running cross-LLM review...\n');

    const result = await system.runCrossLLMReview(featureId, files);

    if (result.success) {
      console.log(`✓ Reviewed ${result.reviewCount} files\n`);
      result.results.forEach((r) => {
        const status = r.status === 'reviewed' ? '✓' : '✗';
        console.log(`${status} ${r.file}`);
      });
    } else {
      console.error('❌ Review failed:', result.error);
      process.exit(1);
    }
  },

  /**
   * Run A/B test across LLMs
   */
  async abtest(prompt, models = 'claude,gpt,gemini') {
    console.log('🔬 Running A/B test across LLMs...\n');

    const modelList = models.split(',');
    const result = await system.runABTest(prompt, modelList);

    if (result.success) {
      console.log('✓ A/B test complete');
      console.log('\nView detailed results in:');
      console.log('  ~/.llm-tests/results/');
    } else {
      console.error('❌ A/B test failed:', result.error);
      process.exit(1);
    }
  },

  /**
   * Finalize feature testing
   */
  async finalize(featureId) {
    console.log('🏁 Finalizing feature testing...\n');

    const result = await system.finalizeFeature(featureId);

    // Handle error case
    if (result.error) {
      console.log('❌ Finalization failed\n');
      console.log(`Error: ${result.error}`);
      console.log('\nThis feature was not initialized with /build-feature.');
      console.log('The finalize command requires a feature to be tracked by the system.');
      console.log('\nFor manual verification, run:');
      console.log('  npm test');
      console.log('  npx tsc --noEmit');
      process.exit(1);
    }

    if (result.success) {
      console.log('✅ All checks passed!\n');
    } else {
      console.log('⚠️  Some checks failed\n');
    }

    // Safely access report properties
    if (result.report) {
      console.log('Report:');
      if (result.report.tests) {
        console.log(`  Tests: ${result.report.tests.passed}/${result.report.tests.generated} passed`);
      }
      if (result.report.qualityGates) {
        console.log(`  Quality Gates: ${result.report.qualityGates.passed ? 'Passed' : 'Failed'}`);
      }
      if (result.report.crossLLMReview) {
        console.log(`  Cross-LLM Review: ${result.report.crossLLMReview.completed ? 'Complete' : 'Incomplete'}`);
      }

      if (result.report.recommendations && result.report.recommendations.length > 0) {
        console.log('\nRecommendations:');
        result.report.recommendations.forEach((rec) => {
          console.log(`  - ${rec}`);
        });
      }
    }

    if (!result.success) {
      process.exit(1);
    }
  },

  /**
   * Show help
   */
  help() {
    console.log(`
Dev Framework Testing System - CLI

Usage:
  node cli.js <command> [options]

Commands:
  analyze <feature.json>              Analyze feature complexity
  generate <feature.json>             Generate tests for feature
  init <feature.json>                 Initialize complete testing workflow
  review <featureId> <file1> [...]   Run cross-LLM review on files
  abtest "<prompt>" [models]          Run A/B test across LLMs
  finalize <featureId>                Finalize and verify all tests
  help                                Show this help message

Examples:
  node cli.js analyze briefs/login-feature.json
  node cli.js init blueprints/payment-flow.json
  node cli.js review feature-123 src/auth/login.ts
  node cli.js abtest "Create signup form" claude,gpt,gemini
  node cli.js finalize feature-123

Feature JSON Format:
  {
    "id": "feature-123",
    "title": "User Login Feature",
    "description": "Implement user login with email and password",
    "requirements": [
      "Users can login with email/password",
      "Failed login shows error message",
      "Successful login redirects to dashboard"
    ]
  }
    `);
  },
};

/**
 * Load feature from JSON file
 */
async function loadFeature(featurePath) {
  try {
    const content = await fs.readFile(featurePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading feature from ${featurePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    commands.help();
    return;
  }

  if (!commands[command]) {
    console.error(`Unknown command: ${command}`);
    console.error('Run "node cli.js help" for usage information');
    process.exit(1);
  }

  try {
    await commands[command](...args);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { commands };
