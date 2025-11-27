/**
 * @fileoverview Complexity Analyzer for Dev Framework Testing
 * Analyzes feature complexity to determine appropriate test coverage
 * Part of the Dev Framework Testing System
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Test requirements by complexity level
 */
const COMPLEXITY_LEVELS = {
  trivial: {
    level: 'trivial',
    name: 'Trivial Change',
    testStrategy: 'Verify existing tests pass',
    coverage: null,
    examples: ['typo fix', 'label update', 'color change', 'copy edit'],
    estimatedFiles: '1 file, < 10 lines',
    testTypes: [],
  },
  simple: {
    level: 'simple',
    name: 'Simple Feature',
    testStrategy: 'Integration test for happy path',
    coverage: { statements: 30, branches: 20, functions: 25, lines: 30 },
    examples: ['add button', 'fix bug', 'update component', 'basic form'],
    estimatedFiles: '1-2 files, < 50 lines',
    testTypes: ['integration'],
  },
  moderate: {
    level: 'moderate',
    name: 'Moderate Feature',
    testStrategy: 'Integration + unit tests for business logic',
    coverage: { statements: 50, branches: 40, functions: 45, lines: 50 },
    examples: ['new feature', 'API integration', 'form validation', 'data flow'],
    estimatedFiles: '3-5 files, < 200 lines',
    testTypes: ['integration', 'unit'],
  },
  complex: {
    level: 'complex',
    name: 'Complex Feature',
    testStrategy: 'Full TDD workflow with comprehensive testing',
    coverage: { statements: 70, branches: 60, functions: 65, lines: 70 },
    examples: ['new system', 'workflow redesign', 'multi-step feature'],
    estimatedFiles: '5-10 files, < 500 lines',
    testTypes: ['integration', 'unit', 'e2e', 'edge-cases'],
  },
  critical: {
    level: 'critical',
    name: 'Critical/Large Feature',
    testStrategy: 'Complete test suite with security and performance validation',
    coverage: { statements: 85, branches: 75, functions: 80, lines: 85 },
    examples: ['architecture change', 'data migration', 'new module', 'auth system'],
    estimatedFiles: '10+ files, 500+ lines',
    testTypes: ['integration', 'unit', 'e2e', 'edge-cases', 'security', 'performance'],
  },
};

/**
 * Pattern matching for complexity detection
 */
const COMPLEXITY_PATTERNS = {
  trivial: [
    /fix\s+typo/i,
    /update\s+(label|text|copy)/i,
    /change\s+(color|style|css)/i,
    /rename/i,
    /formatting/i,
  ],
  simple: [
    /add\s+button/i,
    /fix\s+bug/i,
    /update\s+component/i,
    /simple\s+/i,
    /basic\s+/i,
  ],
  moderate: [
    /implement\s+/i,
    /integrate\s+/i,
    /add\s+validation/i,
    /create\s+form/i,
    /enhance\s+/i,
  ],
  complex: [
    /new\s+system/i,
    /redesign/i,
    /refactor/i,
    /complex\s+/i,
    /advanced\s+/i,
  ],
  critical: [
    /architecture/i,
    /migrate/i,
    /overhaul/i,
    /infrastructure/i,
    /framework/i,
  ],
};

/**
 * Main complexity analyzer
 */
class ComplexityAnalyzer {
  constructor() {
    this.learningData = new Map();
    this.confidenceThreshold = 0.7;
  }

  /**
   * Analyze feature complexity from brief/blueprint
   * @param {Object} feature - Feature object with title, description, requirements
   * @returns {Object} Analysis result with complexity level and test requirements
   */
  async analyze(feature) {
    const titleScore = this.analyzeTitle(feature.title || '');
    const requirementsCount = (feature.requirements || feature.acceptanceCriteria || []).length;
    const descriptionHints = this.analyzeDescription(feature.description || '');
    const fileImpact = await this.estimateFileImpact(feature);

    // Weighted complexity scoring
    const weights = {
      title: 0.3,
      requirements: 0.2,
      description: 0.25,
      files: 0.25,
    };

    const complexityScore = this.computeComplexityScore(
      titleScore,
      requirementsCount,
      descriptionHints,
      fileImpact,
      weights
    );

    const level = this.scoreToLevel(complexityScore);
    const confidence = this.calculateConfidence(
      titleScore,
      requirementsCount,
      descriptionHints,
      fileImpact
    );

    return {
      level,
      confidence,
      profile: COMPLEXITY_LEVELS[level],
      analysis: this.explainAnalysis(
        level,
        titleScore,
        requirementsCount,
        descriptionHints,
        fileImpact
      ),
      recommendations: this.getRecommendations(level, feature),
    };
  }

