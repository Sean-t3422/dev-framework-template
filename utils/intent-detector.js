#!/usr/bin/env node

/**
 * Intent Detector - Recognizes user intent and suggests workflows
 * Makes Dev Framework proactive like Logelo
 */

class IntentDetector {
  constructor() {
    this.patterns = {
      build: {
        regex: /\b(i want to|i need to|let's|help me|can you|please|could you)?\s*(build|create|implement|develop|add|make)\b/i,
        workflow: 'build-feature',
        description: 'Building/creating new features'
      },

      discover: {
        regex: /\b(i want to start|let's start|thinking about|planning|designing|figuring out)\b/i,
        workflow: 'discover-plan',
        description: 'Discovery and planning phase'
      },

      fix: {
        regex: /\b(fix|repair|broken|issue|bug|typo|error|problem|wrong|incorrect)\b/i,
        workflow: 'fast-fix',
        description: 'Bug fixes and corrections'
      },

      update: {
        regex: /\b(update|change|modify|adjust|tweak|rename|move)\s+(the|this|that)?\s*\w+/i,
        workflow: 'simple-update',
        description: 'Simple updates and changes'
      },

      test: {
        regex: /\b(write tests?|create tests?|add tests?|test coverage|unit test|integration test|e2e test)\b/i,
        workflow: 'test-generation',
        description: 'Test creation and coverage'
      },

      document: {
        regex: /\b(document|documentation|docs|explain|describe how|write docs)\b/i,
        workflow: 'documentation',
        description: 'Documentation tasks'
      },

      refactor: {
        regex: /\b(refactor|restructure|reorganize|clean up|improve|optimize)\b/i,
        workflow: 'refactor',
        description: 'Code refactoring and cleanup'
      },

      review: {
        regex: /\b(review|check|analyze|audit|inspect|look at)\s+(the|this|my)?\s*(code|implementation|feature)\b/i,
        workflow: 'code-review',
        description: 'Code review and analysis'
      }
    };
  }

  /**
   * Detect intent from user input
   * @param {string} input - User's message
   * @returns {object} Detected intent and recommended workflow
   */
  detect(input) {
    const results = [];

    // Check each pattern
    for (const [intent, config] of Object.entries(this.patterns)) {
      if (config.regex.test(input)) {
        results.push({
          intent,
          workflow: config.workflow,
          description: config.description,
          confidence: this.calculateConfidence(input, config.regex)
        });
      }
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    // Return best match or null
    if (results.length > 0) {
      return {
        primary: results[0],
        alternatives: results.slice(1),
        shouldAutoExecute: results[0].confidence > 0.7
      };
    }

    return null;
  }

  /**
   * Calculate confidence score for intent match
   * @param {string} input - User input
   * @param {RegExp} regex - Pattern that matched
   * @returns {number} Confidence score 0-1
   */
  calculateConfidence(input, regex) {
    // Simple confidence based on match strength
    const match = input.match(regex);
    if (!match) return 0;

    // Full match = higher confidence
    const matchLength = match[0].length;
    const inputLength = input.length;
    const coverage = matchLength / inputLength;

    // Explicit intent words increase confidence
    const hasExplicitIntent = /\b(i want to|i need to|please|help me)\b/i.test(input);

    let confidence = coverage * 0.5;
    if (hasExplicitIntent) confidence += 0.3;

    // Short, direct commands get high confidence
    if (inputLength < 50) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * Get recommended action for detected intent
   * @param {object} detection - Result from detect()
   * @returns {object} Recommended action
   */
  getRecommendation(detection) {
    if (!detection) {
      return {
        action: 'clarify',
        message: 'Could you clarify what you want to do?'
      };
    }

    const { primary, shouldAutoExecute } = detection;

    if (shouldAutoExecute) {
      return {
        action: 'auto-execute',
        workflow: primary.workflow,
        message: `I'll help you ${primary.description}. Starting ${primary.workflow} workflow...`
      };
    } else {
      return {
        action: 'suggest',
        workflow: primary.workflow,
        message: `It looks like you want to ${primary.description}. Should I start the ${primary.workflow} workflow?`
      };
    }
  }

  /**
   * Check if input indicates user wants to stop/wait
   * @param {string} input - User input
   * @returns {boolean}
   */
  shouldStop(input) {
    return /\b(wait|stop|hold on|no|not yet|cancel|abort)\b/i.test(input);
  }
}

// CLI Interface for testing
if (require.main === module) {
  const detector = new IntentDetector();
  const input = process.argv.slice(2).join(' ');

  if (!input) {
    console.log('Usage: intent-detector "your message here"');
    process.exit(1);
  }

  const detection = detector.detect(input);

  if (detection) {
    console.log('\n🎯 Intent Detected:');
    console.log('  Primary:', detection.primary.intent);
    console.log('  Workflow:', detection.primary.workflow);
    console.log('  Confidence:', (detection.primary.confidence * 100).toFixed(0) + '%');
    console.log('  Auto-execute?:', detection.shouldAutoExecute ? 'Yes' : 'No');

    const recommendation = detector.getRecommendation(detection);
    console.log('\n📋 Recommendation:');
    console.log('  Action:', recommendation.action);
    console.log('  Message:', recommendation.message);

    if (detection.alternatives.length > 0) {
      console.log('\n🔄 Alternative intents:');
      detection.alternatives.forEach(alt => {
        console.log(`  - ${alt.intent} (${(alt.confidence * 100).toFixed(0)}%)`);
      });
    }
  } else {
    console.log('\n❓ No clear intent detected');
    console.log('  The message doesn\'t match any workflow patterns');
  }
}

module.exports = IntentDetector;