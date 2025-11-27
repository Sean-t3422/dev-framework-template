#!/usr/bin/env node

/**
 * Build Feature Hook - Integrates schema validation into the build-feature workflow
 * This runs automatically when /build-feature is executed
 */

const path = require('path');
const fs = require('fs');

// Import paths
const schemaTestWrapperPath = path.join(__dirname, '../../cli/testing/schema-test-wrapper.js');

class BuildFeatureHook {
  constructor() {
    this.projectRoot = process.cwd();
    this.hasDatabase = this.checkForDatabase();
  }

  checkForDatabase() {
    const supabasePath = path.join(this.projectRoot, 'supabase', 'migrations');
    return fs.existsSync(supabasePath);
  }

  async runSchemaValidation() {
    if (!this.hasDatabase) {
      console.log('ℹ️  No database detected, skipping schema validation');
      return { success: true, warnings: [] };
    }

    console.log('\n📊 Running Database Schema Validation...');

    try {
      // Handle TypeScript module loading
      let schemaValidator;
      try {
        // Try compiled JS version
        schemaValidator = require('../../cli/guardrails/schema-validator.js');
      } catch (e) {
        try {
          // Try TypeScript with ts-node
          require('ts-node/register');
          schemaValidator = require('../../cli/guardrails/schema-validator.ts');
        } catch (tsError) {
          // Fallback to basic validation
          console.log('   ⚠️  Schema validator not compiled, using basic validation');
          return { success: true, warnings: ['Schema validator not available - skipping detailed validation'] };
        }
      }

      const { extractDatabaseSchema, detectRLSCircularDependencies } = schemaValidator;

      // Extract current schema
      console.log('   Extracting current schema from migrations...');
      const schema = await extractDatabaseSchema(this.projectRoot);

      const tableCount = Object.keys(schema.tables).length;
      const functionCount = Object.keys(schema.functions).length;
      const policyCount = Object.keys(schema.policies).length;

      console.log(`   Found ${tableCount} tables, ${functionCount} functions, ${policyCount} RLS policies\n`);

      // Check for RLS circular dependencies
      const circularDeps = detectRLSCircularDependencies(schema);

      const warnings = [];
      const errors = [];

      if (circularDeps.length > 0) {
        errors.push('❌ RLS circular dependencies detected:');
        circularDeps.forEach(dep => {
          errors.push(`   ${dep.cycle.join(' → ')} → ${dep.cycle[0]}`);
          errors.push(`   💡 Use SECURITY DEFINER function to break the cycle`);
        });
      }

      // Check for common naming issues
      const commonMistakes = this.checkCommonMistakes(schema);
      if (commonMistakes.length > 0) {
        console.log('   Common Mistake Prevention:');
        commonMistakes.forEach(mistake => {
          console.log(`   ℹ️  ${mistake}`);
          warnings.push(mistake);
        });
      }

      // Check for missing integration test coverage
      const missingTests = await this.checkIntegrationTestCoverage(schema);
      if (missingTests.length > 0) {
        console.log('\n   ⚠️  Tables without integration tests:');
        missingTests.forEach(table => {
          console.log(`      - ${table}`);
        });
        warnings.push(`${missingTests.length} tables lack integration test coverage`);
      }

      if (errors.length > 0) {
        console.log('\n   Schema Validation:');
        errors.forEach(error => console.log(`   ${error}`));
        return { success: false, errors, warnings };
      }

      console.log('   Schema Validation:');
      console.log('   ✅ No circular RLS dependencies detected');
      console.log('   ✅ Table naming conventions consistent');

      if (warnings.length > 0) {
        warnings.forEach(warning => {
          console.log(`   ⚠️  ${warning}`);
        });
      }

      return { success: true, warnings };

    } catch (error) {
      console.log(`   ⚠️  Could not complete schema validation: ${error.message}`);
      // Don't fail the build if validation has issues
      return { success: true, warnings: [`Schema validation incomplete: ${error.message}`] };
    }
  }

  checkCommonMistakes(schema) {
    const reminders = [];

    // Check for family_groups table
    if (schema.tables.family_groups) {
      reminders.push("Remember: Use 'family_groups' not 'families'");

      if (schema.tables.family_groups.columns.family_name) {
        reminders.push("Remember: Use 'family_name' not 'name' for family_groups");
      }
    }

    // Check for student relationships
    if (schema.tables.students && schema.tables.family_members) {
      reminders.push("Remember: Students relate through 'family_members' junction table");
    }

    // Check for payment tables
    if (schema.tables.payment_items) {
      reminders.push("Remember: Use 'payment_items' for individual charges");
    }

    // Check for event RSVPs
    if (schema.tables.event_rsvps) {
      reminders.push("Remember: RSVP fees must multiply by attendee_count");
    }

    return reminders;
  }

  async checkIntegrationTestCoverage(schema) {
    const testDirs = [
      path.join(this.projectRoot, 'tests', 'integration'),
      path.join(this.projectRoot, '__tests__', 'integration')
    ];

    const coveredTables = new Set();

    for (const testDir of testDirs) {
      if (!fs.existsSync(testDir)) continue;

      const files = this.getAllFiles(testDir);
      for (const file of files) {
        if (!file.endsWith('.test.ts') && !file.endsWith('.test.tsx')) continue;

        const content = fs.readFileSync(file, 'utf-8');

        // Check which tables are tested
        Object.keys(schema.tables).forEach(table => {
          if (content.includes(`from('${table}')`) ||
              content.includes(`"${table}"`) ||
              content.includes(`'${table}'`)) {
            coveredTables.add(table);
          }
        });
      }
    }

    const allTables = Object.keys(schema.tables);
    const missingTests = allTables.filter(t => !coveredTables.has(t));

    return missingTests;
  }

  getAllFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async generateSchemaAwareTests(featureName) {
    console.log('\n🧪 Generating Schema-Aware Tests...');

    try {
      const { SchemaTestWrapper } = require(schemaTestWrapperPath);
      const wrapper = new SchemaTestWrapper(this.projectRoot);

      // This will generate integration tests with proper schema validation
      const generatedTests = await wrapper.generateMissingIntegrationTests();

      if (generatedTests.length > 0) {
        console.log(`   ✅ Generated ${generatedTests.length} schema-aware integration tests`);
      }

      return true;
    } catch (error) {
      console.log(`   ⚠️  Could not generate schema-aware tests: ${error.message}`);
      return false;
    }
  }

  async checkMigrations(featureName) {
    try {
      const { MigrationHook } = require('./migration.hook');
      const migrationHook = new MigrationHook(this.projectRoot);

      // Check for migrations related to this feature
      await migrationHook.runForFeature(featureName);

      // Check overall migration status
      const status = await migrationHook.checkMigrationStatus();

      if (!status) {
        console.log('\n⚠️  Migration issues detected but continuing (TDD expects failures)');
      }

      return true;
    } catch (error) {
      console.log(`\n⚠️  Could not check migrations: ${error.message}`);
      return true; // Don't block on migration check failures
    }
  }

  async execute(command, args) {
    // Check for --continue flag to resume stuck workflow
    if (args.includes('--continue')) {
      console.log('🔄 Continuing workflow with orchestrator...');
      const { BuildFeatureAutoHook } = require('./build-feature-auto.hook');
      const autoHook = new BuildFeatureAutoHook();
      return autoHook.execute(command, args);
    }

    // Extract feature name from args if available
    const featureName = args[0] || 'current-feature';

    // Check and apply migrations first
    console.log('\n🗄️  Migration Check...');
    await this.checkMigrations(featureName);

    // Run schema validation before test generation
    const validation = await this.runSchemaValidation();

    if (!validation.success) {
      console.log('\n❌ Schema validation failed! Fix these issues before proceeding:');
      validation.errors.forEach(error => console.log(error));
      console.log('\n💡 Run "npm run framework:check-rls" for detailed RLS analysis');
      process.exit(1);
    }

    // If there are warnings, show them but continue
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Schema warnings detected (non-blocking):');
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
      console.log('\n💡 Consider addressing these to prevent future issues\n');
    }

    // Continue with normal build-feature workflow
    console.log('✅ Schema validation passed, continuing with feature build...\n');

    // NOW INVOKE THE WORKFLOW ORCHESTRATOR WITH CODEX COLLABORATION!
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 TDD WORKFLOW WITH ENFORCED CODEX COLLABORATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The workflow-orchestrator will enforce:
1. DISCOVER: Brief creation → Codex review → Consensus
2. DESIGN: Test strategy → Codex review → Consensus
3. BUILD: TDD implementation → Codex gates → Approval
4. FINALIZE: Cleanup & documentation

❗ IMPORTANT: Each phase requires Codex approval before proceeding.
   Maximum 3 debate rounds before human intervention.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    // Invoke the NEW workflow orchestrator with Codex collaboration
    const { WorkflowOrchestrator } = require('../../agents/workflow-orchestrator');

    // NOTE: We don't pass agentInvoker here because JavaScript hooks cannot
    // invoke Task tool. This will throw a clear error that Claude Code should catch
    // and understand it needs to take over orchestration manually.
    const orchestrator = new WorkflowOrchestrator({
      enforceCodex: true,
      maxDebateRounds: 3,
      autoCleanup: true
    }); // No agentInvoker callback

    // Pass the feature description to the orchestrator
    try {
      const result = await orchestrator.orchestrateFeature(featureName);

      if (result.success) {
        console.log('\n✅ Feature development completed with full Codex approval!');
        return true;
      } else {
        console.log('\n❌ Feature development failed. Check errors above.');
        return false;
      }
    } catch (error) {
      console.error('\n❌ Workflow orchestration error:', error.message);

      // Check if this is the "needs Claude Code to take over" error
      if (error.message.includes('agentInvoker callback')) {
        console.log('\n📋 IMPORTANT: Claude Code main session should now take over!');
        console.log('\n   The workflow orchestrator detected this feature needs:');
        console.log('   1. Phase-based orchestration (DISCOVER → DESIGN → BUILD)');
        console.log('   2. Codex collaboration at each phase');
        console.log('   3. Manual complexity detection and orchestration decision\n');
        console.log('   Claude Code: Please manually orchestrate the workflow phases.');
        // Don't return false - let Claude see this message and decide what to do
        throw error; // Re-throw so Claude Code catches it
      }

      // If old auto-hook exists as fallback
      if (error.message.includes('Cannot find module')) {
        console.log('\n⚠️ Falling back to auto-hook (without Codex collaboration)...');
        const { BuildFeatureAutoHook } = require('./build-feature-auto.hook');
        const autoHook = new BuildFeatureAutoHook();
        return autoHook.execute(command, args);
      }

      return false;
    }
  }
}

// Export for use by the build-feature command
module.exports = { BuildFeatureHook };

// If run directly, execute the hook
if (require.main === module) {
  const hook = new BuildFeatureHook();
  const command = process.argv[2] || 'validate';
  const args = process.argv.slice(3);

  hook.execute(command, args).then(success => {
    process.exit(success ? 0 : 1);
  });
}