#!/usr/bin/env node
/**
 * @fileoverview Code Reviewer - Unified review with Codex + Fallback
 *
 * This is the NEW recommended entry point for code reviews.
 * It tries Codex CLI first, falls back to static analysis if unavailable.
 *
 * Key improvements over testing-framework/agents/codex-reviewer.js:
 * 1. Proper fallback that actually reviews code (not silent approval)
 * 2. Clear indication when fallback is being used
 * 3. Structured output for easy parsing
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { CodexFallback } = require('./codex-fallback');

class CodeReviewer {
  constructor(options = {}) {
    this.options = {
      timeout: 180000,
      model: 'gpt-5-codex',
      useFallback: true,
      saveResponses: true,
      outputDir: path.join(process.env.HOME || '/tmp', '.llm-responses'),
      ...options,
    };

    this.fallbackReviewer = new CodexFallback();
    this.codexAvailable = null;

    if (this.options.saveResponses) {
      this.ensureOutputDir();
    }
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Check if Codex CLI is available
   */
  async checkCodexAvailable() {
    if (this.codexAvailable !== null) {
      return this.codexAvailable;
    }

    return new Promise((resolve) => {
      const check = spawn('which', ['codex']);
      check.on('exit', (code) => {
        this.codexAvailable = code === 0;
        resolve(this.codexAvailable);
      });
      check.on('error', () => {
        this.codexAvailable = false;
        resolve(false);
      });
    });
  }

  /**
   * Main review method - tries Codex, falls back to static analysis
   */
  async review(code, options = {}) {
    const startTime = Date.now();
    const reviewType = options.type || 'security-and-performance';
    const context = options.context || '';

    // Check if Codex is available
    const hasCodex = await this.checkCodexAvailable();

    if (hasCodex) {
      console.log('🔍 [Code Reviewer] Using Codex CLI...');
      try {
        const result = await this.callCodex(code, reviewType, context);
        result.mode = 'codex';
        result.duration = Date.now() - startTime;

        if (this.options.saveResponses) {
          this.saveResponse(code, result, reviewType);
        }

        return result;
      } catch (error) {
        console.warn(`⚠️  Codex failed: ${error.message}. Falling back to static analysis.`);
        // Fall through to fallback
      }
    } else {
      console.log('🔍 [Code Reviewer] Using static analysis fallback...');
    }

    // Use fallback
    const result = this.runFallback(code, reviewType, context);
    result.duration = Date.now() - startTime;

    if (this.options.saveResponses) {
      this.saveResponse(code, result, reviewType);
    }

    return result;
  }

  /**
   * Call Codex CLI
   */
  async callCodex(code, reviewType, context) {
    const prompt = this.buildPrompt(code, reviewType, context);

    return new Promise((resolve, reject) => {
      const codex = spawn('timeout', [
        Math.floor(this.options.timeout / 1000).toString(),
        'codex', 'exec', '-m', this.options.model
      ], { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      codex.stdout.on('data', (data) => stdout += data.toString());
      codex.stderr.on('data', (data) => stderr += data.toString());

      codex.stdin.write(prompt);
      codex.stdin.end();

      codex.on('exit', (code) => {
        if (code === 124) {
          reject(new Error('Codex timeout'));
        } else if (code !== 0) {
          reject(new Error(`Codex failed: ${stderr}`));
        } else {
          resolve({
            success: true,
            response: stdout.trim(),
            approved: this.parseApproval(stdout)
          });
        }
      });

      codex.on('error', reject);
    });
  }

  /**
   * Run fallback static analysis
   */
  runFallback(code, reviewType, context) {
    switch (reviewType) {
      case 'security':
        return this.fallbackReviewer.securityReview(code, context);
      case 'performance':
        return this.fallbackReviewer.performanceReview(code, context);
      case 'balance':
      case 'engineering-balance':
        return this.fallbackReviewer.engineeringBalanceReview(code, context);
      case 'security-and-performance':
      default:
        return this.fallbackReviewer.securityAndPerformanceReview(code, context);
    }
  }

  /**
   * Build prompt for Codex
   */
  buildPrompt(code, reviewType, context) {
    const prompts = {
      'security': `Security review - identify vulnerabilities, injection risks, auth issues.
${context ? `Context: ${context}\n` : ''}
Code:
${code}

Focus on: SQL injection, XSS, CSRF, auth flaws, data exposure, rate limiting.`,

      'performance': `Performance review - identify bottlenecks and optimization opportunities.
${context ? `Context: ${context}\n` : ''}
Code:
${code}

Focus on: N+1 queries, missing indexes, React re-renders, bundle size, caching.`,

      'balance': `Engineering balance review - is this appropriately engineered?
${context ? `Context: ${context}\n` : ''}
Code:
${code}

Evaluate: over-engineering, under-engineering, complexity, technical debt.`,

      'security-and-performance': `Comprehensive review - security AND performance are equally critical.
${context ? `Context: ${context}\n` : ''}
Code:
${code}

Check:
🔒 SECURITY: SQL injection, XSS, auth, RLS, rate limiting
⚡ PERFORMANCE: N+1 queries, indexes, caching, re-renders
📊 QUALITY: Error handling, maintainability, testing

For each issue: severity (critical/high/medium/low), location, fix.
End with: APPROVED or NEEDS_WORK.`
    };

    return prompts[reviewType] || prompts['security-and-performance'];
  }

  /**
   * Parse approval from response
   */
  parseApproval(response) {
    const lower = response.toLowerCase();

    // Explicit markers
    if (lower.includes('approved') && !lower.includes('not approved')) return true;
    if (lower.includes('needs_work') || lower.includes('needs work')) return false;

    // Rejection indicators
    const rejections = ['critical', 'security risk', 'vulnerability', 'must fix', 'breaking'];
    for (const r of rejections) {
      if (lower.includes(r)) return false;
    }

    // Default to approved if no issues found
    return !lower.includes('issue') && !lower.includes('problem');
  }

  /**
   * Save response
   */
  saveResponse(code, result, reviewType) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `review_${reviewType}_${timestamp}.json`;
    const filepath = path.join(this.options.outputDir, filename);

    const content = {
      timestamp: new Date().toISOString(),
      reviewType,
      mode: result.mode || 'fallback',
      duration: result.duration,
      approved: result.approved,
      codeLength: code.length,
      response: result.response
    };

    fs.writeFileSync(filepath, JSON.stringify(content, null, 2));
  }

  // Convenience methods
  async securityReview(code, context = '') {
    return this.review(code, { type: 'security', context });
  }

  async performanceReview(code, context = '') {
    return this.review(code, { type: 'performance', context });
  }

  async securityAndPerformanceReview(code, context = '') {
    return this.review(code, { type: 'security-and-performance', context });
  }

  async engineeringBalanceReview(code, context = '') {
    return this.review(code, { type: 'balance', context });
  }

  /**
   * Review a file
   */
  async reviewFile(filepath, options = {}) {
    if (!fs.existsSync(filepath)) {
      return { success: false, error: `File not found: ${filepath}` };
    }

    const code = fs.readFileSync(filepath, 'utf8');
    return this.review(code, { ...options, context: `File: ${filepath}` });
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const reviewer = new CodeReviewer();

  if (args[0] === '--file' && args[1]) {
    const filepath = args[1];
    const type = args[2] || 'security-and-performance';

    reviewer.reviewFile(filepath, { type })
      .then(result => {
        console.log('\n' + result.response);
        console.log(`\n[Mode: ${result.mode || 'fallback'}, Duration: ${result.duration}ms, Approved: ${result.approved}]`);
        process.exit(result.approved ? 0 : 1);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else if (args[0] === '--code') {
    const code = args.slice(1).join(' ');
    reviewer.review(code)
      .then(result => {
        console.log('\n' + result.response);
        process.exit(result.approved ? 0 : 1);
      });
  } else {
    console.log('Code Reviewer - Codex + Static Analysis Fallback');
    console.log('');
    console.log('Usage:');
    console.log('  node code-reviewer.js --file path/to/code.ts [security|performance|balance|security-and-performance]');
    console.log('  node code-reviewer.js --code "const x = eval(input)"');
  }
}

module.exports = { CodeReviewer };
