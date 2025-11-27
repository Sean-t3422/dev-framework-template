#!/usr/bin/env node

/**
 * Migration Hook for Build-Feature Workflow
 * Automatically applies migrations when features are built
 */

const { MigrationRunner } = require('../../cli/migrations/migration-runner');
const fs = require('fs');
const path = require('path');

class MigrationHook {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.runner = new MigrationRunner(this.projectRoot);
  }

  async detectNewMigrations(featureName) {
    const migrationsDir = path.join(this.projectRoot, 'supabase', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      return [];
    }

    // Look for migrations that might be related to this feature
    const allMigrations = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Check if any migration mentions the feature
    const featureNumber = featureName.match(/\d+/)?.[0];
    const related = [];

    for (const migration of allMigrations) {
      const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf-8');

      // Check if migration is related to this feature
      if (
        migration.includes(featureName) ||
        (featureNumber && migration.includes(featureNumber)) ||
        content.includes(`Feature ${featureNumber}`) ||
        content.includes(featureName)
      ) {
        related.push(migration);
      }
    }

    return related;
  }

  async runForFeature(featureName) {
    console.log('\n🗄️  Checking migrations for feature:', featureName);

    // Detect related migrations
    const migrations = await this.detectNewMigrations(featureName);

    if (migrations.length > 0) {
      console.log(`\n📋 Found ${migrations.length} related migration(s):`);
      migrations.forEach(m => console.log(`   - ${m}`));

      console.log('\n🚀 Attempting to apply migrations automatically...');

      // Try to run migrations
      const success = await this.runner.run();

      if (!success) {
        console.log('\n⚠️  Automatic migration failed.');
        console.log('\n📝 Migration Instructions:');
        console.log('──────────────────────────');
        console.log('\nOption 1: Use ops script (recommended):');
        console.log('  bash ops/supabase-cloud.sh db-push');
        console.log('\nOption 2: Apply manually with psql:');
        migrations.forEach(m => {
          console.log(`  psql $DATABASE_URL -f supabase/migrations/${m}`);
        });
        console.log('\nOption 3: Fix credentials and retry:');
        console.log('  1. Add SUPABASE_ACCESS_TOKEN (starts with sbp_) to .env.secrets');
        console.log('  2. Run: npm run db:push:cloud');
        console.log('\n⚠️  Tests will fail until migrations are applied (expected in TDD)');

        return false;
      }

      console.log('✅ Migrations applied successfully!');
      return true;
    }

    console.log('✅ No new migrations needed for this feature');
    return true;
  }

  async checkMigrationStatus() {
    console.log('\n🔍 Checking migration status...');

    const pending = await this.runner.checkPendingMigrations();

    if (pending.length > 0) {
      console.log(`\n⚠️  Warning: ${pending.length} pending migration(s) detected`);
      console.log('   This may cause test failures.');
      console.log('   Run: npm run db:push:cloud');
      return false;
    }

    return true;
  }
}

// Export for use in build-feature workflow
module.exports = { MigrationHook };

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const featureName = args[0] || '017';

  const hook = new MigrationHook();

  (async () => {
    const success = await hook.runForFeature(featureName);
    process.exit(success ? 0 : 1);
  })();
}