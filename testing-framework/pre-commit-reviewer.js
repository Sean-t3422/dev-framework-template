/**
 * @fileoverview Pre-Commit Review System
 * Reviews code drafts BEFORE writing to disk using cross-LLM critique
 * Part of the Dev Framework Testing System
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');

/**
 * Pre-Commit Reviewer - Reviews code before it's written to disk
 * Implements iterative refinement with cross-LLM feedback
 */
class PreCommitReviewer {
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
   * Review code draft before committing to disk
   * @param {Object} draft - Code draft from primary LLM (Claude)
   * @param {string} draft.code - The generated code
   * @param {string} draft.filepath - Target file path
   * @param {string} draft.purpose - What this code is meant to do
   * @param {Object} context - Additional context
   * @returns {Object} Review result with refined code
   */
  async reviewDraft(draft, context = {}) {
    console.log('\n🔍 Pre-Commit Review Started');
    console.log(`   Target: ${draft.filepath}`);
    console.log(`   Purpose: ${draft.purpose}`);
    console.log('');

    let currentVersion = {
      iteration: 0,
      code: draft.code,
      author: 'claude',
      issues: [],
      approved: false,
    };

    const iterations = [];

    // Iterative refinement loop
    for (let i = 0; i < this.options.maxIterations; i++) {
      console.log(`📝 Iteration ${i + 1}/${this.options.maxIterations}`);

      // Get reviews from all configured reviewers
      const reviews = await this.getReviews(currentVersion, draft.purpose, context);

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
        console.log('   ✅ All reviewers approved!');
        currentVersion.approved = true;
        break;
      }

      // If not auto-refining or last iteration, stop
      if (!this.options.autoRefine || i === this.options.maxIterations - 1) {
        console.log('   ⚠️  Not approved, but stopping refinement');
        break;
      }

      // Refine based on feedback
      console.log('   🔄 Refining based on feedback...');
      currentVersion = await this.refineCode(currentVersion, feedback, draft.purpose);
    }

    // Store review history
    this.reviewHistory.push({
      filepath: draft.filepath,
      purpose: draft.purpose,
      iterations,
      finalVersion: currentVersion,
      timestamp: new Date(),
    });

