#!/usr/bin/env node

/**
 * Post-Build Visual Testing Hook
 *
 * Automatically runs Playwright visual tests after feature implementation
 * to catch UI issues before manual testing.
 *
 * This hook is called by the build-feature workflow after:
 * 1. Tests are generated
 * 2. Implementation is complete
 * 3. Unit/integration tests pass
 *
 * It performs:
 * - Screenshot capture across viewports
 * - Visual regression testing
 * - Accessibility checks
 * - Performance metrics
 * - AI-powered visual analysis
 */

const fs = require('fs');
const path = require('path');
const { PlaywrightTestRunner } = require('../../cli/testing/playwright-test-runner');

class PostBuildVisualTestHook {
  constructor() {
    this.projectRoot = this.findProjectRoot();
    this.featureId = process.env.FEATURE_ID || this.detectFeatureId();
  }

  findProjectRoot() {
    // Look for package.json going up the directory tree
    let dir = process.cwd();

    while (dir !== '/') {
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        // Check if this is a Next.js project
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
        );

        if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
          return dir;
        }
      }
      dir = path.dirname(dir);
    }

    return process.cwd();
  }

  detectFeatureId() {
    // Try to detect from recent git commits or file changes
    try {
      const { execSync } = require('child_process');

      // Check recent commit messages
      const recentCommit = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();

      // Extract feature ID patterns
      const match = recentCommit.match(/feature[- ]?(\d+|[\w-]+)/i);
      if (match) {
        return match[1];
      }

      // Check for feature files
      const featureDir = path.join(this.projectRoot, '.dev-framework', 'features');
      if (fs.existsSync(featureDir)) {
        const files = fs.readdirSync(featureDir).filter(f => f.endsWith('.json'));
        if (files.length > 0) {
          // Get most recent feature
          const features = files.map(f => ({
            name: f.replace('.json', ''),
            time: fs.statSync(path.join(featureDir, f)).mtime
          }));
          features.sort((a, b) => b.time - a.time);
          return features[0].name;
        }
      }
    } catch {
      // Fallback
    }

    return `feature-${Date.now()}`;
  }

  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('🎭 POST-BUILD VISUAL TESTING');
    console.log('='.repeat(60) + '\n');

    console.log(`📦 Project: ${path.basename(this.projectRoot)}`);
    console.log(`🏷️  Feature: ${this.featureId}`);
    console.log(`📁 Root: ${this.projectRoot}\n`);

    // Check if we should skip visual testing
    if (this.shouldSkip()) {
      console.log('ℹ️  Skipping visual tests (disabled or not applicable)\n');
      return { skipped: true };
    }

    // Run Playwright tests
    const runner = new PlaywrightTestRunner(this.projectRoot, this.featureId);
    const result = await runner.runPostBuildTests();

    // Handle results
    if (result.success) {
      this.handleSuccess(result);
    } else {
      this.handleFailure(result);
    }

    return result;
  }

  shouldSkip() {
    // Check environment variables
    if (process.env.SKIP_VISUAL_TESTS === 'true') {
      return true;
    }

    // Check if this is a backend-only feature
    const featureFile = path.join(
      this.projectRoot,
      '.dev-framework',
      'features',
      `${this.featureId}.json`
    );

    if (fs.existsSync(featureFile)) {
      const feature = JSON.parse(fs.readFileSync(featureFile, 'utf8'));
      if (feature.type === 'backend' || feature.skipVisualTests) {
        return true;
      }
    }

    // Check if Playwright is available
    try {
      require.resolve('@playwright/test');
    } catch {
      console.log('⚠️  Playwright not installed. Run: npm install -D @playwright/test');
      return true;
    }

    return false;
  }

  handleSuccess(result) {
    console.log('✅ Visual tests passed!\n');

    // Create success marker
    const markerPath = path.join(
      this.projectRoot,
      '.dev-framework',
      'features',
      `${this.featureId}.visual-tested`
    );

    fs.writeFileSync(markerPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      scores: result.report.scores,
      reportPath: result.report.reportPath
    }, null, 2));

    // Output recommendations
    if (result.report.issues.suggestions.length > 0) {
      console.log('💡 Suggestions for improvement:');
      result.report.issues.suggestions.slice(0, 3).forEach(s => {
        console.log(`   - ${s}`);
      });
      console.log('');
    }

    console.log('📄 View full report:', result.report.reportPath);
  }

  handleFailure(result) {
    console.log('❌ Visual tests failed!\n');

    if (result.error) {
      console.log('Error:', result.error);
    } else if (result.report) {
      // Show critical issues
      if (result.report.issues.critical.length > 0) {
        console.log('🚨 Critical issues:');
        result.report.issues.critical.forEach(issue => {
          console.log(`   - ${issue.description || issue}`);
        });
        console.log('');
      }

      // Show warnings if no critical issues
      if (result.report.issues.critical.length === 0 &&
          result.report.issues.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        result.report.issues.warnings.slice(0, 5).forEach(warning => {
          console.log(`   - ${warning.description || warning}`);
        });
        console.log('');
      }

      console.log('📄 View full report:', result.report.reportPath);
    }

    console.log('\n🔧 To fix issues:');
    console.log('1. Review the visual report');
    console.log('2. Fix identified problems');
    console.log('3. Re-run: npm run test:playwright');
  }
}

// Integration with build-feature workflow
async function hookIntoBuildFeature() {
  // This function is called by the build-feature command
  const hook = new PostBuildVisualTestHook();
  return await hook.run();
}

// Standalone execution
if (require.main === module) {
  const hook = new PostBuildVisualTestHook();

  hook.run().then(result => {
    if (!result.success && !result.skipped) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Hook failed:', error);
    process.exit(1);
  });
}

module.exports = {
  PostBuildVisualTestHook,
  hookIntoBuildFeature
};