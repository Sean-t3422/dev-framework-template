/**
 * @fileoverview Orchestrator Validation Layer
 * Reviews and validates advice from all hooks before implementation
 * Ensures consistency, resolves conflicts, and enforces project patterns
 */

const fs = require('fs').promises;
const path = require('path');

class OrchestratorValidator {
  constructor(options = {}) {
    this.options = {
      maxRevisionIterations: 3,
      enableConflictResolution: true,
      enforcePatterns: true,
      ...options
    };

    // Track validation history
    this.validationHistory = [];
    this.rejectionReasons = new Map();
    this.patternViolations = [];
  }

  /**
   * Validate all hook advice before implementation
   * @param {Array} hookAdvice - Accumulated advice from all hooks
   * @param {Object} projectContext - Project patterns and completed features
   * @returns {Object} Validation result with conflicts and recommendations
   */
  async validateHookAdvice(hookAdvice, projectContext) {
    console.log('\n🔍 Orchestrator Validation Starting...');

    const validation = {
      approved: false,
      conflicts: [],
      patternViolations: [],
      missingRequirements: [],
      recommendations: [],
      implementationPlan: null,
      requiresRevision: false,
      revisionRequests: []
    };

    // 1. Check for conflicts between hooks
    validation.conflicts = await this.detectConflicts(hookAdvice);

    // 2. Validate against project patterns
    validation.patternViolations = await this.checkPatternCompliance(
      hookAdvice,
      projectContext.patterns
    );

    // 3. Check for missing critical requirements
    validation.missingRequirements = await this.checkRequirements(
      hookAdvice,
      projectContext.brief
    );

    // 4. Validate security recommendations
    const securityIssues = await this.validateSecurityAdvice(hookAdvice);
    if (securityIssues.length > 0) {
      validation.conflicts.push(...securityIssues);
    }

    // 5. Check test coverage recommendations
    const testIssues = await this.validateTestStrategy(hookAdvice);
    if (testIssues.length > 0) {
      validation.missingRequirements.push(...testIssues);
    }

    // Determine if revision is needed
    validation.requiresRevision =
      validation.conflicts.length > 0 ||
      validation.patternViolations.length > 0 ||
      validation.missingRequirements.length > 0;

    if (validation.requiresRevision) {
      // Generate specific revision requests for each hook
      validation.revisionRequests = this.generateRevisionRequests(
        validation,
        hookAdvice
      );
    } else {
      // All good - create implementation plan
      validation.approved = true;
      validation.implementationPlan = await this.createImplementationPlan(
        hookAdvice,
        projectContext
      );
    }

    // Track validation history
    this.validationHistory.push({
      timestamp: new Date(),
      result: validation,
      hookCount: hookAdvice.length
    });

    return validation;
  }

  /**
   * Detect conflicts between different hook recommendations
   */
  async detectConflicts(hookAdvice) {
    const conflicts = [];

    // Check UI vs Performance advice
    const uiAdvice = hookAdvice.find(h => h.hookName === 'ui-requirements');
    const perfAdvice = hookAdvice.find(h => h.hookName === 'performance-check');

    if (uiAdvice && perfAdvice) {
      if (uiAdvice.findings?.suggestions?.includes('rich animations') &&
          perfAdvice.findings?.issues?.includes('performance concerns')) {
        conflicts.push({
          type: 'ui-performance',
          hooks: ['ui-requirements', 'performance-check'],
          description: 'UI suggests rich animations but performance advisor warns against it',
          resolution: 'Use CSS transforms for animations, limit to essential interactions'
        });
      }
    }

    // Check Security vs UX advice
    const securityAdvice = hookAdvice.find(h => h.hookName === 'security-review');
    if (uiAdvice && securityAdvice) {
      if (uiAdvice.findings?.suggestions?.includes('remember me') &&
          securityAdvice.findings?.issues?.includes('session management')) {
        conflicts.push({
          type: 'security-ux',
          hooks: ['ui-requirements', 'security-review'],
          description: 'UX wants persistent sessions but security requires strict timeout',
          resolution: 'Implement secure remember-me with refresh tokens, max 30 day expiry'
        });
      }
    }

    // Check Test Strategy vs Complexity
    const testAdvice = hookAdvice.find(h => h.hookName === 'test-strategy');
    const briefAdvice = hookAdvice.find(h => h.hookName === 'brief-analysis');

    if (testAdvice && briefAdvice) {
      const complexity = briefAdvice.findings?.complexity;
      const coverage = testAdvice.findings?.coverage;

      if (complexity === 'critical' && coverage < 85) {
        conflicts.push({
          type: 'test-complexity',
          hooks: ['brief-analysis', 'test-strategy'],
          description: 'Critical feature requires 85% coverage but test strategy suggests less',
          resolution: 'Increase test coverage target to 85% for critical features'
        });
      }
    }

    return conflicts;
  }

