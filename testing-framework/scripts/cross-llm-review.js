#!/usr/bin/env node

/**
 * Cross-LLM Review CLI
 * Standalone script for invoking cross-LLM review (Codex + Gemini)
 * Can be called by testing-coordinator agent via Bash
 *
 * Usage:
 *   node cross-llm-review.js --type=code --files="file1.ts,file2.ts" --title="Feature 009"
 *   node cross-llm-review.js --type=spec --spec-path="specs/009.md" --title="Feature 009"
 */

const path = require('path');
const fs = require('fs');

// Import the spec reviewer
const SpecReviewer = require('../spec-reviewer');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      parsed[key] = value;
    }
  }

  return parsed;
}

// Build code review prompt
function buildCodeReviewPrompt(files, title) {
  let prompt = `You are reviewing code for: ${title}\n\n`;
  prompt += `Please review the following files for:\n\n`;
  prompt += `1. **Engineering Balance** (CRITICAL FOCUS)\n`;
  prompt += `   - Is this OVER-ENGINEERED? (too complex for the problem)\n`;
  prompt += `   - Is this UNDER-ENGINEERED? (too simplistic, missing edge cases)\n`;
  prompt += `   - Are abstractions appropriate? (not too many, not too few)\n`;
  prompt += `   - Is the solution proportional to the problem?\n`;
  prompt += `   - Could this be simpler without losing functionality?\n`;
  prompt += `   - Are we solving problems we don't have yet?\n\n`;
  prompt += `2. **Code Cleanliness**\n`;
  prompt += `   - Clear, self-documenting variable/function names\n`;
  prompt += `   - Consistent formatting and style\n`;
  prompt += `   - Appropriate comments (not too many, not too few)\n`;
  prompt += `   - DRY principle without over-abstraction\n`;
  prompt += `   - SOLID principles where appropriate\n`;
  prompt += `   - Readable control flow\n\n`;
  prompt += `3. **Security Vulnerabilities**\n`;
  prompt += `   - SQL injection risks\n`;
  prompt += `   - Authentication/authorization issues\n`;
  prompt += `   - Data exposure or leakage\n`;
  prompt += `   - XSS/CSRF vulnerabilities\n`;
  prompt += `   - Input validation and sanitization\n\n`;
  prompt += `4. **Performance & Scalability**\n`;
  prompt += `   - N+1 query problems\n`;
  prompt += `   - Inefficient algorithms\n`;
  prompt += `   - Memory leaks or excessive usage\n`;
  prompt += `   - Missing database indexes\n`;
  prompt += `   - Premature optimization (over-engineering)\n\n`;
  prompt += `5. **Maintainability**\n`;
  prompt += `   - Will this be easy to modify in 6 months?\n`;
  prompt += `   - Are dependencies well-managed?\n`;
  prompt += `   - Is the code testable?\n`;
  prompt += `   - Are there clear separation of concerns?\n`;
  prompt += `   - Is error handling consistent and complete?\n\n`;

  prompt += `Files to review:\n\n`;

  for (const file of files) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      prompt += `--- ${relativePath} ---\n`;
      prompt += content;
      prompt += `\n\n`;
    } else {
      console.error(`Warning: File not found: ${file}`);
    }
  }

  prompt += `\nRespond in this format:\n`;
  prompt += `APPROVED: yes/no\n`;
  prompt += `ENGINEERING_BALANCE: [Is it over-engineered, under-engineered, or well-balanced?]\n`;
  prompt += `CRITICAL_ISSUES: [list issues that MUST be fixed - security, bugs, major problems]\n`;
  prompt += `SUGGESTIONS: [list optional improvements for cleanliness and maintainability]\n`;
  prompt += `MISSING: [list what's missing or under-engineered]\n\n`;
  prompt += `Focus on: 1) Engineering balance (not too complex, not too simple), 2) Code cleanliness, 3) Security.\n`;
  prompt += `Be concise but thorough. Prioritize real problems over nitpicks.`;

  return prompt;
}

