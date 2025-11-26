#!/usr/bin/env node

/**
 * Simple Complexity Detector
 * Determines if a task is simple enough to bypass TDD
 */

class ComplexityDetector {
  constructor() {
    this.simplePatterns = [
      /update.*text/i,
      /fix.*typo/i,
      /change.*color/i,
      /adjust.*spacing/i,
      /update.*style/i,
      /add.*comment/i,
      /update.*readme/i,
      /fix.*link/i,
      /update.*documentation/i,
      /change.*label/i,
      /rename.*variable/i
    ];

    this.complexIndicators = [
      /database/i,
      /schema/i,
      /migration/i,
      /authentication/i,
      /payment/i,
      /security/i,
      /api.*endpoint/i,
      /integration/i,
      /refactor/i
    ];
  }

  /**
   * Analyze task complexity
   * @param {string} description - Task description
   * @param {number} fileCount - Estimated files to change
   * @returns {object} Complexity analysis
   */
  analyze(description, fileCount = null) {
    // Check for simple patterns
    const isSimplePattern = this.simplePatterns.some(pattern =>
      pattern.test(description)
    );

    // Check for complex indicators
    const hasComplexIndicator = this.complexIndicators.some(pattern =>
      pattern.test(description)
    );

    // Determine complexity
    let complexity = 'medium';
    let skipTDD = false;
    let reason = '';

    if (isSimplePattern && !hasComplexIndicator) {
      complexity = 'simple';
      skipTDD = true;
      reason = 'Simple UI/text change detected';
    } else if (fileCount && fileCount <= 3 && !hasComplexIndicator) {
      complexity = 'simple';
      skipTDD = true;
      reason = `Only ${fileCount} file(s) affected`;
    } else if (hasComplexIndicator) {
      complexity = 'complex';
      skipTDD = false;
      reason = 'Critical functionality detected';
    } else if (fileCount && fileCount > 10) {
      complexity = 'complex';
      skipTDD = false;
      reason = 'Large scope change';
    }

    return {
      complexity,
      skipTDD,
      reason,
      recommendation: skipTDD
        ? '✅ Fast path: Skip TDD for this simple change'
        : '🔴 TDD Required: This change affects critical functionality'
    };
  }

  /**
   * Check if current task should bypass TDD
   * @param {string} taskFile - Path to task/brief file
   * @returns {boolean}
   */
  shouldSkipTDD(taskFile) {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(taskFile, 'utf8');

      // Try to parse as JSON first
      let description = '';
      try {
        const json = JSON.parse(content);
        description = json.title || json.description || '';
      } catch {
        // If not JSON, use first line as description
        description = content.split('\n')[0];
      }

      const result = this.analyze(description);

      if (result.skipTDD) {
        console.log('🚀 ' + result.recommendation);
        console.log('   Reason:', result.reason);
      }

      return result.skipTDD;
    } catch (error) {
      console.error('Error checking complexity:', error);
      return false; // Default to TDD if unsure
    }
  }
}

// CLI interface
if (require.main === module) {
  const detector = new ComplexityDetector();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: complexity-detector <description> [fileCount]');
    console.log('   or: complexity-detector --file <path>');
    process.exit(1);
  }

  if (args[0] === '--file') {
    const skipTDD = detector.shouldSkipTDD(args[1]);
    process.exit(skipTDD ? 0 : 1);
  } else {
    const description = args[0];
    const fileCount = parseInt(args[1]) || null;
    const result = detector.analyze(description, fileCount);

    console.log('Complexity Analysis:');
    console.log('  Level:', result.complexity);
    console.log('  Skip TDD:', result.skipTDD);
    console.log('  Reason:', result.reason);
    console.log('  ' + result.recommendation);

    process.exit(result.skipTDD ? 0 : 1);
  }
}

module.exports = ComplexityDetector;
