#!/usr/bin/env node

/**
 * Pre-commit hook for schema validation
 * Prevents schema mismatches and integration failures before code is committed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import the schema validator
const {
  validateCodeAgainstSchema,
  validateFeature
} = require('../../cli/guardrails/schema-validator');

async function runSchemaValidation() {
  console.log('🔍 Running schema validation checks...\n');

  try {
    // Get list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .filter(file => file.length > 0);

    if (stagedFiles.length === 0) {
      console.log('No files staged for commit');
      return true;
    }

    // Find project root (look for nearest package.json)
    let projectRoot = process.cwd();
    while (!fs.existsSync(path.join(projectRoot, 'package.json')) && projectRoot !== '/') {
      projectRoot = path.dirname(projectRoot);
    }

    // Check if this is a project with database (has supabase folder)
    const hasDatabase = fs.existsSync(path.join(projectRoot, 'supabase', 'migrations'));

    if (!hasDatabase) {
      console.log('✅ No database in this project, skipping schema validation');
      return true;
    }

    let hasErrors = false;
    const validationResults = [];

    // Validate each staged file that interacts with database
    for (const file of stagedFiles) {
      // Skip non-code files
      if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue;

      // Skip test files (they often have mocked schemas)
      if (file.includes('.test.') || file.includes('.spec.')) continue;

      // Check if file likely interacts with database
      const fullPath = path.join(projectRoot, file);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const hasDbInteraction =
        content.includes('supabase') ||
        content.includes('SELECT') ||
        content.includes('INSERT') ||
        content.includes('UPDATE') ||
        content.includes('DELETE') ||
        content.includes('from(') ||
        content.includes('.eq(') ||
        content.includes('.insert(') ||
        content.includes('.update(');

      if (!hasDbInteraction) continue;

      console.log(`Validating ${file}...`);

      try {
        const result = await validateCodeAgainstSchema(fullPath, projectRoot);

        if (!result.valid) {
          hasErrors = true;
          console.error(`\n❌ Schema validation failed for ${file}:`);

          result.errors.forEach(error => {
            console.error(`   - ${error.message}`);
            if (error.line) {
              console.error(`     Line ${error.line}: ${error.code}`);
            }
            if (error.suggestion) {
              console.error(`     💡 Suggestion: ${error.suggestion}`);
            }
          });

          result.warnings.forEach(warning => {
            console.warn(`   ⚠️  ${warning.message}`);
            if (warning.suggestion) {
              console.warn(`     💡 Suggestion: ${warning.suggestion}`);
            }
          });
        } else if (result.warnings.length > 0) {
          console.log(`⚠️  Warnings for ${file}:`);
          result.warnings.forEach(warning => {
            console.warn(`   - ${warning.message}`);
            if (warning.suggestion) {
              console.warn(`     💡 ${warning.suggestion}`);
            }
          });
        } else {
          console.log(`✅ ${file} - Schema validation passed`);
        }

        validationResults.push({ file, result });
      } catch (error) {
        console.error(`Error validating ${file}: ${error.message}`);
        hasErrors = true;
      }
    }

    // Check for feature-level validation if this looks like a feature commit
    const commitMessage = process.argv[2] || '';
    const featureMatch = commitMessage.match(/feat(?:ure)?[:\s]+([^:\s]+)/i);

    if (featureMatch) {
      const featureName = featureMatch[1];
      console.log(`\n📦 Validating feature: ${featureName}`);

      try {
        const featureResult = await validateFeature(featureName, projectRoot);

        if (!featureResult.valid) {
          hasErrors = true;
          console.error(`\n❌ Feature validation failed for ${featureName}:`);

          featureResult.errors.forEach(error => {
            console.error(`   - ${error.message}`);
            if (error.suggestion) {
              console.error(`     💡 Suggestion: ${error.suggestion}`);
            }
          });
        }

        // Show integration test coverage
        if (featureResult.suggestions) {
          const integrationTestSuggestion = featureResult.suggestions.find(
            s => s.includes('integration test')
          );
          if (integrationTestSuggestion) {
            console.log(`\n💡 ${integrationTestSuggestion}`);
          }
        }
      } catch (error) {
        console.error(`Error validating feature ${featureName}: ${error.message}`);
      }
    }

    if (hasErrors) {
      console.error('\n❌ Schema validation failed. Please fix the errors before committing.');
      console.log('\n💡 Tips:');
      console.log('   1. Check table and column names match your migrations');
      console.log('   2. Ensure RLS policies don\'t create circular dependencies');
      console.log('   3. Verify Zod schemas match database schema exactly');
      console.log('   4. Consider adding integration tests for database operations');
      console.log('\n   Run "npm run framework:validate" to see detailed validation report');

      return false;
    }

    console.log('\n✅ All schema validations passed!');
    return true;

  } catch (error) {
    console.error('Error during schema validation:', error.message);
    console.log('Allowing commit to proceed (validation error)');
    return true; // Don't block on validation errors
  }
}

// Run validation
(async () => {
  const isValid = await runSchemaValidation();
  process.exit(isValid ? 0 : 1);
})();