#!/usr/bin/env node
/**
 * @fileoverview Codex Reviewer Agent
 *
 * A proper agent-based interface for GPT-5 Codex code reviews.
 * Replaces direct bash script calls with a structured agent that can be invoked:
 * 1. From Claude Code via Task tool
 * 2. From testing framework via Node.js
 * 3. From CLI directly
 *
 * Usage:
 *   - From Node: const { reviewCode } = require('./agents/codex-reviewer');
 *   - From CLI: node agents/codex-reviewer.js --prompt "Review this code"
 *   - From Claude Code Task tool: Launch general-purpose agent with codex review task
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodexReviewer {
  constructor(options = {}) {
    this.options = {
      timeout: 180000, // 3 minutes default
      model: 'gpt-5-codex', // Default to code-aware model
      maxBuffer: 10 * 1024 * 1024, // 10MB
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

  /**
   * Review code using GPT-5 Codex
   * @param {string} prompt - The review prompt/question
   * @param {Object} options - Additional options
   * @returns {Promise<{success: boolean, response: string, error?: string}>}
   */
  async review(prompt, options = {}) {
    const startTime = Date.now();
    const reviewOptions = { ...this.options, ...options };

    console.log('\n🔍 [Codex Reviewer] Starting code review...');
    console.log(`   Model: ${reviewOptions.model}`);
    console.log(`   Timeout: ${reviewOptions.timeout}ms`);

    try {
      const response = await this.callCodexCLI(prompt, reviewOptions);
      const duration = Date.now() - startTime;

      if (reviewOptions.saveResponses) {
        this.saveResponse(prompt, response, duration);
      }

      console.log(`✅ [Codex Reviewer] Review completed in ${duration}ms`);

      return {
        success: true,
        response: response,
        duration: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [Codex Reviewer] Review failed after ${duration}ms:`, error.message);

      return {
        success: false,
        response: '',
        error: error.message,
        duration: duration,
      };
    }
  }

  /**
   * Call Codex CLI via spawn (better than bash script)
   */
  async callCodexCLI(prompt, options) {
    return new Promise((resolve, reject) => {
      // Check if codex CLI exists
      const checkCodex = spawn('which', ['codex']);

      checkCodex.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error('Codex CLI not found. Install from: https://codex.mentat.ai'));
          return;
        }

        // Call codex exec with proper stdin handling
        const codex = spawn('timeout', [
          Math.floor(options.timeout / 1000).toString(), // Convert to seconds
          'codex',
          'exec',
          '-m',
          options.model,
        ], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        codex.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        codex.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        codex.stdin.write(prompt);
        codex.stdin.end();

        codex.on('exit', (code) => {
          if (code === 124) {
            reject(new Error(`Timeout after ${options.timeout}ms - Codex stuck in thinking mode. Try: 1) Smaller code chunks, 2) More specific questions`));
          } else if (code !== 0) {
            reject(new Error(`Codex CLI failed (exit ${code}): ${stderr}`));
          } else {
            resolve(stdout.trim());
          }
        });

        codex.on('error', (error) => {
          reject(new Error(`Failed to spawn codex: ${error.message}`));
        });
      });
    });
  }

  /**
   * Save response for audit trail
   */
  saveResponse(prompt, response, duration) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `codex_${timestamp}.txt`;
    const filepath = path.join(this.options.outputDir, filename);

    const content = [
      '=== Codex Review ===',
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

  /**
   * Review a file
   */
  async reviewFile(filepath, question = 'Review this code for potential issues, bugs, and improvements') {
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

  /**
   * Review for security issues
   */
  async securityReview(code, context = '') {
    const prompt = `Security review - identify vulnerabilities, injection risks, authentication issues, and data exposure risks.

${context ? `Context: ${context}\n\n` : ''}Code to review:

${code}

Focus on:
1. SQL injection, XSS, CSRF vulnerabilities
2. Authentication/authorization flaws
3. Data validation issues
4. Sensitive data exposure
5. Rate limiting and DoS vectors`;

    return this.review(prompt);
  }

  /**
   * Review for engineering balance (not over-engineered, not under-engineered)
   */
  async engineeringBalanceReview(code, context = '') {
    const prompt = `Engineering balance review - assess if this code is appropriately engineered for its purpose.

${context ? `Context: ${context}\n\n` : ''}Code to review:

${code}

Evaluate:
1. Is this over-engineered? (unnecessary abstractions, premature optimization)
2. Is this under-engineered? (missing error handling, maintainability issues)
3. Appropriate complexity for the problem being solved
4. Balance of flexibility vs simplicity
5. Technical debt implications`;

    return this.review(prompt);
  }

  /**
   * Review for regression risks
   */
  async regressionReview(changes, context = '') {
    const prompt = `Regression risk review - identify potential breaking changes and side effects.

${context ? `Context: ${context}\n\n` : ''}Changes to review:

${changes}

Analyze:
1. Breaking changes to public APIs
2. Side effects on existing functionality
3. Database schema changes that need migration
4. Dependencies on deprecated features
5. Impact on existing tests`;

    return this.review(prompt);
  }

  /**
   * Review for performance issues
   */
  async performanceReview(code, context = '') {
    const prompt = `Performance review - identify bottlenecks, inefficiencies, and optimization opportunities.

${context ? `Context: ${context}\n\n` : ''}Code to review:

${code}

Focus on:
1. **Database Performance:**
   - N+1 query patterns (loops with queries inside)
   - Missing indexes on frequently queried columns (WHERE, JOIN, ORDER BY)
   - Sequential scans that should use indexes
   - Inefficient JOIN strategies
   - Missing composite indexes for multi-column queries

2. **API Performance:**
   - Response time monitoring (should track with performance.now())
   - Proper caching headers (Cache-Control, ETag)
   - Unnecessary data fetching (select only needed columns)
   - Connection pooling configuration
   - Batch operations instead of multiple round trips

3. **React Performance:**
   - Missing React.memo on expensive components
   - Missing useMemo/useCallback for expensive calculations
   - Unnecessary re-renders
   - List virtualization for long lists (>100 items)
   - Code splitting and lazy loading
   - Image optimization

4. **General Performance:**
   - Bundle size optimization
   - Memory leaks (missing cleanup in useEffect)
   - Synchronous operations that should be async
   - Inefficient algorithms (O(n²) that could be O(n))

Provide specific recommendations with performance targets (e.g., <200ms P95 for API, <100ms for DB queries).`;

    return this.review(prompt);
  }

  /**
   * Review for BOTH security AND performance (equally important)
   */
  async securityAndPerformanceReview(code, context = '') {
    const prompt = `Comprehensive security AND performance review - both are EQUALLY critical.

${context ? `Context: ${context}\n\n` : ''}Code to review:

${code}

🔒 **SECURITY** (Critical Priority):
1. SQL injection, XSS, CSRF vulnerabilities
2. Authentication/authorization flaws
3. Input validation and sanitization
4. Sensitive data exposure in errors/logs
5. RLS policies and access controls
6. Rate limiting and DoS protection

⚡ **PERFORMANCE** (Critical Priority):
1. N+1 queries and missing database indexes
2. API response times (target: <200ms P95)
3. React re-renders and memoization
4. Bundle size and code splitting
5. Caching strategies (React Query, HTTP headers)
6. Connection pooling and resource management

📊 **CODE QUALITY**:
1. Maintainability and structure
2. Engineering balance (not over/under-engineered)
3. Error handling and logging
4. Testing coverage

**Response Format:**
For each issue found, specify:
- ✅ What's working well
- ⚠️ What needs improvement (with specific line numbers if applicable)
- 🚨 Critical issues (security OR performance) that MUST be fixed

Provide actionable recommendations with measurable targets.`;

    return this.review(prompt);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Codex Reviewer Agent - GPT-5 Codex Code Review');
    console.log('');
    console.log('Usage:');
    console.log('  node codex-reviewer.js --prompt "Your review question"');
    console.log('  node codex-reviewer.js --file path/to/file.js');
    console.log('  node codex-reviewer.js --security --file path/to/file.js');
    console.log('  node codex-reviewer.js --performance --file path/to/file.js');
    console.log('  node codex-reviewer.js --security-and-performance --file path/to/file.js');
    console.log('  node codex-reviewer.js --engineering-balance --prompt "Review this"');
    console.log('  node codex-reviewer.js --regression --prompt "Review these changes"');
    console.log('');
    console.log('Options:');
    console.log('  --prompt TEXT                Review prompt/code');
    console.log('  --file PATH                  Review a file');
    console.log('  --security                   Security-focused review');
    console.log('  --performance                Performance-focused review');
    console.log('  --security-and-performance   Combined security AND performance review (RECOMMENDED)');
    console.log('  --engineering-balance        Engineering balance review');
    console.log('  --regression                 Regression risk review');
    console.log('  --timeout MS                 Timeout in milliseconds (default: 180000)');
    console.log('  --no-save                    Don\'t save response to file');
    return;
  }

  const reviewer = new CodexReviewer();

  // Parse arguments
  let prompt = null;
  let filepath = null;
  let reviewType = 'general';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' && args[i + 1]) {
      prompt = args[i + 1];
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      filepath = args[i + 1];
      i++;
    } else if (args[i] === '--security') {
      reviewType = 'security';
    } else if (args[i] === '--performance') {
      reviewType = 'performance';
    } else if (args[i] === '--security-and-performance') {
      reviewType = 'security-and-performance';
    } else if (args[i] === '--engineering-balance') {
      reviewType = 'engineering-balance';
    } else if (args[i] === '--regression') {
      reviewType = 'regression';
    }
  }

  // Execute review
  let result;

  if (filepath) {
    const code = fs.readFileSync(filepath, 'utf8');
    if (reviewType === 'security') {
      result = await reviewer.securityReview(code, `File: ${filepath}`);
    } else if (reviewType === 'performance') {
      result = await reviewer.performanceReview(code, `File: ${filepath}`);
    } else if (reviewType === 'security-and-performance') {
      result = await reviewer.securityAndPerformanceReview(code, `File: ${filepath}`);
    } else if (reviewType === 'engineering-balance') {
      result = await reviewer.engineeringBalanceReview(code, `File: ${filepath}`);
    } else {
      result = await reviewer.reviewFile(filepath, prompt);
    }
  } else if (prompt) {
    if (reviewType === 'security') {
      result = await reviewer.securityReview(prompt);
    } else if (reviewType === 'performance') {
      result = await reviewer.performanceReview(prompt);
    } else if (reviewType === 'security-and-performance') {
      result = await reviewer.securityAndPerformanceReview(prompt);
    } else if (reviewType === 'engineering-balance') {
      result = await reviewer.engineeringBalanceReview(prompt);
    } else if (reviewType === 'regression') {
      result = await reviewer.regressionReview(prompt);
    } else {
      result = await reviewer.review(prompt);
    }
  } else {
    console.error('Error: Must provide --prompt or --file');
    process.exit(1);
  }

  // Output result
  if (result.success) {
    console.log('\n=== Codex Review ===');
    console.log(result.response);
    console.log('');
    process.exit(0);
  } else {
    console.error('\nReview failed:', result.error);
    process.exit(1);
  }
}

// Export for programmatic use
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
  engineeringBalanceReview: async (code, context, options) => {
    const reviewer = new CodexReviewer(options);
    return reviewer.engineeringBalanceReview(code, context);
  },
  regressionReview: async (changes, context, options) => {
    const reviewer = new CodexReviewer(options);
    return reviewer.regressionReview(changes, context);
  },
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