  /**
   * Check compliance with project patterns
   */
  async checkPatternCompliance(hookAdvice, patterns = {}) {
    const violations = [];

    // Check for required exports
    const needsDynamicExports = patterns.requireDynamicExports !== false;
    const briefAdvice = hookAdvice.find(h => h.hookName === 'brief-analysis');

    if (needsDynamicExports && briefAdvice?.findings?.type === 'route') {
      let hasExportMention = false;
      for (const advice of hookAdvice) {
        if (advice.findings?.suggestions?.some(s =>
          s.includes('dynamic') || s.includes('runtime'))) {
          hasExportMention = true;
          break;
        }
      }

      if (!hasExportMention) {
        violations.push({
          pattern: 'required-exports',
          description: 'No hook mentioned required dynamic/runtime exports for routes',
          fix: 'Add exports: export const dynamic = "force-dynamic"; export const runtime = "nodejs";'
        });
      }
    }

    // Check for Suspense boundaries with client components
    const uiAdvice = hookAdvice.find(h => h.hookName === 'ui-requirements');
    if (uiAdvice?.findings?.suggestions?.some(s => s.includes('client component'))) {
      let hasSuspenseMention = false;
      for (const advice of hookAdvice) {
        if (advice.findings?.suggestions?.some(s =>
          s.includes('Suspense') || s.includes('loading boundary'))) {
          hasSuspenseMention = true;
          break;
        }
      }

      if (!hasSuspenseMention) {
        violations.push({
          pattern: 'suspense-boundaries',
          description: 'Client components need Suspense boundaries but none mentioned',
          fix: 'Wrap client components in Suspense with fallback'
        });
      }
    }

    // Check for dark mode support
    if (patterns.requireDarkMode && uiAdvice) {
      let hasDarkModeMention = false;
      for (const advice of hookAdvice) {
        if (advice.findings?.suggestions?.some(s =>
          s.includes('dark:') || s.includes('dark mode'))) {
          hasDarkModeMention = true;
          break;
        }
      }

      if (!hasDarkModeMention) {
        violations.push({
          pattern: 'dark-mode',
          description: 'UI implementation must support dark mode',
          fix: 'Add dark: variants for all color classes'
        });
      }
    }

    return violations;
  }

  /**
   * Check for missing requirements
   */
  async checkRequirements(hookAdvice, brief) {
    const missing = [];

    // Check if all brief requirements are addressed
    const requirements = brief.requirements || [];
    const allSuggestions = hookAdvice.flatMap(h =>
      h.findings?.suggestions || []
    );

    for (const req of requirements) {
      const isAddressed = allSuggestions.some(s =>
        s.toLowerCase().includes(req.toLowerCase().slice(0, 20))
      );

      if (!isAddressed) {
        missing.push({
          requirement: req,
          source: 'brief',
          severity: 'high'
        });
      }
    }

    // Check for RLS policies if database work
    const hasDatabase = hookAdvice.some(h =>
      h.findings?.suggestions?.some(s =>
        s.includes('database') || s.includes('Supabase')
      )
    );

    if (hasDatabase) {
      const hasRLS = hookAdvice.some(h =>
        h.findings?.suggestions?.some(s =>
          s.includes('RLS') || s.includes('row level security')
        )
      );

      if (!hasRLS) {
        missing.push({
          requirement: 'Row Level Security policies',
          source: 'security',
          severity: 'critical'
        });
      }
    }

    return missing;
  }

  /**
   * Validate security advice
   */
  async validateSecurityAdvice(hookAdvice) {
    const issues = [];
    const securityAdvice = hookAdvice.find(h => h.hookName === 'security-review');

    if (!securityAdvice) {
      // Security review should always be present
      issues.push({
        type: 'missing-security',
        hooks: ['security-review'],
        description: 'No security review was performed',
        resolution: 'Run security review hook'
      });
    } else if (securityAdvice.findings?.risks?.length > 0) {
      // Check if critical risks are addressed
      const criticalRisks = securityAdvice.findings.risks.filter(r =>
        r.includes('critical') || r.includes('high')
      );

      if (criticalRisks.length > 0) {
        issues.push({
          type: 'unaddressed-risks',
          hooks: ['security-review'],
          description: `Critical security risks not addressed: ${criticalRisks.join(', ')}`,
          resolution: 'Address all critical security risks before implementation'
        });
      }
    }

    return issues;
  }

