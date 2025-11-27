/**
 * @fileoverview TDD Agent Client
 * Client library for implementation agents to integrate with TDD Orchestration Hub
 * Handles automatic reporting and directive reception
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TDDAgentClient {
  constructor(options = {}) {
    this.options = {
      hubUrl: 'http://localhost:7777',
      agentId: 'agent-' + Date.now(),
      buildId: null,
      feature: null,
      autoReport: true,
      ...options
    };

    this.sessionId = null;
    this.currentPhase = 'initial';
    this.filesWritten = [];
    this.lastDirective = null;
  }

  /**
   * Start a new build session
   */
  async startBuild(buildId, feature) {
    this.options.buildId = buildId;
    this.options.feature = feature;

    try {
      const response = await axios.post(`${this.options.hubUrl}/session/start`, {
        buildId,
        feature,
        agent: this.options.agentId
      });

      this.sessionId = response.data.sessionId;
      console.log(`✅ TDD Session started: ${this.sessionId}`);
      return this.sessionId;
    } catch (error) {
      console.error('Failed to start TDD session:', error.message);
      throw error;
    }
  }

  /**
   * Report implementation action to hub
   */
  async reportAction(action, details = {}) {
    if (!this.sessionId) {
      console.warn('No active TDD session. Start a build first.');
      return null;
    }

    const report = {
      sessionId: this.sessionId,
      buildId: this.options.buildId,
      agent: this.options.agentId,
      feature: this.options.feature,
      phase: this.currentPhase,
      action,
      timestamp: new Date(),
      ...details
    };

    try {
      const response = await axios.post(`${this.options.hubUrl}/report`, report);
      const directive = response.data;

      this.lastDirective = directive;
      this.handleDirective(directive);

      return directive;
    } catch (error) {
      console.error('Failed to report to TDD hub:', error.message);
      return null;
    }
  }

  /**
   * Report file write
   */
  async reportFileWrite(filePath, content) {
    this.filesWritten.push(filePath);

    const directive = await this.reportAction('implementation', {
      files: [filePath],
      message: `Wrote file: ${path.basename(filePath)}`,
      filesWrittenCount: this.filesWritten.length
    });

    return directive;
  }

  /**
   * Report test run
   */
  async reportTestRun(results) {
    // Parse test results
    const testResults = this.parseTestResults(results);

    // Reset file counter after tests
    this.filesWritten = [];

    const directive = await this.reportAction('test_run', {
      testResults,
      message: `Tests: ${testResults.passing}/${testResults.total} passing (${testResults.passRate}% GREEN)`,
      progress: testResults.passRate
    });

    return directive;
  }

  /**
   * Report phase completion
   */
  async reportPhaseComplete(phase, summary) {
    this.currentPhase = phase;

    const directive = await this.reportAction('phase_complete', {
      message: `Phase ${phase} complete`,
      summary
    });

    return directive;
  }

  /**
   * Report E2E test results
   */
  async reportE2ETests(results) {
    const directive = await this.reportAction('e2e_test_run', {
      testResults: results,
      message: `E2E Tests: ${results.passing}/${results.total} passing`
    });

    return directive;
  }

  /**
   * Request completion approval
   */
  async requestCompletion() {
    const directive = await this.reportAction('requesting_completion', {
      message: 'All tests passing, requesting completion approval',
      phase: 'final'
    });

    return directive;
  }

  /**
   * Complete the build session
   */
  async completeBuild() {
    if (!this.sessionId) {
      return null;
    }

    try {
      const response = await axios.post(`${this.options.hubUrl}/session/complete`, {
        sessionId: this.sessionId
      });

      console.log('✅ Build session complete:', response.data);
      this.sessionId = null;
      return response.data;
    } catch (error) {
      console.error('Failed to complete session:', error.message);
      return null;
    }
  }

  /**
   * Handle directive from hub
   */
  handleDirective(directive) {
    if (!directive) return;

    console.log('\n' + '='.repeat(60));
    console.log('📋 TDD DIRECTIVE RECEIVED');
    console.log('='.repeat(60));
    console.log(`Status: ${directive.status}`);
    console.log(`Message:\n${directive.message}`);

    if (directive.status === 'BLOCKED') {
      console.log('\n🛑 BLOCKED - Must address violations:');
      directive.actions?.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action}`);
      });
      console.log('='.repeat(60) + '\n');

      // Could throw error to stop execution
      if (this.options.strictMode) {
        throw new Error('TDD VIOLATION - Execution blocked');
      }
    } else {
      console.log('\n✅ APPROVED - Next actions:');
      directive.actions?.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action}`);
      });
      console.log(`Next Phase: ${directive.nextPhase}`);
      console.log('='.repeat(60) + '\n');
    }

    if (directive.warnings?.length > 0) {
      console.log('⚠️ Warnings:');
      directive.warnings.forEach(w => console.log(`  - ${w}`));
    }
  }

  /**
   * Parse test results from various formats
   */
  parseTestResults(results) {
    // Handle string output (npm test)
    if (typeof results === 'string') {
      // Try to parse Jest/Mocha/Playwright output
      const patterns = [
        /(\d+) passing/i,
        /(\d+) failed/i,
        /(\d+) skipped/i,
        /(\d+) tests?, (\d+) passed/i,
        /Tests:\s+(\d+) passed, (\d+) total/i
      ];

      let passing = 0;
      let failing = 0;
      let total = 0;

      // Extract numbers from test output
      const passingMatch = results.match(/(\d+) pass/i);
      const failingMatch = results.match(/(\d+) fail/i);
      const totalMatch = results.match(/(\d+) total/i);

      if (passingMatch) passing = parseInt(passingMatch[1]);
      if (failingMatch) failing = parseInt(failingMatch[1]);
      if (totalMatch) {
        total = parseInt(totalMatch[1]);
      } else {
        total = passing + failing;
      }

      return {
        passing,
        failing,
        total: total || passing + failing,
        skipped: 0,
        passRate: total > 0 ? ((passing / total) * 100).toFixed(1) : '0'
      };
    }

    // Handle object format
    if (typeof results === 'object') {
      const total = results.total || (results.passing + results.failing) || 0;
      const passing = results.passing || results.passed || 0;

      return {
        passing,
        failing: results.failing || results.failed || 0,
        total,
        skipped: results.skipped || 0,
        passRate: total > 0 ? ((passing / total) * 100).toFixed(1) : '0'
      };
    }

    return {
      passing: 0,
      failing: 0,
      total: 0,
      skipped: 0,
      passRate: '0'
    };
  }

  /**
   * Check current directive without reporting
   */
  async checkDirective() {
    if (!this.sessionId) return null;

    try {
      const response = await axios.get(`${this.options.hubUrl}/directive/${this.sessionId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get hub status
   */
  async getHubStatus() {
    try {
      const response = await axios.get(`${this.options.hubUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('Hub not responding:', error.message);
      return null;
    }
  }
}

module.exports = TDDAgentClient;