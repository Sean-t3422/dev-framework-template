/**
 * @fileoverview Spec Review System
 * Reviews spec drafts BEFORE test generation using cross-LLM critique
 * Catches architectural issues, missing edge cases, and UX concerns early
 * Part of the Dev Framework Testing System
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');

/**
 * Spec Reviewer - Reviews specs before test generation
 * Implements iterative refinement with cross-LLM feedback
 */
class SpecReviewer {
  constructor(options = {}) {
    this.options = {
      maxIterations: 3, // Maximum refinement iterations
      requireConsensus: false, // Require all reviewers to approve
      reviewers: ['codex', 'gemini'], // Which LLMs to use for review
      autoRefine: true, // Automatically refine based on feedback
      ...options,
    };

    this.reviewHistory = [];
  }

  /**
   * Review spec draft before proceeding to test generation
   * @param {Object} specDraft - Spec draft from spec-writer
   * @param {string} specDraft.content - The spec content (markdown)
   * @param {string} specDraft.filepath - Target spec file path
   * @param {string} specDraft.title - Feature title
   * @param {Object} context - Additional context
   * @returns {Object} Review result with refined spec
   */
  async reviewSpec(specDraft, context = {}) {
    console.log('\n🔍 Spec Review Started');
    console.log(`   Feature: ${specDraft.title}`);
    console.log(`   Spec Path: ${specDraft.filepath}`);
    console.log('');

    let currentVersion = {
      iteration: 0,
      content: specDraft.content,
      author: 'spec-writer',
      issues: [],
      approved: false,
    };

    const iterations = [];

    // Iterative refinement loop
    for (let i = 0; i < this.options.maxIterations; i++) {
      console.log(`📝 Iteration ${i + 1}/${this.options.maxIterations}`);

      // Get reviews from all configured reviewers
      const reviews = await this.getReviews(currentVersion, specDraft.title, context);

      // Aggregate feedback
      const feedback = this.aggregateFeedback(reviews);

      iterations.push({
        iteration: i + 1,
        version: currentVersion,
        reviews,
        feedback,
      });

      // Check if approved
      if (feedback.approved) {
        console.log('   ✅ All reviewers approved spec!');
        currentVersion.approved = true;
        break;
      }

      // If not auto-refining or last iteration, stop
      if (!this.options.autoRefine || i === this.options.maxIterations - 1) {
        console.log('   ⚠️  Not approved, but stopping refinement');
        break;
      }

      // Refine based on feedback
      console.log('   🔄 Refining spec based on feedback...');
      currentVersion = await this.refineSpec(currentVersion, feedback, specDraft.title);
    }

    // Store review history
    this.reviewHistory.push({
      filepath: specDraft.filepath,
      title: specDraft.title,
      iterations,
      finalVersion: currentVersion,
      timestamp: new Date(),
    });

    return {
      success: currentVersion.approved,
      content: currentVersion.content,
      iterations: iterations.length,
      issues: currentVersion.issues,
      reviews: iterations[iterations.length - 1]?.reviews || [],
      recommendation: this.getRecommendation(currentVersion, iterations),
    };
  }

  /**
   * Get reviews from all configured reviewers
   */
  async getReviews(version, title, context) {
    const reviews = [];

    for (const reviewer of this.options.reviewers) {
      console.log(`   Consulting ${reviewer}...`);
      const review = await this.consultReviewer(reviewer, version.content, title, context);
      reviews.push({
        reviewer,
        ...review,
      });
    }

    return reviews;
  }

  /**
   * Consult a specific LLM reviewer for spec review
   */
  async consultReviewer(reviewer, specContent, title, context) {
    const prompt = this.buildSpecReviewPrompt(specContent, title, context);

    try {
      let output;

      switch (reviewer) {
        case 'codex':
          output = await this.callCodex(prompt);
          break;
        case 'gemini':
          output = await this.callGemini(prompt);
          break;
        case 'gpt':
          output = await this.callGPT(prompt);
          break;
        default:
          throw new Error(`Unknown reviewer: ${reviewer}`);
      }

      // Parse review output
      return this.parseReview(output);
    } catch (error) {
      console.error(`   ❌ Error consulting ${reviewer}:`, error.message);
      return {
        approved: false,
        issues: [`Failed to consult ${reviewer}: ${error.message}`],
        suggestions: [],
        missing: [],
      };
    }
  }

  /**
   * Build spec review prompt
   */
  buildSpecReviewPrompt(specContent, title, context) {
    return `You are reviewing a technical specification for: ${title}

${context.brief ? `Original Brief:\n${JSON.stringify(context.brief, null, 2)}\n\n` : ''}

Specification to Review:
${specContent}

Please review this specification for:

1. **Technical Feasibility**
   - Are the proposed solutions technically sound?
   - Are there performance concerns?
   - Are dependencies realistic?
   - Is the architecture scalable?

2. **Edge Cases and Error Handling**
   - What edge cases are missing?
   - Is error handling comprehensive?
   - Are failure modes considered?
   - What about race conditions?

3. **Security Considerations**
   - Are there security risks?
   - Is authentication/authorization addressed?
   - Are inputs validated?
   - Is data protection considered?

4. **UX and User Flows**
   - Are user flows clear and logical?
   - Are error messages helpful?
   - Is the interface intuitive?
   - Are accessibility concerns addressed?

5. **Completeness**
   - Are acceptance criteria clear?
   - Are success metrics defined?
   - Is testing strategy outlined?
   - Are dependencies documented?

6. **Implementation Clarity**
   - Can developers implement from this spec?
   - Are technical decisions explained?
   - Are unknowns identified?
   - Is the scope well-defined?

Respond in this format:
APPROVED: yes/no
CRITICAL_ISSUES: [list issues that MUST be fixed]
SUGGESTIONS: [list optional improvements]
MISSING: [list what's missing from the spec]

Be concise but thorough. Focus on catching problems BEFORE implementation begins.`;
  }