  /**
   * Validate test strategy
   */
  async validateTestStrategy(hookAdvice) {
    const issues = [];
    const testAdvice = hookAdvice.find(h => h.hookName === 'test-strategy');
    const briefAdvice = hookAdvice.find(h => h.hookName === 'brief-analysis');

    if (!testAdvice) {
      issues.push({
        requirement: 'Test strategy',
        source: 'testing',
        severity: 'high'
      });
    } else {
      const complexity = briefAdvice?.findings?.complexity || 'moderate';
      const suggestedCoverage = testAdvice.findings?.coverage || 0;

      const minimumCoverage = {
        trivial: 0,
        simple: 30,
        moderate: 50,
        complex: 70,
        critical: 85
      };

      if (suggestedCoverage < minimumCoverage[complexity]) {
        issues.push({
          requirement: `Minimum ${minimumCoverage[complexity]}% coverage for ${complexity} features`,
          source: 'testing',
          severity: 'high'
        });
      }
    }

    return issues;
  }

  /**
   * Generate revision requests for specific hooks
   */
  generateRevisionRequests(validation, hookAdvice) {
    const requests = [];

    // For each conflict, identify which hooks need revision
    for (const conflict of validation.conflicts) {
      for (const hookName of conflict.hooks) {
        requests.push({
          hookName,
          type: 'conflict',
          issue: conflict.description,
          suggestion: conflict.resolution
        });
      }
    }

    // For pattern violations, usually the brief or UI hooks need revision
    for (const violation of validation.patternViolations) {
      const targetHook = violation.pattern.includes('ui') ? 'ui-requirements' : 'brief-analysis';
      requests.push({
        hookName: targetHook,
        type: 'pattern-violation',
        issue: violation.description,
        suggestion: violation.fix
      });
    }

    // For missing requirements, identify responsible hook
    for (const missing of validation.missingRequirements) {
      let targetHook = 'brief-analysis';
      if (missing.source === 'security') targetHook = 'security-review';
      if (missing.source === 'testing') targetHook = 'test-strategy';

      requests.push({
        hookName: targetHook,
        type: 'missing-requirement',
        issue: `Missing: ${missing.requirement}`,
        suggestion: `Add analysis for: ${missing.requirement}`
      });
    }

    // Deduplicate requests by hook
    const deduped = new Map();
    for (const req of requests) {
      if (!deduped.has(req.hookName)) {
        deduped.set(req.hookName, []);
      }
      deduped.get(req.hookName).push(req);
    }

    return Array.from(deduped.entries()).map(([hookName, reqs]) => ({
      hookName,
      revisions: reqs
    }));
  }

  /**
   * Create implementation plan from validated advice
   */
  async createImplementationPlan(hookAdvice, projectContext) {
    const plan = {
      overview: '',
      sequence: [],
      testStrategy: {},
      designApproach: {},
      securityMeasures: [],
      performanceConsiderations: [],
      regressionPrevention: [],
      blueprintReference: null
    };

    // Extract key information from each hook
    const briefAdvice = hookAdvice.find(h => h.hookName === 'brief-analysis');
    const uiAdvice = hookAdvice.find(h => h.hookName === 'ui-requirements');
    const testAdvice = hookAdvice.find(h => h.hookName === 'test-strategy');
    const securityAdvice = hookAdvice.find(h => h.hookName === 'security-review');
    const perfAdvice = hookAdvice.find(h => h.hookName === 'performance-check');
    const regressionAdvice = hookAdvice.find(h => h.hookName === 'regression-risk');

    // Build overview
    plan.overview = briefAdvice?.findings?.description || 'Feature implementation';

    // Build implementation sequence
    plan.sequence = this.buildImplementationSequence(hookAdvice, projectContext);

    // Set test strategy
    if (testAdvice) {
      plan.testStrategy = {
        approach: testAdvice.findings?.approach || 'TDD',
        coverage: testAdvice.findings?.coverage || 50,
        types: testAdvice.findings?.testTypes || ['unit', 'integration'],
        criticalPaths: testAdvice.findings?.criticalPaths || []
      };
    }

    // Set design approach
    if (uiAdvice) {
      plan.designApproach = {
        style: uiAdvice.findings?.style || 'balanced',
        patterns: uiAdvice.findings?.patterns || [],
        accessibility: uiAdvice.findings?.accessibility || [],
        responsive: uiAdvice.findings?.responsive || true
      };
    }

    // Compile security measures
    if (securityAdvice) {
      plan.securityMeasures = securityAdvice.findings?.suggestions || [];
    }

    // Add performance considerations
    if (perfAdvice) {
      plan.performanceConsiderations = perfAdvice.findings?.suggestions || [];
    }

    // Add regression prevention
    if (regressionAdvice) {
      plan.regressionPrevention = regressionAdvice.findings?.suggestions || [];
    }

    // Find matching blueprint
    plan.blueprintReference = await this.findMatchingBlueprint(
      briefAdvice?.findings?.type,
      projectContext
    );

    return plan;
  }

