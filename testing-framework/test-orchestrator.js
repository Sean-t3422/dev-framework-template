/**
 * @fileoverview Test Orchestrator for Dev Framework Testing System
 * Coordinates testing workflow and integrates with cross-LLM review
 * Part of the Dev Framework Testing System
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const ComplexityAnalyzer = require('./complexity-analyzer');
const TestGenerator = require('./test-generator');
const QualityGates = require('./quality-gates');
const PreCommitReviewer = require('./pre-commit-reviewer');
const SpecReviewer = require('./spec-reviewer');
const HookSystem = require('./hook-system');
const ContextManager = require('./context-manager');

/**
 * Main test orchestrator - coordinates the complete testing workflow
 */
class TestOrchestrator {
  constructor(options = {}) {
    this.analyzer = new ComplexityAnalyzer();
    this.generator = new TestGenerator();
    this.gates = new QualityGates();
    this.preCommitReviewer = new PreCommitReviewer();
    this.specReviewer = new SpecReviewer();
    this.hookSystem = new HookSystem();
    this.contextManager = new ContextManager();

    this.options = {
      autoGenerate: true,
      runTests: true,
      enforceCrossLLMReview: true, // Unique to Dev Framework
      enforceGates: true,
      preCommitReview: true, // Review code before writing to disk
      specReview: true, // NEW: Review specs before test generation
      enableHooks: true, // NEW: Enable hook system for sequential advice gathering
      ...options,
    };

    this.activeFeatures = new Map();
    this.testResults = new Map();
  }