  /**
   * Parse review output
   */
  parseReview(output) {
    const lines = output.split('\n');
    let approved = false;
    const issues = [];
    const suggestions = [];
    const missing = [];

    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('APPROVED:')) {
        approved = trimmed.toLowerCase().includes('yes');
      } else if (trimmed.startsWith('CRITICAL_ISSUES:')) {
        currentSection = 'issues';
      } else if (trimmed.startsWith('SUGGESTIONS:')) {
        currentSection = 'suggestions';
      } else if (trimmed.startsWith('MISSING:')) {
        currentSection = 'missing';
      } else if (trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
        const content = trimmed.replace(/^[-\d.]+\s*/, '');
        if (content) {
          if (currentSection === 'issues') issues.push(content);
          if (currentSection === 'suggestions') suggestions.push(content);
          if (currentSection === 'missing') missing.push(content);
        }
      }
    }

    return {
      approved,
      issues,
      suggestions,
      missing,
    };
  }

  /**
   * Aggregate feedback from multiple reviewers
   */
  aggregateFeedback(reviews) {
    const allIssues = [];
    const allSuggestions = [];
    const allMissing = [];
    let approvalCount = 0;

    for (const review of reviews) {
      if (review.approved) approvalCount++;

      allIssues.push(
        ...review.issues.map(issue => `[${review.reviewer}] ${issue}`)
      );
      allSuggestions.push(
        ...review.suggestions.map(s => `[${review.reviewer}] ${s}`)
      );
      allMissing.push(
        ...review.missing.map(m => `[${review.reviewer}] ${m}`)
      );
    }

    // Determine if approved
    const approved = this.options.requireConsensus
      ? approvalCount === reviews.length
      : approvalCount >= Math.ceil(reviews.length / 2);

    return {
      approved,
      approvalCount,
      totalReviewers: reviews.length,
      issues: allIssues,
      suggestions: allSuggestions,
      missing: allMissing,
    };
  }

  /**
   * Refine spec based on aggregated feedback
   * In real implementation, this would call back to spec-writer agent
   * For now, we'll just flag issues for manual refinement
   */
  async refineSpec(currentVersion, feedback, title) {
    console.log('   Issues to address:');
    feedback.issues.forEach(issue => console.log(`   - ${issue}`));

    // In a full implementation, we'd invoke the spec-writer agent here
    // to automatically refine the spec based on feedback
    // For now, we return the current version with issues flagged
    return {
      ...currentVersion,
      iteration: currentVersion.iteration + 1,
      issues: feedback.issues,
      needsManualReview: true,
    };
  }

  /**
   * Get recommendation based on review results
   */
  getRecommendation(version, iterations) {
    if (version.approved) {
      return {
        action: 'proceed',
        message: 'Spec approved by reviewers. Proceed to test generation.',
      };
    }

    const lastIteration = iterations[iterations.length - 1];
    const criticalIssuesCount = lastIteration?.feedback.issues.length || 0;

    if (criticalIssuesCount > 5) {
      return {
        action: 'major-revision',
        message: `${criticalIssuesCount} critical issues found. Recommend major spec revision before proceeding.`,
      };
    }

    if (criticalIssuesCount > 0) {
      return {
        action: 'minor-revision',
        message: `${criticalIssuesCount} issues found. Address these before test generation.`,
      };
    }

    return {
      action: 'proceed-with-caution',
      message: 'No critical issues, but reviewers suggest improvements.',
    };
  }

  /**
   * Call Codex for review using proper agent
   */
  async callCodex(prompt) {
    const { CodexReviewer } = require('./agents/codex-reviewer');
    const reviewer = new CodexReviewer({
      timeout: 180000,
      saveResponses: true,
    });

    const result = await reviewer.review(prompt);

    if (!result.success) {
      throw new Error(`Codex review failed: ${result.error}`);
    }

    return result.response;
  }

  /**
   * Call Gemini for review
   */
  async callGemini(prompt) {
    const scriptPath = path.join(__dirname, '../scripts/ask-gemini.sh');

    // Use stdin to avoid shell escaping issues
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = spawn('bash', [scriptPath], {
        timeout: 180000,
        maxBuffer: 10 * 1024 * 1024,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn Gemini: ${error.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Gemini exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      // Write prompt to stdin
      child.stdin.write(prompt);
      child.stdin.end();
    });
  }

  /**
   * Call GPT for review
   */
  async callGPT(prompt) {
    const scriptPath = path.join(__dirname, '../scripts/ask-gpt.sh');

    // Use stdin to avoid shell escaping issues
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = spawn('bash', [scriptPath], {
        timeout: 180000,
        maxBuffer: 10 * 1024 * 1024,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn GPT: ${error.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`GPT exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      // Write prompt to stdin
      child.stdin.write(prompt);
      child.stdin.end();
    });
  }

  /**
   * Get review history
   */
  getHistory() {
    return this.reviewHistory;
  }

  /**
   * Clear review history
   */
  clearHistory() {
    this.reviewHistory = [];
  }
}

module.exports = SpecReviewer;
