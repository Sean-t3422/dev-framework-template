#!/usr/bin/env node

/**
 * Auto Setup Credentials Hook
 *
 * Automatically ensures test credentials are configured before running any tests.
 * This hook is called automatically by build-feature and test commands.
 *
 * NO MANUAL INTERVENTION REQUIRED - it will prompt the user if needed.
 */

const fs = require('fs');
const path = require('path');
const { TestCredentialsManager } = require('../../cli/testing/test-credentials');

class AutoCredentialSetup {
  constructor() {
    this.projectRoot = this.findProjectRoot();
    this.manager = new TestCredentialsManager(this.projectRoot);
  }

  findProjectRoot() {
    let dir = process.cwd();

    while (dir !== '/') {
      if (fs.existsSync(path.join(dir, 'package.json'))) {
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

  /**
   * Main entry point - ensures credentials are set up
   */
  async ensure() {
    console.log('🔐 Checking test credentials...\n');

    // Check if credentials exist
    const credentials = this.manager.getCredentials();

    if (credentials && credentials.configured !== false) {
      console.log('✅ Test credentials configured');
      console.log(`   Using: ${credentials.email}`);
      return true;
    }

    // No credentials found - need to set them up
    console.log('❌ Test credentials not configured!\n');
    console.log('Playwright tests need real login credentials to work.\n');

    // Check if we already have some known credentials we can use
    if (await this.tryKnownCredentials()) {
      return true;
    }

    // Prompt user to set up credentials
    console.log('━'.repeat(60));
    console.log('⚠️  ACTION REQUIRED: Set up test credentials');
    console.log('━'.repeat(60) + '\n');

    console.log('Please run the following slash command:\n');
    console.log('   /setup-test-auth\n');
    console.log('Then provide your real login credentials.\n');

    console.log('OR manually create: .env.test.local with:\n');
    console.log('TEST_USER_EMAIL=your-email@example.com');
    console.log('TEST_USER_PASSWORD=your-password\n');

    // Create template file to make it easier
    this.createTemplate();

    console.log('━'.repeat(60));
    console.log('Tests CANNOT run without credentials!');
    console.log('━'.repeat(60) + '\n');

    return false;
  }

  /**
   * Try to use known credentials if available
   */
  async tryKnownCredentials() {
    // Check if we're in the homeschool-coop project with known credentials
    const projectName = path.basename(this.projectRoot);

    if (projectName === 'homeschool-coop') {
      // Check if the user is Sean (based on path or git config)
      const isKnownUser = this.projectRoot.includes('sean') ||
                          this.projectRoot.includes('Sean');

      if (isKnownUser) {
        console.log('🔍 Detected known project and user...\n');
        console.log('Setting up default credentials for this project.\n');

        // Use the known credentials
        await this.manager.saveCredentials(
          'test.user@example.com',
          'TestPassword123!',
          { format: 'env' }
        );

        console.log('✅ Credentials configured automatically!\n');
        return true;
      }
    }

    return false;
  }

  /**
   * Create template file for manual setup
   */
  createTemplate() {
    const templatePath = path.join(this.projectRoot, '.env.test.local.template');

    const template = `# Test Credentials Template
# Copy this to .env.test.local and fill in your real credentials

TEST_USER_EMAIL=your-email@example.com
TEST_USER_PASSWORD=your-password

# Optional: Additional test users
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin-password
`;

    fs.writeFileSync(templatePath, template);
    console.log(`📄 Template created: .env.test.local.template`);
    console.log('   Copy it to .env.test.local and add your credentials.\n');
  }

  /**
   * Quick check without prompting
   */
  static async quickCheck() {
    const setup = new AutoCredentialSetup();
    const credentials = setup.manager.getCredentials();

    return credentials && credentials.configured !== false;
  }
}

// Hook function for integration
async function ensureTestCredentials() {
  const setup = new AutoCredentialSetup();
  return await setup.ensure();
}

// Quick check function
async function hasTestCredentials() {
  return await AutoCredentialSetup.quickCheck();
}

// CLI execution
if (require.main === module) {
  const setup = new AutoCredentialSetup();

  setup.ensure().then(result => {
    if (!result) {
      console.error('⚠️  Credentials must be configured before tests can run!');
      process.exit(1);
    }
  });
}

module.exports = {
  AutoCredentialSetup,
  ensureTestCredentials,
  hasTestCredentials
};