  /**
   * Initialize testing workflow for a new feature
   * @param {Object} feature - Feature from brief/blueprint
   * @returns {Object} Initialization result
   */
  async initializeFeature(feature) {
    console.log(`\n🎯 Initializing Dev Framework Testing for: ${feature.title}`);

    try {
      // Step 0: HOOK - Trigger hook system if enabled
      let hookResult = null;
      if (this.options.enableHooks) {
        console.log('\n🔗 Hook System: Gathering advice from sub-agents...');
        hookResult = await this.triggerHookSequence(feature);

        if (!hookResult.success) {
          console.log('   ⚠️  Hook sequence did not fully complete');
          console.log(`   ${hookResult.validation.summary}`);
        } else {
          console.log('   ✅ All hooks completed successfully');
          console.log(`   ${hookResult.validation.summary}`);
        }
      }

      // Step 1: Analyze complexity
      console.log('\n📊 Analyzing feature complexity...');
      const analysis = await this.analyzer.analyze(feature);
      console.log(`   Complexity Level: ${analysis.level} (${analysis.profile.name})`);
      console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);

      // Step 2: Generate tests if enabled
      let generatedTests = { generatedTests: [] };
      if (this.options.autoGenerate && analysis.level !== 'trivial') {
        console.log('\n📝 Generating test files...');
        generatedTests = await this.generator.generateTests(feature);
        console.log(`   Generated ${generatedTests.generatedTests.length} test files`);

        for (const test of generatedTests.generatedTests) {
          console.log(`   ✓ ${test.type}: ${path.basename(test.path)}`);
        }
      }

      // Step 3: Run initial tests (should fail for TDD)
      let initialResults = null;
      if (this.options.runTests && generatedTests.generatedTests.length > 0) {
        console.log('\n🔴 Running initial tests (expecting failures - this is TDD)...');
        initialResults = await this.runTests(
          feature.id,
          generatedTests.generatedTests
        );
        console.log(`   Failed: ${initialResults.failed} (expected)`);
        console.log(`   Passed: ${initialResults.passed}`);
      }

      // Step 4: Determine if cross-LLM review is required
      const requiresCrossLLMReview = this.requiresCrossLLMReview(analysis.level);
      if (requiresCrossLLMReview) {
        console.log('\n🤖 Cross-LLM review REQUIRED for this complexity level');
      }

      // Step 4.5: Determine if pre-commit review should be enabled
      const preCommitEnabled = this.shouldEnablePreCommitReview(analysis.level);
      if (preCommitEnabled) {
        console.log('\n🔒 Pre-commit review ENABLED');
        console.log('   Code will be reviewed by multiple LLMs BEFORE writing to disk');
        console.log('   Up to 3 refinement iterations for quality');
      }

      // Step 5: Store feature state
      this.activeFeatures.set(feature.id, {
        feature,
        analysis,
        generatedTests: generatedTests.generatedTests,
        testResults: initialResults,
        requiresCrossLLMReview,
        hookResult, // Store hook system results
        status: 'initialized',
        createdAt: new Date(),
      });

      return {
        success: true,
        featureId: feature.id,
        analysis,
        testsGenerated: generatedTests.generatedTests.length,
        testPlan: generatedTests.testPlan,
        instructions: generatedTests.instructions,
        requiresCrossLLMReview,
        hookAdvice: hookResult?.context?.advice || [], // Include advice from hooks
        nextSteps: this.getNextSteps(analysis.level, requiresCrossLLMReview),
      };
    } catch (error) {
      console.error('❌ Error initializing feature:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Run tests for a feature
   */
  async runTests(featureId, testFiles = []) {
    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: null,
      details: [],
    };

    for (const testFile of testFiles) {
      try {
        const testPath = testFile.path || testFile;

        // Determine test runner based on file extension
        const isPlaywright = testPath.includes('.e2e.');
        const command = isPlaywright
          ? `npx playwright test ${testPath} --reporter=json`
          : `npx jest ${testPath} --json --coverage --passWithNoTests`;

        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 120000, // 2 minutes timeout for test execution
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        const testResult = JSON.parse(stdout);
        results.passed += testResult.numPassedTests || 0;
        results.failed += testResult.numFailedTests || 0;
        results.skipped += testResult.numPendingTests || 0;

        results.details.push({
          file: testPath,
          passed: testResult.numPassedTests || 0,
          failed: testResult.numFailedTests || 0,
          skipped: testResult.numPendingTests || 0,
        });
      } catch (error) {
        // Test runners return non-zero exit codes for failing tests
        if (error.stdout) {
          try {
            const testResult = JSON.parse(error.stdout);
            results.failed += testResult.numFailedTests || 0;
            results.passed += testResult.numPassedTests || 0;
          } catch (parseError) {
            results.failed += 1;
          }
        } else {
          results.failed += 1;
        }
      }
    }

    // Store results
    this.testResults.set(featureId, results);

    return results;
  }

  /**
   * Review code draft before writing to disk
   * This happens BEFORE implementation, catching issues early
   * @param {Object} draft - Code draft to review
   * @param {Object} context - Additional context
   * @returns {Object} Review result
   */
  async reviewDraftBeforeCommit(draft, context = {}) {
    if (!this.options.preCommitReview) {
      return {
        success: true,
        skipped: true,
        code: draft.code,
      };
    }

    console.log('\n🔒 Pre-Commit Review (before writing to disk)');

    const result = await this.preCommitReviewer.reviewDraft(draft, context);

    if (!result.success) {
      console.log(`\n⚠️  Code not approved after ${result.iterations} iterations`);
      console.log('   Unresolved issues:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
      console.log(`\n   Recommendation: ${result.recommendation.action}`);
    }

    return result;
  }

  /**
   * Review spec before test generation (NEW)
   * This happens BEFORE tests are generated, catching architectural issues early
   * @param {Object} specDraft - Spec draft to review
   * @param {Object} context - Additional context (brief, etc.)
   * @returns {Object} Review result
   */
  async reviewSpecBeforeTests(specDraft, context = {}) {
    if (!this.options.specReview) {
      return {
        success: true,
        skipped: true,
        content: specDraft.content,
      };
    }

    console.log('\n📋 Spec Review (before test generation)');

    const result = await this.specReviewer.reviewSpec(specDraft, context);

    if (!result.success) {
      console.log(`\n⚠️  Spec not approved after ${result.iterations} iterations`);
      console.log('   Critical issues:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
      console.log(`\n   Recommendation: ${result.recommendation.action}`);
      console.log('   Action: ${result.recommendation.message}');
    } else {
      console.log('   ✅ Spec approved by reviewers');
    }

    return result;
  }

  /**
   * Trigger cross-LLM review (integrates with existing scripts)
   */
  async triggerCrossLLMReview(featureId, implementedFiles) {
    const featureData = this.activeFeatures.get(featureId);
    if (!featureData) {
      throw new Error('Feature not found');
    }

    console.log('\n🤖 Triggering Cross-LLM Review...');

    const reviewResults = [];

    for (const file of implementedFiles) {
      console.log(`   Reviewing: ${file}`);

      try {
        // Use existing cross-llm-test.sh script
        const scriptPath = path.join(__dirname, '../scripts/cross-llm-test.sh');
        const { stdout } = await execAsync(`${scriptPath} ${file}`, {
          timeout: 180000, // 3 minutes timeout for LLM reviews (they can be slow)
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        reviewResults.push({
          file,
          status: 'reviewed',
          output: stdout,
        });
      } catch (error) {
        reviewResults.push({
          file,
          status: 'error',
          error: error.message,
        });
      }
    }

    // Store review results
    featureData.crossLLMReview = {
      timestamp: new Date(),
      results: reviewResults,
    };

    console.log(`   ✓ Reviewed ${reviewResults.length} files`);

    return {
      success: true,
      reviewCount: reviewResults.length,
      results: reviewResults,
    };
  }

  /**
   * Run A/B test across multiple LLMs for critical decisions
   */
  async runABTest(prompt, models = ['claude', 'gpt', 'gemini']) {
    console.log('\n🔬 Running A/B Test across LLMs...');

    try {
      const scriptPath = path.join(__dirname, '../scripts/ab-test-llms.sh');
      const modelsArg = models.join(',');

      const { stdout } = await execAsync(
        `${scriptPath} "${prompt}" --models ${modelsArg}`,
        {
          timeout: 300000, // 5 minutes for A/B testing (multiple LLMs)
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        }
      );

      console.log('   ✓ A/B test complete');

      return {
        success: true,
        output: stdout,
      };
    } catch (error) {
      console.error('   ❌ A/B test failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Finalize feature testing
   */
  async finalizeFeature(featureId) {
    const featureData = this.activeFeatures.get(featureId);
    if (!featureData) {
      return { success: false, error: 'Feature not found' };
    }

    console.log(`\n🏁 Finalizing testing for: ${featureData.feature.title}`);

    // Run final test suite
    const finalResults = await this.runTests(
      featureId,
      featureData.generatedTests
    );

    // Check quality gates
    const gateResults = await this.gates.enforce(
      featureId,
      featureData.analysis.level
    );

    // Check cross-LLM review if required
    let crossLLMCheck = { completed: true };
    if (featureData.requiresCrossLLMReview && !featureData.crossLLMReview) {
      crossLLMCheck = {
        completed: false,
        message: 'Cross-LLM review required but not completed',
      };
    }

    const allChecksPassed =
      gateResults.passed && crossLLMCheck.completed;

    // Move briefs and specs to completed folders if all checks passed
    if (allChecksPassed) {
      console.log('\n📁 Moving briefs and specs to completed folders...');
      try {
        await this.moveToCompleted(featureId);
        console.log('   ✓ Briefs and specs moved to completed');
      } catch (error) {
        console.log(`   ⚠️  Could not move files: ${error.message}`);
      }
    }

    // Generate report
    const report = this.generateReport(
      featureData,
      finalResults,
      gateResults,
      crossLLMCheck
    );

    // Clean up
    this.activeFeatures.delete(featureId);

    return {
      success: allChecksPassed,
      report,
      nextSteps: allChecksPassed
        ? ['Ready for deployment', 'All tests passing', 'Quality gates met']
        : ['Fix failing tests', 'Complete required reviews', 'Address gate failures'],
    };
  }

  /**
   * Move briefs and specs to completed folders
   * @param {string} featureId - Feature identifier
   */
  async moveToCompleted(featureId) {
    const cwd = process.cwd();

    // Create completed folders if they don't exist
    await fs.mkdir(path.join(cwd, 'briefs', 'completed'), { recursive: true });
    await fs.mkdir(path.join(cwd, 'specs', 'completed'), { recursive: true });

    // Find and move briefs matching the feature ID
    const briefsActive = path.join(cwd, 'briefs', 'active');
    const briefsRoot = path.join(cwd, 'briefs');
    const briefsCompleted = path.join(cwd, 'briefs', 'completed');

    try {
      const activeBriefs = await fs.readdir(briefsActive);
      for (const file of activeBriefs) {
        if (file.includes(featureId) || file.endsWith('.md') || file.endsWith('.json')) {
          const source = path.join(briefsActive, file);
          const dest = path.join(briefsCompleted, file);
          await fs.rename(source, dest);
          console.log(`   Moved brief: ${file}`);
        }
      }
    } catch (error) {
      // Ignore if active folder doesn't exist
    }

    // Also check root briefs folder
    try {
      const rootBriefs = await fs.readdir(briefsRoot);
      for (const file of rootBriefs) {
        if ((file.includes(featureId) || file.startsWith('brief-')) && (file.endsWith('.md') || file.endsWith('.json'))) {
          const source = path.join(briefsRoot, file);
          const dest = path.join(briefsCompleted, file);
          // Only move if it's a file, not a directory
          const stats = await fs.stat(source);
          if (stats.isFile()) {
            await fs.rename(source, dest);
            console.log(`   Moved brief: ${file}`);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    // Find and move specs matching the feature ID
    const specsActive = path.join(cwd, 'specs', 'active');
    const specsRoot = path.join(cwd, 'specs');
    const specsCompleted = path.join(cwd, 'specs', 'completed');

    try {
      const activeSpecs = await fs.readdir(specsActive);
      for (const file of activeSpecs) {
        if (file.includes(featureId) || file.endsWith('.md')) {
          const source = path.join(specsActive, file);
          const dest = path.join(specsCompleted, file);
          await fs.rename(source, dest);
          console.log(`   Moved spec: ${file}`);
        }
      }
    } catch (error) {
      // Ignore if active folder doesn't exist
    }

    // Also check root specs folder
    try {
      const rootSpecs = await fs.readdir(specsRoot);
      for (const file of rootSpecs) {
        if ((file.includes(featureId) || file.startsWith('spec-')) && file.endsWith('.md')) {
          const source = path.join(specsRoot, file);
          const dest = path.join(specsCompleted, file);
          // Only move if it's a file, not a directory
          const stats = await fs.stat(source);
          if (stats.isFile()) {
            await fs.rename(source, dest);
            console.log(`   Moved spec: ${file}`);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport(featureData, testResults, gateResults, crossLLMCheck) {
    return {
      feature: {
        id: featureData.feature.id,
        title: featureData.feature.title,
        complexity: featureData.analysis.level,
      },
      tests: {
        generated: featureData.generatedTests.length,
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped,
      },
      coverage: testResults.coverage,
      qualityGates: {
        passed: gateResults.passed,
        details: gateResults.gates,
      },
      crossLLMReview: {
        required: featureData.requiresCrossLLMReview,
        completed: crossLLMCheck.completed,
        results: featureData.crossLLMReview?.results || [],
      },
      recommendations: this.getRecommendations(
        featureData,
        testResults,
        gateResults,
        crossLLMCheck
      ),
    };
  }

  /**
   * Get recommendations based on results
   */
  getRecommendations(featureData, testResults, gateResults, crossLLMCheck) {
    const recommendations = [];

    if (testResults.failed > 0) {
      recommendations.push(`Fix ${testResults.failed} failing tests`);
    }

    if (
      testResults.coverage <
      (featureData.analysis.profile.coverage?.lines || 0)
    ) {
      recommendations.push(
        `Increase coverage to ${featureData.analysis.profile.coverage.lines}%`
      );
    }

    if (!crossLLMCheck.completed) {
      recommendations.push('Complete mandatory cross-LLM review');
    }

    if (!gateResults.passed) {
      recommendations.push('Address quality gate failures');
    }

    if (recommendations.length === 0) {
      recommendations.push('All checks passed - ready for deployment');
    }

    return recommendations;
  }

  /**
   * Determine if cross-LLM review is required
   */
  requiresCrossLLMReview(complexityLevel) {
    if (!this.options.enforceCrossLLMReview) {
      return false;
    }

    // Require cross-LLM review for complex and critical features
    return ['complex', 'critical'].includes(complexityLevel);
  }

  /**
   * Determine if pre-commit review should be enabled
   */
  shouldEnablePreCommitReview(complexityLevel) {
    if (!this.options.preCommitReview) {
      return false;
    }

    // Enable pre-commit review for complex and critical features
    // (moderate can opt-in, but not required)
    return ['complex', 'critical'].includes(complexityLevel);
  }

  /**
   * Get next steps based on complexity and review requirements
   */
  getNextSteps(level, requiresCrossLLMReview) {
    const steps = {
      trivial: [
        '1. Make the cosmetic change',
        '2. Verify existing tests pass',
        '3. Deploy',
      ],
      simple: [
        '1. Review generated integration test',
        '2. Implement code to make test pass',
        '3. Run tests to verify',
        '4. Deploy when green',
      ],
      moderate: [
        '1. Review all generated tests',
        '2. Implement features incrementally',
        '3. Make integration tests pass first',
        '4. Add unit tests for logic',
        '5. Ensure coverage targets met',
      ],
      complex: [
        '1. Follow TDD workflow strictly',
        '2. Implement one test at a time',
        '3. **Pre-commit review will catch issues before writing**',
        '4. Write minimal code to pass',
        '5. Refactor when tests pass',
        '6. **REQUIRED: Run cross-LLM review**',
        '7. Review with team',
      ],
      critical: [
        '1. Review test plan with team',
        '2. Consider breaking into smaller features',
        '3. Implement incrementally with TDD',
        '4. **Pre-commit review enabled - code reviewed before writing**',
        '5. Run security and performance tests',
        '6. **REQUIRED: Cross-LLM review for all code**',
        '7. Architecture review',
        '8. Full regression testing',
      ],
    };

    return steps[level] || steps.moderate;
  }

  /**
   * Get coverage for a feature
   */
  async getCoverage(featureId) {
    try {
      const coveragePath = path.join(
        process.cwd(),
        'coverage',
        'coverage-summary.json'
      );
      const coverageData = JSON.parse(await fs.readFile(coveragePath, 'utf8'));

      return coverageData.total.lines.pct || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * HOOK INTEGRATION: Trigger sequential hook sequence
   * Called at the start of feature initialization
   * @param {Object} feature - Feature/brief to process
   * @returns {Object} Hook execution result with accumulated advice
   */
  async triggerHookSequence(feature) {
    // Initialize context manager with the feature/brief
    const sessionId = await this.contextManager.initialize(feature, {
      projectPath: process.cwd(),
      timestamp: new Date(),
    });

    console.log(`   Session ID: ${sessionId}`);

    // Execute sequential hooks with context accumulation
    const result = await this.hookSystem.executeSequentialHooks(
      feature,
      this.contextManager.getFullContext()
    );

    // Store all advice in context manager
    for (const advice of result.context.advice) {
      await this.contextManager.addAdvice(
        advice.hookName,
        advice.agent,
        advice
      );
    }

    return result;
  }

  /**
   * HOOK INTEGRATION: Trigger hooks after spec creation
   * Called after spec is created but before test generation
   * @param {Object} spec - Spec document
   * @param {Object} feature - Original feature/brief
   * @returns {Object} Hook execution result
   */
  async triggerHooksAfterSpec(spec, feature) {
    if (!this.options.enableHooks) {
      return { skipped: true };
    }

    console.log('\n🔗 Hook System: Post-Spec Review');

    // Create snapshot before spec review
    const snapshotId = this.contextManager.createSnapshot('pre-spec-review');

    // Add spec to context
    this.contextManager.context.spec = spec;

    // Could trigger specific hooks here for spec review
    // For now, just log that we're ready for next phase
    console.log('   Context updated with spec');
    console.log(`   Snapshot created: ${snapshotId}`);

    return {
      success: true,
      snapshotId,
    };
  }

  /**
   * HOOK INTEGRATION: Trigger hooks before test generation
   * Called right before generating tests
   * @param {Object} testPlan - Test plan to review
   * @returns {Object} Hook execution result
   */
  async triggerHooksBeforeTests(testPlan) {
    if (!this.options.enableHooks) {
      return { skipped: true };
    }

    console.log('\n🔗 Hook System: Pre-Test-Generation Review');

    // Add test plan to context
    this.contextManager.context.testPlan = testPlan;

    console.log('   Context updated with test plan');

    return {
      success: true,
    };
  }

  /**
   * HOOK INTEGRATION: Trigger hooks after design selection
   * Called when user selects a design (for UI features)
   * @param {Object} design - Selected design
   * @returns {Object} Hook execution result
   */
  async triggerHooksAfterDesign(design) {
    if (!this.options.enableHooks) {
      return { skipped: true };
    }

    console.log('\n🔗 Hook System: Post-Design-Selection Review');

    // Add design to context
    this.contextManager.context.selectedDesign = design;

    console.log('   Context updated with selected design');

    return {
      success: true,
    };
  }

  /**
   * HOOK INTEGRATION: Trigger hooks on quality gate results
   * Called after quality gates are evaluated
   * @param {Object} gateResults - Quality gate results
   * @returns {Object} Hook execution result
   */
  async triggerHooksOnQualityGates(gateResults) {
    if (!this.options.enableHooks) {
      return { skipped: true };
    }

    console.log('\n🔗 Hook System: Quality Gate Analysis');

    // Add gate results to context
    this.contextManager.context.qualityGates = gateResults;

    // If gates failed, could trigger feedback loop here
    if (!gateResults.passed) {
      console.log('   ⚠️  Quality gates failed - advice may need revision');
    }

    console.log('   Context updated with quality gate results');

    return {
      success: true,
      requiresRevision: !gateResults.passed,
    };
  }

  /**
   * Get accumulated advice from hook system
   * @returns {Array} All advice from hooks
   */
  getAccumulatedAdvice() {
    return this.contextManager.context.advice || [];
  }

  /**
   * Get context manager stats
   * @returns {Object} Context statistics
   */
  getContextStats() {
    return this.contextManager.getStats();
  }

  /**
   * Export context for analysis
   * @returns {Object} Exportable context
   */
  exportContext() {
    return this.contextManager.exportContext();
  }
}

module.exports = TestOrchestrator;