// Call Codex for review using proper agent
async function callCodex(prompt) {
  const { CodexReviewer } = require('../agents/codex-reviewer');
  const reviewer = new CodexReviewer({
    timeout: 900000, // 15 minutes - enough for deep analysis
    saveResponses: true,
  });

  const result = await reviewer.review(prompt);

  if (!result.success) {
    throw new Error(`Codex review failed: ${result.error}`);
  }

  return result.response;
}

// Call Gemini for review
async function callGemini(prompt) {
  const scriptPath = path.join(__dirname, '../../scripts/ask-gemini.sh');

  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const child = spawn('bash', [scriptPath], {
      timeout: 1200000, // 20 minutes - Codex is slow but thorough
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

// Parse review output
function parseReview(output, reviewer) {
  const lines = output.split('\n');
  let approved = false;
  let engineeringBalance = 'Not assessed';
  const issues = [];
  const suggestions = [];
  const missing = [];

  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('APPROVED:')) {
      approved = trimmed.toLowerCase().includes('yes');
    } else if (trimmed.startsWith('ENGINEERING_BALANCE:')) {
      engineeringBalance = trimmed.replace('ENGINEERING_BALANCE:', '').trim();
    } else if (trimmed.startsWith('CRITICAL_ISSUES:')) {
      currentSection = 'issues';
      // Handle Codex's bracket format: CRITICAL_ISSUES: [item1, item2]
      const bracketContent = trimmed.match(/CRITICAL_ISSUES:\s*\[(.*)\]$/s);
      if (bracketContent && bracketContent[1] && bracketContent[1].trim() !== '') {
        const content = bracketContent[1].trim();
        if (content && !content.match(/^list /i)) {
          // Codex puts multiple issues in one bracketed string, split by file paths
          const items = content.split(/(?=projects\/[a-z-]+\/)/);
          items.forEach(item => {
            const cleaned = item.trim();
            if (cleaned) {
              issues.push(`[${reviewer}] ${cleaned}`);
            }
          });
        }
      }
    } else if (trimmed.startsWith('SUGGESTIONS:')) {
      currentSection = 'suggestions';
      // Handle bracket format
      const bracketContent = trimmed.match(/SUGGESTIONS:\s*\[(.*)\]$/s);
      if (bracketContent && bracketContent[1] && bracketContent[1].trim() !== '') {
        const content = bracketContent[1].trim();
        if (content && !content.match(/^list /i)) {
          // Split by file paths
          const items = content.split(/(?=projects\/[a-z-]+\/)/);
          items.forEach(item => {
            const cleaned = item.trim();
            if (cleaned) {
              suggestions.push(`[${reviewer}] ${cleaned}`);
            }
          });
        }
      }
    } else if (trimmed.startsWith('MISSING:')) {
      currentSection = 'missing';
      // Handle bracket format
      const bracketContent = trimmed.match(/MISSING:\s*\[(.*)\]$/s);
      if (bracketContent && bracketContent[1] && bracketContent[1].trim() !== '') {
        const content = bracketContent[1].trim();
        if (content && !content.match(/^list /i)) {
          // Split by file paths
          const items = content.split(/(?=projects\/[a-z-]+\/)/);
          items.forEach(item => {
            const cleaned = item.trim();
            if (cleaned) {
              missing.push(`[${reviewer}] ${cleaned}`);
            }
          });
        }
      }
    } else if (trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
      // Handle list format (Gemini style)
      const content = trimmed.replace(/^[-\d.]+\s*/, '');
      if (content) {
        if (currentSection === 'issues') issues.push(`[${reviewer}] ${content}`);
        if (currentSection === 'suggestions') suggestions.push(`[${reviewer}] ${content}`);
        if (currentSection === 'missing') missing.push(`[${reviewer}] ${content}`);
      }
    }
  }

  return {
    reviewer,
    approved,
    engineeringBalance,
    issues,
    suggestions,
    missing,
  };
}

// Main execution
async function main() {
  const args = parseArgs();

  if (!args.type || !args.title) {
    console.error('Usage: node cross-llm-review.js --type=code|spec --title="Feature Name" [--files="file1,file2"] [--spec-path="path"]');
    process.exit(1);
  }

  console.log(`\n🔍 Cross-LLM Review: ${args.title}`);
  console.log(`   Type: ${args.type}`);
  console.log('');

  let prompt;

  if (args.type === 'code') {
    if (!args.files) {
      console.error('Error: --files required for code review');
      process.exit(1);
    }

    const files = args.files.split(',').map(f => f.trim());
    console.log(`   Files: ${files.length} files`);
    prompt = buildCodeReviewPrompt(files, args.title);
  } else if (args.type === 'spec') {
    if (!args['spec-path']) {
      console.error('Error: --spec-path required for spec review');
      process.exit(1);
    }

    const specPath = args['spec-path'];
    if (!fs.existsSync(specPath)) {
      console.error(`Error: Spec file not found: ${specPath}`);
      process.exit(1);
    }

    const specContent = fs.readFileSync(specPath, 'utf8');
    const reviewer = new SpecReviewer();
    const result = await reviewer.reviewSpec({
      content: specContent,
      filepath: specPath,
      title: args.title,
    });

    // Print results
    console.log('\n📋 Cross-LLM Review Results:\n');
    console.log(`Status: ${result.success ? '✅ APPROVED' : '⚠️  NEEDS REVISION'}`);
    console.log(`Iterations: ${result.iterations}`);

    if (result.issues.length > 0) {
      console.log(`\n❌ Critical Issues (${result.issues.length}):`);
      result.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (result.reviews && result.reviews.length > 0) {
      console.log(`\n📝 Reviewer Feedback:`);
      result.reviews.forEach(review => {
        console.log(`\n   ${review.reviewer.toUpperCase()}:`);
        console.log(`   Approved: ${review.approved ? '✅' : '❌'}`);
        if (review.issues.length > 0) {
          console.log(`   Issues: ${review.issues.length}`);
        }
        if (review.suggestions.length > 0) {
          console.log(`   Suggestions: ${review.suggestions.length}`);
        }
      });
    }

    console.log(`\n📌 Recommendation: ${result.recommendation.message}\n`);

    process.exit(result.success ? 0 : 1);
  }

  // For code review
  console.log('📤 Sending to Codex...');
  const codexOutput = await callCodex(prompt);
  const codexReview = parseReview(codexOutput, 'Codex');

  console.log('📤 Sending to Gemini...');
  const geminiOutput = await callGemini(prompt);
  const geminiReview = parseReview(geminiOutput, 'Gemini');

  // Aggregate results
  const allIssues = [...codexReview.issues, ...geminiReview.issues];
  const allSuggestions = [...codexReview.suggestions, ...geminiReview.suggestions];
  const allMissing = [...codexReview.missing, ...geminiReview.missing];
  const approved = codexReview.approved && geminiReview.approved;

  // Print results
  console.log('\n📋 Cross-LLM Review Results:\n');
  console.log(`Status: ${approved ? '✅ APPROVED' : '⚠️  NEEDS REVISION'}`);

  // Show engineering balance assessments
  console.log('\n⚖️  Engineering Balance:');
  console.log(`   Codex: ${codexReview.engineeringBalance}`);
  console.log(`   Gemini: ${geminiReview.engineeringBalance}`);

  if (allIssues.length > 0) {
    console.log(`\n❌ Critical Issues (${allIssues.length}):`);
    allIssues.forEach(issue => console.log(`   ${issue}`));
  }

  if (allSuggestions.length > 0) {
    console.log(`\n💡 Suggestions (${allSuggestions.length}):`);
    allSuggestions.forEach(suggestion => console.log(`   ${suggestion}`));
  }

  if (allMissing.length > 0) {
    console.log(`\n📝 Missing (${allMissing.length}):`);
    allMissing.forEach(missing => console.log(`   ${missing}`));
  }

  console.log('');

  process.exit(approved ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
