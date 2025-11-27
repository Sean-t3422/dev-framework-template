/**
 * @fileoverview Quality Gates for Dev Framework Testing System
 * Enforces quality standards before deployment
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Quality gate definitions by complexity level
 */
const GATE_DEFINITIONS = {
  trivial: [],
  simple: [
    {
      name: 'Integration Tests Pass',
      check: 'tests:integration',
      required: true,
    },
    {
      name: 'Minimum Coverage',
      check: 'coverage:30',
      required: true,
    },
  ],
  moderate: [
    {
      name: 'Integration Tests Pass',
      check: 'tests:integration',
      required: true,
    },
    {
      name: 'Unit Tests Pass',
      check: 'tests:unit',
      required: true,
    },
    {
      name: 'Minimum Coverage',
      check: 'coverage:50',
      required: true,
    },
    {
      name: 'Type Checking',
      check: 'typescript',
      required: true,
    },
  ],
  complex: [
    {
      name: 'All Tests Pass',
      check: 'tests:all',
      required: true,
    },
    {
      name: 'Coverage Target',
      check: 'coverage:70',
      required: true,
    },
    {
      name: 'Type Checking',
      check: 'typescript',
      required: true,
    },
    {
      name: 'Linting',
      check: 'lint',
      required: true,
    },
    {
      name: 'Cross-LLM Review',
      check: 'cross-llm-review',
      required: true,
    },
  ],
  critical: [
    {
      name: 'All Tests Pass',
      check: 'tests:all',
      required: true,
    },
    {
      name: 'High Coverage',
      check: 'coverage:85',
      required: true,
    },
    {
      name: 'Type Checking',
      check: 'typescript',
      required: true,
    },
    {
      name: 'Linting',
      check: 'lint',
      required: true,
    },
    {
      name: 'Security Tests',
      check: 'tests:security',
      required: true,
    },
    {
      name: 'Cross-LLM Review',
      check: 'cross-llm-review',
      required: true,
    },
    {
      name: 'Performance Benchmarks',
      check: 'performance',
      required: false, // Warning only for critical
    },
  ],
};

/**
 * Quality gates enforcement
 */