    return {
      success: currentVersion.approved,
      code: currentVersion.code,
      iterations: iterations.length,
      issues: currentVersion.issues,
      reviews: iterations[iterations.length - 1]?.reviews || [],
      recommendation: this.getRecommendation(currentVersion, iterations),
    };
  }

  /**
   * Get reviews from all configured reviewers
   */
  async getReviews(version, purpose, context) {
    const reviews = [];

    for (const reviewer of this.options.reviewers) {
      console.log(`   Consulting ${reviewer}...`);
      const review = await this.consultReviewer(reviewer, version.code, purpose, context);
      reviews.push({
        reviewer,
        ...review,
      });
    }

    return reviews;
  }

  /**
   * Consult a specific LLM reviewer
   */
  async consultReviewer(reviewer, code, purpose, context) {
    const prompt = this.buildReviewPrompt(code, purpose, context);

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
      console.error(`   ❌ ${reviewer} review failed:`, error.message);
      return {
        approved: false,
        issues: [`Review failed: ${error.message}`],
        suggestions: [],
        confidence: 0,
      };
    }
  }

  /**
   * Build review prompt for LLM
   */
  buildReviewPrompt(code, purpose, context) {
    return `You are reviewing code BEFORE it's written to disk. Your job is to catch issues early.

PURPOSE: ${purpose}

CONTEXT:
${context.requirements || 'No additional requirements'}

CODE TO REVIEW:
\`\`\`
${code}
\`\`\`

Please review for:
1. **Bugs & Edge Cases**: Will this break? Missing null checks? Race conditions?
2. **Security**: SQL injection? XSS? Auth bypass? Input validation?
3. **Performance**: N+1 queries? Memory leaks? Inefficient algorithms?
4. **Maintainability**: Clear naming? Proper structure? Will future devs understand this?
5. **Test Coverage**: Does this match the test requirements?

RESPOND IN THIS FORMAT:
APPROVED: [YES/NO]
CONFIDENCE: [0-100]%

ISSUES:
- [List critical issues that MUST be fixed, or "None"]

SUGGESTIONS:
- [List optional improvements, or "None"]

REASONING:
[Explain your decision in 2-3 sentences]`;
  }

  /**
   * Parse review response from LLM
   */
  parseReview(output) {
    const approvedMatch = output.match(/APPROVED:\s*(YES|NO)/i);
    const confidenceMatch = output.match(/CONFIDENCE:\s*(\d+)/);
    const issuesMatch = output.match(/ISSUES:([\s\S]*?)(?=SUGGESTIONS:|$)/);
    const suggestionsMatch = output.match(/SUGGESTIONS:([\s\S]*?)(?=REASONING:|$)/);
    const reasoningMatch = output.match(/REASONING:([\s\S]*?)$/);

    const issues = issuesMatch
      ? issuesMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-') && !line.toLowerCase().includes('none'))
          .map(line => line.substring(1).trim())
      : [];

    const suggestions = suggestionsMatch
      ? suggestionsMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-') && !line.toLowerCase().includes('none'))
          .map(line => line.substring(1).trim())
      : [];

    return {
      approved: approvedMatch ? approvedMatch[1].toUpperCase() === 'YES' : false,
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
      issues,
      suggestions,
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided',
    };
  }

  /**
   * Aggregate feedback from multiple reviewers
   */
  aggregateFeedback(reviews) {
    const allApproved = reviews.every(r => r.approved);
    const consensusApproved = this.options.requireConsensus
      ? allApproved
      : reviews.filter(r => r.approved).length >= Math.ceil(reviews.length / 2);

    const allIssues = reviews.flatMap(r => r.issues);
    const allSuggestions = reviews.flatMap(r => r.suggestions);
    const avgConfidence = reviews.reduce((sum, r) => sum + r.confidence, 0) / reviews.length;

    return {
      approved: consensusApproved,
      totalReviewers: reviews.length,
      approvalCount: reviews.filter(r => r.approved).length,
      criticalIssues: allIssues,
      suggestions: allSuggestions,
      confidence: avgConfidence,
      reviews,
    };
  }

  /**
   * Refine code based on aggregated feedback
   */
  async refineCode(currentVersion, feedback, purpose) {
    const refinementPrompt = `You previously generated this code:

\`\`\`
${currentVersion.code}
\`\`\`

PURPOSE: ${purpose}

REVIEWERS FOUND THESE ISSUES:
${feedback.criticalIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

SUGGESTIONS FOR IMPROVEMENT:
${feedback.suggestions.map((sugg, i) => `${i + 1}. ${sugg}`).join('\n')}

Please refine the code to address these issues. Output ONLY the refined code, no explanations.`;

    try {
      // Use Claude for refinement (primary LLM)
      const refined = await this.callClaude(refinementPrompt);

      return {
        iteration: currentVersion.iteration + 1,
        code: refined,
        author: 'claude',
        issues: feedback.criticalIssues,
        approved: false,
      };
    } catch (error) {
      console.error('   ❌ Refinement failed:', error.message);
      return currentVersion; // Return unchanged if refinement fails
    }
  }

  /**
   * Get recommendation based on review results
   */
  getRecommendation(finalVersion, iterations) {
    if (finalVersion.approved) {
      return {
        action: 'WRITE_TO_DISK',
        message: 'Code approved by reviewers. Safe to write.',
        confidence: 'HIGH',
      };
    }

    if (iterations.length >= this.options.maxIterations) {
      return {
        action: 'MANUAL_REVIEW',
        message: `Max iterations reached. ${finalVersion.issues.length} unresolved issues.`,
        confidence: 'LOW',
        issues: finalVersion.issues,
      };
    }

    return {
      action: 'REFINE_MORE',
      message: 'Code needs refinement before writing.',
      confidence: 'MEDIUM',
      issues: finalVersion.issues,
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
   * Call Claude for refinement
   */
  async callClaude(prompt) {
    // In production: call Claude API or CLI
    // For now, placeholder
    throw new Error('Claude refinement not yet implemented - needs Claude API integration');
  }

  /**
   * Call GPT for review
   */
  async callGPT(prompt) {
    const scriptPath = path.join(__dirname, '../scripts/ask-gpt.sh');
    const { stdout } = await execAsync(`"${scriptPath}" "${prompt.replace(/"/g, '\\"')}"`, {
      timeout: 180000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  }

  /**
   * Get review history for a file
   */
  getHistory(filepath) {
    return this.reviewHistory.filter(h => h.filepath === filepath);
  }

  /**
   * Get statistics across all reviews
   */
  getStats() {
    const total = this.reviewHistory.length;
    const approved = this.reviewHistory.filter(h => h.finalVersion.approved).length;
    const avgIterations =
      this.reviewHistory.reduce((sum, h) => sum + h.iterations.length, 0) / total || 0;

    return {
      totalReviews: total,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      averageIterations: avgIterations.toFixed(2),
      reviewHistory: this.reviewHistory,
    };
  }
}

module.exports = PreCommitReviewer;