  /**
   * Analyze title for complexity indicators
   */
  analyzeTitle(title) {
    for (const [level, patterns] of Object.entries(COMPLEXITY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(title)) {
          return this.levelToScore(level);
        }
      }
    }
    return 2; // Default to moderate if no pattern matches
  }

  /**
   * Analyze description for complexity keywords
   */
  analyzeDescription(description) {
    const keywords = {
      trivial: ['cosmetic', 'typo', 'label', 'text'],
      simple: ['simple', 'basic', 'straightforward', 'minor'],
      moderate: ['feature', 'integration', 'api', 'form'],
      complex: ['complex', 'system', 'redesign', 'multiple'],
      critical: ['architecture', 'migration', 'infrastructure', 'framework'],
    };

    const desc = description.toLowerCase();
    let bestMatch = 'moderate';
    let maxMatches = 0;

    for (const [level, words] of Object.entries(keywords)) {
      const matches = words.filter((word) => desc.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = level;
      }
    }

    return this.levelToScore(bestMatch);
  }

  /**
   * Estimate file impact from feature description
   */
  async estimateFileImpact(feature) {
    const impactKeywords = {
      component: /component|button|form|modal|card/i,
      api: /api|endpoint|route|server/i,
      database: /database|schema|model|migration/i,
      style: /style|css|theme|design/i,
      config: /config|settings|env/i,
    };

    const text = `${feature.title} ${feature.description}`.toLowerCase();
    let impactedAreas = 0;

    for (const [area, pattern] of Object.entries(impactKeywords)) {
      if (pattern.test(text)) {
        impactedAreas++;
      }
    }

    // Map impacted areas to complexity score
    if (impactedAreas === 0) return 0; // trivial
    if (impactedAreas === 1) return 1; // simple
    if (impactedAreas === 2) return 2; // moderate
    if (impactedAreas === 3) return 3; // complex
    return 4; // critical
  }

  /**
   * Compute weighted complexity score
   */
  computeComplexityScore(titleScore, requirementsCount, descScore, fileScore, weights) {
    // Map requirements count to score (0-4)
    const requirementsScore = Math.min(requirementsCount / 2, 4);

    return (
      titleScore * weights.title +
      requirementsScore * weights.requirements +
      descScore * weights.description +
      fileScore * weights.files
    );
  }

  /**
   * Convert numeric score to complexity level
   */
  scoreToLevel(score) {
    if (score < 0.5) return 'trivial';
    if (score < 1.5) return 'simple';
    if (score < 2.5) return 'moderate';
    if (score < 3.5) return 'complex';
    return 'critical';
  }

  /**
   * Convert complexity level to numeric score
   */
  levelToScore(level) {
    const scores = { trivial: 0, simple: 1, moderate: 2, complex: 3, critical: 4 };
    return scores[level] || 2;
  }

  /**
   * Calculate confidence in the analysis
   */
  calculateConfidence(titleScore, requirementsCount, descScore, fileScore) {
    // Higher confidence when all signals align
    const scores = [
      titleScore,
      Math.min(requirementsCount / 2, 4),
      descScore,
      fileScore,
    ];

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;

    // Lower variance = higher confidence
    const confidence = Math.max(0, Math.min(1, 1 - variance / 4));
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Explain the analysis decision
   */
  explainAnalysis(level, titleScore, requirementsCount, descScore, fileScore) {
    const profile = COMPLEXITY_LEVELS[level];
    const factors = [];

    if (titleScore === this.levelToScore(level)) {
      factors.push(`Title indicates ${profile.name.toLowerCase()}`);
    }

    if (requirementsCount > 0) {
      factors.push(`${requirementsCount} requirements defined`);
    }

    factors.push(`Estimated impact: ${profile.estimatedFiles}`);

    return {
      level: profile.name,
      factors,
      testTypes: profile.testTypes,
      coverageTargets: profile.coverage,
    };
  }

  /**
   * Get recommendations based on complexity
   */
  getRecommendations(level, feature) {
    const recommendations = [];

    switch (level) {
      case 'trivial':
        recommendations.push('Run existing test suite to verify no regressions');
        recommendations.push('No new tests required for cosmetic changes');
        break;
      case 'simple':
        recommendations.push('Write integration test for the primary user flow');
        recommendations.push('Focus on happy path coverage');
        break;
      case 'moderate':
        recommendations.push('Write integration tests for user workflows');
        recommendations.push('Add unit tests for business logic');
        recommendations.push('Cover main error cases');
        break;
      case 'complex':
        recommendations.push('Use full TDD approach - write tests first');
        recommendations.push('Include comprehensive edge case testing');
        recommendations.push('Consider breaking into smaller features');
        recommendations.push('Add cross-LLM review for critical logic');
        break;
      case 'critical':
        recommendations.push('Requires architecture review before implementation');
        recommendations.push('Create multiple focused features instead of one large feature');
        recommendations.push('Include security testing for sensitive operations');
        recommendations.push('Add performance benchmarks');
        recommendations.push('Mandatory cross-LLM review for all code');
        break;
    }

    return recommendations;
  }

  /**
   * Validate prediction after implementation
   */
  async validatePrediction(featureId, predictedLevel, actualDiff) {
    const actualLines = this.countDiffLines(actualDiff);
    const actualFiles = this.countDiffFiles(actualDiff);

    let actualLevel = 'trivial';
    if (actualFiles > 10 || actualLines > 500) actualLevel = 'critical';
    else if (actualFiles > 5 || actualLines > 200) actualLevel = 'complex';
    else if (actualFiles > 2 || actualLines > 50) actualLevel = 'moderate';
    else if (actualFiles > 1 || actualLines > 10) actualLevel = 'simple';

    const mismatch =
      this.levelToScore(actualLevel) - this.levelToScore(predictedLevel);

    if (Math.abs(mismatch) > 1) {
      return {
        warning: `Feature was estimated as ${predictedLevel} but actual impact was ${actualLevel}`,
        suggestion: `Consider adjusting tests to match ${COMPLEXITY_LEVELS[actualLevel].name} requirements`,
        actualProfile: COMPLEXITY_LEVELS[actualLevel],
      };
    }

    return { match: true, message: 'Complexity estimate was accurate' };
  }

  countDiffLines(diff) {
    return (diff.match(/^\+[^+]/gm) || []).length;
  }

  countDiffFiles(diff) {
    return (diff.match(/^diff --git/gm) || []).length;
  }
}

module.exports = ComplexityAnalyzer;