class QualityGates {
  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Enforce quality gates for a feature
   * @param {string} featureId - Feature identifier
   * @param {string} complexityLevel - Complexity level (trivial/simple/moderate/complex/critical)
   * @returns {Object} Gate results
   */
  async enforce(featureId, complexityLevel) {
    console.log(`\n🚧 Enforcing quality gates for ${complexityLevel} feature...`);

    const gates = GATE_DEFINITIONS[complexityLevel] || [];
    const results = [];

    for (const gate of gates) {
      const result = await this.checkGate(gate);
      results.push(result);

      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${gate.name}: ${result.message}`);
    }

    const allRequired = results
      .filter((r) => r.required)
      .every((r) => r.passed);

    return {
      passed: allRequired,
      gates: results,
      summary: this.generateSummary(results),
    };
  }

  /**
   * Check individual gate
   */
  async checkGate(gate) {
    const [checkType, checkParam] = gate.check.split(':');

    try {
      switch (checkType) {
        case 'tests':
          return await this.checkTests(checkParam, gate);
        case 'coverage':
          return await this.checkCoverage(parseInt(checkParam), gate);
        case 'typescript':
          return await this.checkTypeScript(gate);
        case 'lint':
          return await this.checkLint(gate);
        case 'cross-llm-review':
          return await this.checkCrossLLMReview(gate);
        case 'performance':
          return await this.checkPerformance(gate);
        default:
          return {
            name: gate.name,
            passed: false,
            required: gate.required,
            message: 'Unknown gate type',
          };
      }
    } catch (error) {
      return {
        name: gate.name,
        passed: false,
        required: gate.required,
        message: error.message,
      };
    }
  }

  /**
   * Check tests pass
   */
  async checkTests(testType, gate) {
    try {
      let command;

      switch (testType) {
        case 'integration':
          command = 'npx jest tests/integration --passWithNoTests';
          break;
        case 'unit':
          command = 'npx jest tests/unit --passWithNoTests';
          break;
        case 'security':
          command = 'npx jest tests/security --passWithNoTests';
          break;
        case 'all':
          command = 'npx jest --passWithNoTests && npx playwright test';
          break;
        default:
          command = 'npx jest --passWithNoTests';
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
      });

      return {
        name: gate.name,
        passed: true,
        required: gate.required,
        message: 'All tests passed',
      };
    } catch (error) {
      // Parse test failures from output
      const failureMatch = error.stdout?.match(/(\d+) failed/);
      const failureCount = failureMatch ? failureMatch[1] : 'unknown';

      return {
        name: gate.name,
        passed: false,
        required: gate.required,
        message: `${failureCount} test(s) failed`,
      };
    }
  }

  /**
   * Check coverage meets target
   */
  async checkCoverage(targetPercent, gate) {
    try {
      // Run tests with coverage
      await execAsync('npx jest --coverage --coverageReporters=json-summary', {
        cwd: this.projectRoot,
      });

      const coveragePath = path.join(
        this.projectRoot,
        'coverage',
        'coverage-summary.json'
      );

      const coverageData = JSON.parse(
        await fs.readFile(coveragePath, 'utf8')
      );

      const actualCoverage = coverageData.total.lines.pct;

      if (actualCoverage >= targetPercent) {
        return {
          name: gate.name,
          passed: true,
          required: gate.required,
          message: `Coverage: ${actualCoverage.toFixed(1)}% (target: ${targetPercent}%)`,
        };
      } else {
        return {
          name: gate.name,
          passed: false,
          required: gate.required,
          message: `Coverage: ${actualCoverage.toFixed(1)}% (needs: ${targetPercent}%)`,
        };
      }
    } catch (error) {
      return {
        name: gate.name,
        passed: false,
        required: gate.required,
        message: 'Could not determine coverage',
      };
    }
  }

  /**
   * Check TypeScript compiles without errors
   */
  async checkTypeScript(gate) {
    try {
      await execAsync('npx tsc --noEmit', {
        cwd: this.projectRoot,
      });

      return {
        name: gate.name,
        passed: true,
        required: gate.required,
        message: 'No type errors',
      };
    } catch (error) {
      const errorMatch = error.stdout?.match(/Found (\d+) error/);
      const errorCount = errorMatch ? errorMatch[1] : 'unknown';

      return {
        name: gate.name,
        passed: false,
        required: gate.required,
        message: `${errorCount} type error(s) found`,
      };
    }
  }

  /**
   * Check linting passes
   */
  async checkLint(gate) {
    try {
      await execAsync('npm run lint', {
        cwd: this.projectRoot,
      });

      return {
        name: gate.name,
        passed: true,
        required: gate.required,
        message: 'No linting errors',
      };
    } catch (error) {
      const errorMatch = error.stdout?.match(/(\d+) error/);
      const errorCount = errorMatch ? errorMatch[1] : 'unknown';

      return {
        name: gate.name,
        passed: false,
        required: gate.required,
        message: `${errorCount} linting error(s) found`,
      };
    }
  }

  /**
   * Check cross-LLM review was completed
   */
  async checkCrossLLMReview(gate) {
    // This is checked by the orchestrator
    // Here we just verify the review marker file exists
    try {
      const reviewPath = path.join(
        this.projectRoot,
        '.dev-framework',
        'reviews',
        'latest-review.json'
      );

      await fs.access(reviewPath);

      const reviewData = JSON.parse(await fs.readFile(reviewPath, 'utf8'));

      return {
        name: gate.name,
        passed: true,
        required: gate.required,
        message: `Cross-LLM review completed (${reviewData.filesReviewed} files)`,
      };
    } catch (error) {
      return {
        name: gate.name,
        passed: false,
        required: gate.required,
        message: 'Cross-LLM review not completed',
      };
    }
  }

  /**
   * Check performance benchmarks
   */
  async checkPerformance(gate) {
    try {
      // Look for performance test results
      const perfPath = path.join(
        this.projectRoot,
        '.dev-framework',
        'performance',
        'latest-benchmarks.json'
      );

      await fs.access(perfPath);

      return {
        name: gate.name,
        passed: true,
        required: gate.required,
        message: 'Performance benchmarks available',
      };
    } catch (error) {
      return {
        name: gate.name,
        passed: false,
        required: gate.required,
        message: 'Performance benchmarks not run (warning only)',
      };
    }
  }

  /**
   * Generate summary of gate results
   */
  generateSummary(results) {
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const requiredFailed = results.filter((r) => !r.passed && r.required).length;

    return {
      total,
      passed,
      failed,
      requiredFailed,
      message:
        requiredFailed === 0
          ? 'All required quality gates passed'
          : `${requiredFailed} required gate(s) failed`,
    };
  }

  /**
   * Generate quality gate report
   */
  async generateReport(featureId, results) {
    const reportDir = path.join(this.projectRoot, '.dev-framework', 'gates');
    await fs.mkdir(reportDir, { recursive: true });

    const reportPath = path.join(reportDir, `${featureId}-gates.json`);

    const report = {
      featureId,
      timestamp: new Date().toISOString(),
      results,
      summary: this.generateSummary(results),
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return reportPath;
  }
}

module.exports = QualityGates;
