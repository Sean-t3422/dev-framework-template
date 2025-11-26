#!/usr/bin/env node
/**
 * @fileoverview Codex Reviewer Agent
 *
 * A proper agent-based interface for code reviews.
 * Can invoke various LLM providers for cross-LLM review.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodexReviewer {
  constructor(options = {}) {
    this.options = {
      timeout: 180000,
      model: 'codex',
      maxBuffer: 10 * 1024 * 1024,
      saveResponses: true,
      outputDir: process.env.HOME + '/.llm-responses',
      ...options,
    };

    if (this.options.saveResponses) {
      this.ensureOutputDir();
    }
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  async review(prompt, options = {}) {
    const startTime = Date.now();
    const reviewOptions = { ...this.options, ...options };

    console.log('\n\ud83d\udd0d [Codex Reviewer] Starting code review...');
    console.log(`   Model: ${reviewOptions.model}`);
    console.log(`   Timeout: ${reviewOptions.timeout}ms`);

    try {
      const response = await this.callReviewer(prompt, reviewOptions);
      const duration = Date.now() - startTime;

      if (reviewOptions.saveResponses) {
        this.saveResponse(prompt, response, duration);
      }

      console.log(`\u2705 [Codex Reviewer] Review completed in ${duration}ms`);

      return {
        success: true,
        response: response,
        duration: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\u274c [Codex Reviewer] Review failed after ${duration}ms:`, error.message);

      return {
        success: false,
        response: '',
        error: error.message,
        duration: duration,
      };
    }
  }

  async callReviewer(prompt, options) {
    // Placeholder - in real implementation, this would call the LLM API
    return new Promise((resolve, reject) => {
      // For now, return a helpful message about setup
      resolve(`Code review requested. To enable LLM reviews:
1. Set up your preferred LLM provider API key
2. Configure the reviewer in .dev-framework/config.json
3. Re-run the review

Prompt received: ${prompt.substring(0, 200)}...`);
    });
  }

  saveResponse(prompt, response, duration) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `review_${timestamp}.txt`;
    const filepath = path.join(this.options.outputDir, filename);

    const content = [
      '=== Code Review ===',
      `Timestamp: ${new Date().toISOString()}`,
      `Duration: ${duration}ms`,
      `Model: ${this.options.model}`,
      '',
      '=== Prompt ===',
      prompt,
      '',
      '=== Response ===',
      response,
      '',
    ].join('\n');

    fs.writeFileSync(filepath, content, 'utf8');
  }

  async reviewFile(filepath, question = 'Review this code for potential issues') {
    if (!fs.existsSync(filepath)) {
      return {
        success: false,
        error: `File not found: ${filepath}`,
      };
    }

    const code = fs.readFileSync(filepath, 'utf8');
    const prompt = `${question}\n\nFile: ${filepath}\n\n${code}`;

    return this.review(prompt);
  }

  async securityReview(code, context = '') {
    const prompt = `Security review - identify vulnerabilities.\n${context ? `Context: ${context}\n\n` : ''}Code:\n${code}`;
    return this.review(prompt);
  }

  async performanceReview(code, context = '') {
    const prompt = `Performance review - identify bottlenecks.\n${context ? `Context: ${context}\n\n` : ''}Code:\n${code}`;
    return this.review(prompt);
  }

  async securityAndPerformanceReview(code, context = '') {
    const prompt = `Comprehensive security AND performance review.\n${context ? `Context: ${context}\n\n` : ''}Code:\n${code}`;
    return this.review(prompt);
  }

  async engineeringBalanceReview(code, context = '') {
    const prompt = `Engineering balance review - assess over/under-engineering.\n${context ? `Context: ${context}\n\n` : ''}Code:\n${code}`;
    return this.review(prompt);
  }
}

module.exports = {
  CodexReviewer,
  reviewCode: async (prompt, options) => {
    const reviewer = new CodexReviewer(options);
    return reviewer.review(prompt, options);
  },
  reviewFile: async (filepath, question, options) => {
    const reviewer = new CodexReviewer(options);
    return reviewer.reviewFile(filepath, question);
  },
  securityReview: async (code, context, options) => {
    const reviewer = new CodexReviewer(options);
    return reviewer.securityReview(code, context);
  },
  performanceReview: async (code, context, options) => {
    const reviewer = new CodexReviewer(options);
    return reviewer.performanceReview(code, context);
  },
  securityAndPerformanceReview: async (code, context, options) => {
    const reviewer = new CodexReviewer(options);
    return reviewer.securityAndPerformanceReview(code, context);
  },
};

if (require.main === module) {
  const args = process.argv.slice(2);
  console.log('Codex Reviewer Agent');
  console.log('Usage: node codex-reviewer.js --prompt "Your review question"');
  console.log('       node codex-reviewer.js --file path/to/file.js');
  console.log('       node codex-reviewer.js --security --file path/to/file.js');
}
