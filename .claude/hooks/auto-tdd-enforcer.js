#!/usr/bin/env node

/**
 * Auto TDD Enforcer Hook
 *
 * Automatically enforces TDD when any implementation is attempted.
 * Integrates with build-feature and other commands to ensure tests are run first.
 *
 * THIS RUNS AUTOMATICALLY - NO MANUAL INTERVENTION NEEDED.
 */

const fs = require('fs');
const path = require('path');
const { TDDEnforcer } = require('../../cli/testing/tdd-enforcer');
const ComplexityDetector = require('../../utils/complexity-detector');

class AutoTDDEnforcer {
  constructor() {
    this.enforcer = new TDDEnforcer();
    this.complexityDetector = new ComplexityDetector();
    this.AUTO_ENFORCE = true; // Cannot be disabled
    this.ALLOW_SIMPLE_BYPASS = true; // NEW: Allow bypassing for simple tasks
  }

  /**
   * Hook that runs BEFORE any file is created/modified
   */
  async beforeFileWrite(filePath, content, context = {}) {
    if (!this.AUTO_ENFORCE) {
      return { allowed: true };
    }

    // Check if this is a test file (don't enforce on test files)
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      return { allowed: true };
    }

    // NEW: Check complexity for simple bypass
    if (this.ALLOW_SIMPLE_BYPASS && context.taskDescription) {
      const analysis = this.complexityDetector.analyze(context.taskDescription);
      if (analysis.skipTDD) {
        console.log('\n' + '🚀'.repeat(10));
        console.log('🚀 FAST PATH: Simple change detected!');
        console.log('   ' + analysis.reason);
        console.log('   Bypassing TDD for this change.');
        console.log('🚀'.repeat(10) + '\n');
        return { allowed: true, fastPath: true };
      }
    }

    // Check if this is implementation code
    if (this.isImplementationFile(filePath)) {
      return await this.enforceTestFirst(filePath, content, context);
    }

