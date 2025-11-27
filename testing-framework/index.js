/**
 * @fileoverview Dev Framework Testing System - Main Entry Point
 * Complete testing workflow: Complexity Analysis → Test Generation → Cross-LLM Review → Quality Gates
 */

const ComplexityAnalyzer = require('./complexity-analyzer');
const TestGenerator = require('./test-generator');
const TestOrchestrator = require('./test-orchestrator');
const QualityGates = require('./quality-gates');
const PreCommitReviewer = require('./pre-commit-reviewer');
const SpecReviewer = require('./spec-reviewer');

/**
 * Main testing system interface
 */
class DevFrameworkTestingSystem {
  constructor(options = {}) {
    this.orchestrator = new TestOrchestrator(options);
    this.analyzer = new ComplexityAnalyzer();
    this.generator = new TestGenerator();
    this.gates = new QualityGates();
  }

  /**
   * Initialize testing for a feature from brief/blueprint
   * @param {Object} feature - Feature object with title, description, requirements
   * @returns {Object} Initialization result
   */
  async initializeFeature(feature) {
    return await this.orchestrator.initializeFeature(feature);
  }

  /**
   * Analyze complexity only (without generating tests)
   * @param {Object} feature - Feature object
   * @returns {Object} Complexity analysis
   */
  async analyzeComplexity(feature) {
    return await this.analyzer.analyze(feature);
  }

  /**
   * Generate tests for a feature
   * @param {Object} feature - Feature object
   * @returns {Object} Generated tests
   */
  async generateTests(feature) {
    return await this.generator.generateTests(feature);
  }

  /**
   * Run cross-LLM review on implemented files
   * @param {string} featureId - Feature identifier
   * @param {Array<string>} files - Files to review
   * @returns {Object} Review results
   */
  async runCrossLLMReview(featureId, files) {
    return await this.orchestrator.triggerCrossLLMReview(featureId, files);
  }

  /**
   * Run A/B test across multiple LLMs
   * @param {string} prompt - Prompt to test
   * @param {Array<string>} models - Models to test
   * @returns {Object} A/B test results
   */
  async runABTest(prompt, models) {
    return await this.orchestrator.runABTest(prompt, models);
  }

  /**
   * Enforce quality gates
   * @param {string} featureId - Feature identifier
   * @param {string} complexityLevel - Complexity level
   * @returns {Object} Gate results
   */
  async enforceQualityGates(featureId, complexityLevel) {
    return await this.gates.enforce(featureId, complexityLevel);
  }

  /**
   * Finalize feature (run all checks)
   * @param {string} featureId - Feature identifier
   * @returns {Object} Finalization results
   */
  async finalizeFeature(featureId) {
    return await this.orchestrator.finalizeFeature(featureId);
  }

  /**
   * Review code draft before writing to disk
   * @param {Object} draft - Code draft with code, filepath, purpose
   * @param {Object} context - Additional context (requirements, constraints)
   * @returns {Object} Review result with refined code
   */
  async reviewDraftBeforeCommit(draft, context = {}) {
    return await this.orchestrator.reviewDraftBeforeCommit(draft, context);
  }

  /**
   * Review spec before test generation (NEW)
   * @param {Object} specDraft - Spec draft with content, filepath, title
   * @param {Object} context - Additional context (brief, constraints)
   * @returns {Object} Review result with refined spec
   */
  async reviewSpecBeforeTests(specDraft, context = {}) {
    return await this.orchestrator.reviewSpecBeforeTests(specDraft, context);
  }
}

// Export main system and components
module.exports = {
  DevFrameworkTestingSystem,
  ComplexityAnalyzer,
  TestGenerator,
  TestOrchestrator,
  QualityGates,
  PreCommitReviewer,
  SpecReviewer,
};