  /**
   * Build step-by-step implementation sequence
   */
  buildImplementationSequence(hookAdvice, projectContext) {
    const sequence = [];

    // 1. Database/Model setup (if needed)
    const needsDatabase = hookAdvice.some(h =>
      h.findings?.suggestions?.some(s => s.includes('database'))
    );

    if (needsDatabase) {
      sequence.push({
        step: 1,
        type: 'database',
        description: 'Set up database tables and RLS policies',
        tasks: [
          'Create migration files',
          'Define table schema',
          'Set up RLS policies',
          'Add indexes for performance'
        ]
      });
    }

    // 2. API routes (if needed)
    const needsAPI = hookAdvice.some(h =>
      h.findings?.suggestions?.some(s => s.includes('API') || s.includes('endpoint'))
    );

    if (needsAPI) {
      sequence.push({
        step: sequence.length + 1,
        type: 'api',
        description: 'Create API endpoints',
        tasks: [
          'Set up route handlers',
          'Add authentication middleware',
          'Implement validation',
          'Add error handling'
        ]
      });
    }

    // 3. UI Components
    const uiAdvice = hookAdvice.find(h => h.hookName === 'ui-requirements');
    if (uiAdvice) {
      sequence.push({
        step: sequence.length + 1,
        type: 'ui',
        description: 'Build UI components',
        tasks: [
          'Create component structure',
          'Implement responsive design',
          'Add dark mode support',
          'Set up loading states',
          'Add error boundaries'
        ]
      });
    }

    // 4. Integration
    sequence.push({
      step: sequence.length + 1,
      type: 'integration',
      description: 'Integrate components',
      tasks: [
        'Connect UI to API',
        'Set up state management',
        'Add data fetching',
        'Implement error handling'
      ]
    });

    // 5. Testing
    sequence.push({
      step: sequence.length + 1,
      type: 'testing',
      description: 'Write and run tests',
      tasks: [
        'Write unit tests',
        'Write integration tests',
        'Add E2E tests for critical paths',
        'Verify coverage targets'
      ]
    });

    return sequence;
  }

  /**
   * Find matching blueprint for feature type
   */
  async findMatchingBlueprint(featureType, projectContext) {
    if (!featureType) return null;

    // Map feature types to blueprint patterns
    const blueprintMapping = {
      'authentication': 'auth-flow',
      'payment': 'payment-processing',
      'crud': 'crud-operations',
      'dashboard': 'dashboard-layout',
      'form': 'form-validation',
      'api': 'api-endpoint',
      'migration': 'database-migration'
    };

    const blueprintName = blueprintMapping[featureType];
    if (!blueprintName) return null;

    // Check if blueprint exists
    const blueprintPath = path.join(
      projectContext.projectRoot || process.cwd(),
      'blueprints',
      `${blueprintName}.md`
    );

    try {
      await fs.access(blueprintPath);
      return {
        name: blueprintName,
        path: blueprintPath,
        type: featureType
      };
    } catch {
      return null;
    }
  }

  /**
   * Get validation statistics
   */
  getStatistics() {
    const totalValidations = this.validationHistory.length;
    const approved = this.validationHistory.filter(v => v.result.approved).length;
    const rejected = totalValidations - approved;

    return {
      total: totalValidations,
      approved,
      rejected,
      approvalRate: totalValidations > 0 ? (approved / totalValidations * 100).toFixed(1) : 0,
      commonRejectionReasons: this.getCommonRejectionReasons()
    };
  }

  /**
   * Get common rejection reasons for feedback
   */
  getCommonRejectionReasons() {
    const reasons = {};

    for (const validation of this.validationHistory) {
      if (!validation.result.approved) {
        // Count conflict types
        for (const conflict of validation.result.conflicts) {
          reasons[conflict.type] = (reasons[conflict.type] || 0) + 1;
        }

        // Count pattern violations
        for (const violation of validation.result.patternViolations) {
          reasons[violation.pattern] = (reasons[violation.pattern] || 0) + 1;
        }
      }
    }

    return Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  }
}

module.exports = OrchestratorValidator;