    return { allowed: true };
  }

  /**
   * Check if file is implementation (not test, not config)
   */
  isImplementationFile(filePath) {
    const implementationPaths = [
      '/src/lib/',
      '/src/components/',
      '/src/app/',
      '/src/utils/',
      '/src/services/',
      '/lib/',
      '/components/',
      '/pages/',
      '/api/'
    ];

    return implementationPaths.some(p => filePath.includes(p));
  }

  /**
   * Enforce test-first development
   */
  async enforceTestFirst(filePath, content, context) {
    const status = this.enforcer.getStatus();

    // If no TDD session active, check for tests
    if (!status.active) {
      const testsExist = await this.checkTestsExist(filePath);

      if (!testsExist) {
        console.log('\n' + '⚠'.repeat(30));
        console.log('\n⚠️  TDD VIOLATION: No tests found!');
        console.log('\n📋 You are trying to create:');
        console.log(`   ${filePath}`);
        console.log('\n❌ But no tests exist for this feature!');
        console.log('\n⚡ SOLUTION:');
        console.log('   1. Run: /force-tdd <feature-name>');
        console.log('   2. Or create tests first manually');
        console.log('   3. Then implement\n');
        console.log('⚠'.repeat(30) + '\n');

        return {
          allowed: false,
          reason: 'No tests exist - violates TDD',
          action: 'Create tests first or run /force-tdd'
        };
      }

      // Tests exist but TDD not started - auto-start it
      console.log('\n🔴 Auto-starting TDD enforcement...');
      const featureId = this.extractFeatureId(filePath);
      this.enforcer.startTDD(featureId);
    }

    // Check if in RED phase without test runs
    const enforcement = this.enforcer.enforceRedPhase();
    if (!enforcement.allowed) {
      console.log('\n' + '🚫'.repeat(30));
      console.log('\n🚫 TDD ENFORCEMENT: Cannot implement yet!');
      console.log('\n' + enforcement.message);
      console.log('\n🚫'.repeat(30) + '\n');

      return enforcement;
    }

    // Check if implementation matches test expectations
    const validation = this.enforcer.checkImplementation(filePath, content);
    if (!validation.valid) {
      console.log('\n' + '⚠'.repeat(30));
      console.log('\n⚠️  Implementation doesn\'t match test expectations!');

      validation.violations.forEach(v => {
        console.log(`\n❌ ${v.type}: ${v.message}`);
      });

      console.log('\n🔧 You MUST implement what tests expect!');
      console.log('   Look at the test error messages.\n');
      console.log('⚠'.repeat(30) + '\n');

      // Still allow but warn strongly
      return {
        allowed: true,
        warning: 'Implementation doesn\'t match test expectations',
        violations: validation.violations
      };
    }

    return { allowed: true };
  }

  /**
   * Check if tests exist for the feature
   */
  async checkTestsExist(implementationPath) {
    // Extract likely test paths
    const testPaths = this.getPossibleTestPaths(implementationPath);

    for (const testPath of testPaths) {
      if (fs.existsSync(testPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get possible test file locations
   */
  getPossibleTestPaths(implementationPath) {
    const basename = path.basename(implementationPath, path.extname(implementationPath));
    const dir = path.dirname(implementationPath);

    // Replace src with tests
    const testDir = dir.replace('/src/', '/tests/').replace('/lib/', '/tests/unit/');

    return [
      path.join(testDir, `${basename}.test.ts`),
      path.join(testDir, `${basename}.test.js`),
      path.join(testDir, `${basename}.spec.ts`),
      path.join(testDir, `${basename}.spec.js`),
      path.join('tests', 'unit', basename + '.test.ts'),
      path.join('tests', 'integration', basename + '.test.ts'),
      path.join('tests', 'e2e', basename + '.test.ts')
    ];
  }

  /**
   * Extract feature ID from file path
   */
  extractFeatureId(filePath) {
    // Try to extract from path
    const match = filePath.match(/(?:features?|components?|lib|src)\/([^/]+)/);
    if (match) {
      return match[1];
    }

    return 'feature-' + Date.now();
  }

  /**
   * Hook that runs AFTER tests are generated
   */
  async afterTestGeneration(testFiles, featureId) {
    console.log('\n🔴 TDD Enforcement Activated!');
    console.log('━'.repeat(60));

    // Automatically start TDD enforcement
    this.enforcer.startTDD(featureId, testFiles);

    console.log('\n⚡ NEXT STEPS:');
    console.log('   1. Tests are running now...');
    console.log('   2. Read the failures carefully');
    console.log('   3. Implement EXACTLY what tests expect');
    console.log('   4. Do NOT create different function names!');
    console.log('━'.repeat(60) + '\n');
  }

  /**
   * Hook that runs when implementation is complete
   */
  async afterImplementation() {
    const status = this.enforcer.getStatus();

    if (status.active && status.phase === 'GREEN') {
      console.log('\n🧪 Verifying implementation...');

      const result = this.enforcer.verifyGreenPhase();

      if (result.passed) {
        console.log('\n✅ TDD SUCCESS! All tests passing.');
        this.enforcer.completeTDD();
      } else {
        console.log('\n❌ Tests still failing!');
        console.log('🔧 Fix the remaining issues.\n');
      }
    }
  }

  /**
   * Get TDD compliance report
   */
  getComplianceReport() {
    const status = this.enforcer.getStatus();

    if (!status.active) {
      return {
        compliant: true,
        message: 'No active implementation'
      };
    }

    const report = {
      feature: status.feature,
      phase: status.phase,
      compliant: status.violations.length === 0,
      violations: status.violations,
      testRuns: status.testRuns,
      recommendations: []
    };

    // Add recommendations based on phase
    if (status.phase === 'RED' && status.testRuns === 0) {
      report.recommendations.push('Run tests immediately');
    }

    if (status.violations.length > 0) {
      report.recommendations.push('Fix implementation to match test expectations');
    }

    return report;
  }
}

// Global enforcer instance
const globalEnforcer = new AutoTDDEnforcer();

// Export hooks for integration
module.exports = {
  AutoTDDEnforcer,

  // Hook functions
  beforeFileWrite: (filePath, content, context) => {
    return globalEnforcer.beforeFileWrite(filePath, content, context);
  },

  afterTestGeneration: (testFiles, featureId) => {
    return globalEnforcer.afterTestGeneration(testFiles, featureId);
  },

  afterImplementation: () => {
    return globalEnforcer.afterImplementation();
  },

  getComplianceReport: () => {
    return globalEnforcer.getComplianceReport();
  }
};

// CLI interface for testing
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'check':
      const filePath = process.argv[3];
      const content = process.argv[4] || '';

      globalEnforcer.beforeFileWrite(filePath, content).then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.allowed ? 0 : 1);
      });
      break;

    case 'report':
      const report = globalEnforcer.getComplianceReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    default:
      console.log('Usage:');
      console.log('  auto-tdd-enforcer check <file-path> [content]');
      console.log('  auto-tdd-enforcer report');
  }
}