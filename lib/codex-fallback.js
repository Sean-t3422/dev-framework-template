#!/usr/bin/env node
/**
 * @fileoverview Codex Fallback - Quality checks when Codex CLI is unavailable
 *
 * Problem: The codex-reviewer.js silently approves everything when Codex CLI isn't installed.
 * Solution: Provide meaningful static analysis as fallback.
 *
 * This is NOT as good as actual Codex review, but it's better than nothing.
 */

const fs = require('fs');
const path = require('path');

class CodexFallback {
  constructor() {
    // Security patterns to check
    this.securityPatterns = [
      { pattern: /eval\s*\(/g, severity: 'critical', message: 'eval() usage detected - XSS risk' },
      { pattern: /innerHTML\s*=/g, severity: 'high', message: 'innerHTML assignment - XSS risk' },
      { pattern: /dangerouslySetInnerHTML/g, severity: 'high', message: 'dangerouslySetInnerHTML - ensure content is sanitized' },
      { pattern: /SELECT\s+\*\s+FROM/gi, severity: 'medium', message: 'SELECT * - consider selecting specific columns' },
      { pattern: /\.query\s*\(\s*['"`][^'"`]*\$\{/g, severity: 'critical', message: 'Potential SQL injection - use parameterized queries' },
      { pattern: /password.*=.*['"][^'"]+['"]/gi, severity: 'critical', message: 'Hardcoded password detected' },
      { pattern: /api[_-]?key.*=.*['"][^'"]+['"]/gi, severity: 'critical', message: 'Hardcoded API key detected' },
      { pattern: /console\.(log|error|warn)\(/g, severity: 'low', message: 'Console statement - remove for production' },
      { pattern: /TODO|FIXME|HACK/g, severity: 'low', message: 'TODO/FIXME comment found' },
      { pattern: /\.env\.local/g, severity: 'info', message: 'Environment file reference - ensure not committed' },
    ];

    // Performance patterns
    this.performancePatterns = [
      { pattern: /for\s*\([^)]+\)\s*\{[^}]*await\s+/g, severity: 'high', message: 'Await inside loop - potential N+1 pattern' },
      { pattern: /\.forEach\s*\(\s*async/g, severity: 'high', message: 'Async forEach - use for...of or Promise.all' },
      { pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)/g, severity: 'medium', message: 'useEffect without dependency array' },
      { pattern: /useState\s*\([^)]*\)\s*;[^;]*useState/g, severity: 'low', message: 'Multiple useState - consider useReducer for complex state' },
      { pattern: /\.map\s*\([^)]+\)\s*\.filter/g, severity: 'medium', message: 'map().filter() - consider single reduce()' },
      { pattern: /JSON\.parse\s*\(\s*JSON\.stringify/g, severity: 'medium', message: 'Deep clone via JSON - consider structuredClone()' },
    ];

    // RLS patterns for Supabase
    this.rlsPatterns = [
      { pattern: /CREATE\s+TABLE(?![^;]*ENABLE\s+ROW\s+LEVEL\s+SECURITY)/gi, severity: 'critical', message: 'Table created without RLS - MUST enable RLS' },
      { pattern: /auth\.uid\(\)/g, severity: 'info', message: 'Using auth.uid() - verify RLS policy logic' },
      { pattern: /service_role/g, severity: 'high', message: 'service_role usage - ensure not exposed to client' },
      { pattern: /supabaseAdmin/g, severity: 'high', message: 'Admin client usage - verify server-side only' },
    ];
  }

  /**
   * Run fallback security review
   */
  securityReview(code, context = '') {
    const issues = [];

    // Run security patterns
    for (const { pattern, severity, message } of this.securityPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        issues.push({
          type: 'security',
          severity,
          message,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    }

    // Run RLS patterns
    for (const { pattern, severity, message } of this.rlsPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        issues.push({
          type: 'rls',
          severity,
          message,
          count: matches.length
        });
      }
    }

    return this.formatReview('Security', issues, code);
  }

  /**
   * Run fallback performance review
   */
  performanceReview(code, context = '') {
    const issues = [];

    // Run performance patterns
    for (const { pattern, severity, message } of this.performancePatterns) {
      const matches = code.match(pattern);
      if (matches) {
        issues.push({
          type: 'performance',
          severity,
          message,
          count: matches.length
        });
      }
    }

    // Check for missing indexes (in SQL)
    if (code.includes('CREATE TABLE')) {
      const foreignKeys = code.match(/REFERENCES\s+\w+\s*\(\s*\w+\s*\)/gi) || [];
      const indexes = code.match(/CREATE\s+INDEX/gi) || [];

      if (foreignKeys.length > indexes.length) {
        issues.push({
          type: 'performance',
          severity: 'high',
          message: `${foreignKeys.length} foreign keys but only ${indexes.length} indexes - add indexes for FKs`,
          count: foreignKeys.length - indexes.length
        });
      }
    }

    return this.formatReview('Performance', issues, code);
  }

  /**
   * Combined security and performance review
   */
  securityAndPerformanceReview(code, context = '') {
    const securityResult = this.securityReview(code, context);
    const performanceResult = this.performanceReview(code, context);

    const allIssues = [
      ...securityResult.issues,
      ...performanceResult.issues
    ];

    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const highCount = allIssues.filter(i => i.severity === 'high').length;

    // Determine approval status
    const approved = criticalCount === 0 && highCount <= 2;

    return {
      success: true,
      response: this.formatCombinedReview(allIssues, approved),
      approved,
      issues: allIssues,
      fallbackMode: true,
      warning: 'This is a static analysis fallback. For comprehensive review, install Codex CLI.'
    };
  }

  /**
   * Engineering balance review (simplified fallback)
   */
  engineeringBalanceReview(code, context = '') {
    const issues = [];

    // Check for over-engineering signals
    const abstractionPatterns = code.match(/abstract\s+class|interface\s+\w+\s*\{|Factory|Strategy|Observer/g) || [];
    if (abstractionPatterns.length > 5) {
      issues.push({
        type: 'balance',
        severity: 'medium',
        message: `High abstraction count (${abstractionPatterns.length}) - verify each is necessary`
      });
    }

    // Check for under-engineering signals
    if (code.length > 500 && !code.includes('try') && !code.includes('catch')) {
      issues.push({
        type: 'balance',
        severity: 'high',
        message: 'Large code block without error handling'
      });
    }

    // Check for hardcoded values
    const hardcoded = code.match(/['"]\d{2,}['"]/g) || [];
    if (hardcoded.length > 3) {
      issues.push({
        type: 'balance',
        severity: 'medium',
        message: `${hardcoded.length} hardcoded numeric values - consider constants`
      });
    }

    return this.formatReview('Engineering Balance', issues, code);
  }

  /**
   * Format review output
   */
  formatReview(type, issues, code) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;

    const approved = criticalCount === 0 && highCount === 0;

    let response = `## ${type} Review (Fallback Mode)\n\n`;
    response += `⚠️ **Note:** This is static analysis. For comprehensive review, install Codex CLI.\n\n`;

    if (issues.length === 0) {
      response += `✅ No issues detected by static analysis.\n`;
    } else {
      response += `### Issues Found\n\n`;

      if (criticalCount > 0) {
        response += `🚨 **Critical:** ${criticalCount}\n`;
      }
      if (highCount > 0) {
        response += `⚠️ **High:** ${highCount}\n`;
      }
      if (mediumCount > 0) {
        response += `📋 **Medium:** ${mediumCount}\n`;
      }

      response += `\n`;

      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '🚨' :
                     issue.severity === 'high' ? '⚠️' :
                     issue.severity === 'medium' ? '📋' : 'ℹ️';
        response += `${icon} **${issue.severity.toUpperCase()}:** ${issue.message}`;
        if (issue.count > 1) {
          response += ` (${issue.count} occurrences)`;
        }
        response += `\n`;
      }
    }

    response += `\n### Recommendation\n\n`;
    if (approved) {
      response += `✅ Code can proceed - no critical or high severity issues found.\n`;
    } else {
      response += `❌ Code needs improvement - address critical/high severity issues before proceeding.\n`;
    }

    return {
      success: true,
      response,
      approved,
      issues,
      fallbackMode: true
    };
  }

  /**
   * Format combined review
   */
  formatCombinedReview(issues, approved) {
    let response = `## Comprehensive Review (Fallback Mode)\n\n`;
    response += `⚠️ **Note:** This is static analysis. For full Codex review, install Codex CLI.\n\n`;

    const securityIssues = issues.filter(i => i.type === 'security' || i.type === 'rls');
    const performanceIssues = issues.filter(i => i.type === 'performance');

    response += `### 🔒 Security\n`;
    if (securityIssues.length === 0) {
      response += `✅ No security issues detected\n`;
    } else {
      securityIssues.forEach(i => {
        const icon = i.severity === 'critical' ? '🚨' : i.severity === 'high' ? '⚠️' : '📋';
        response += `${icon} ${i.message}\n`;
      });
    }

    response += `\n### ⚡ Performance\n`;
    if (performanceIssues.length === 0) {
      response += `✅ No performance issues detected\n`;
    } else {
      performanceIssues.forEach(i => {
        const icon = i.severity === 'critical' ? '🚨' : i.severity === 'high' ? '⚠️' : '📋';
        response += `${icon} ${i.message}\n`;
      });
    }

    response += `\n### Verdict\n`;
    if (approved) {
      response += `✅ **APPROVED** - Code can proceed. No critical issues found.\n`;
    } else {
      response += `❌ **NEEDS WORK** - Address critical/high issues before proceeding.\n`;
    }

    return response;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const fallback = new CodexFallback();

  if (args[0] === '--file' && args[1]) {
    const code = fs.readFileSync(args[1], 'utf8');
    const reviewType = args[2] || 'security-and-performance';

    let result;
    switch (reviewType) {
      case 'security':
        result = fallback.securityReview(code);
        break;
      case 'performance':
        result = fallback.performanceReview(code);
        break;
      case 'balance':
        result = fallback.engineeringBalanceReview(code);
        break;
      default:
        result = fallback.securityAndPerformanceReview(code);
    }

    console.log(result.response);
    process.exit(result.approved ? 0 : 1);
  } else {
    console.log('Codex Fallback - Static Analysis');
    console.log('');
    console.log('Usage:');
    console.log('  node codex-fallback.js --file path/to/code.ts [security|performance|balance|security-and-performance]');
  }
}

module.exports = { CodexFallback };
