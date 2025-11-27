#!/usr/bin/env node

/**
 * Migration Guide Hook
 *
 * Purpose: Ensures all AI assistants apply database migrations consistently
 * using the established Node.js + pg Client pattern.
 *
 * Trigger: When AI mentions migrations or tries to apply database changes
 * Type: pre-tool-use (injects guidance BEFORE tool execution)
 */

module.exports = {
  name: 'migration-guide',
  description: 'Provides migration application guidance to prevent common mistakes',
  type: 'pre-tool-use',
  version: '1.0.0',

  // Trigger conditions
  trigger: {
    // Keywords that indicate migration-related activity
    keywords: [
      'migration',
      'apply migration',
      'db:push',
      'supabase migrate',
      'create migration',
      'run migration',
      'database schema',
      'ALTER TABLE',
      'CREATE TABLE',
      'pg_cron',
      'supabase/migrations'
    ],

    // Tool patterns that suggest migration attempts
    toolPatterns: [
      /supabase.*push/i,
      /npx supabase db/i,
      /psql.*postgres/i,
      /apply.*migration/i
    ]
  },

  // Hook execution
  execute: async (context) => {
    const { userMessage, toolsBeingCalled } = context;

    // Check if this is migration-related
    const isMigrationRelated =
      module.exports.trigger.keywords.some(kw =>
        userMessage?.toLowerCase().includes(kw.toLowerCase())
      ) ||
      module.exports.trigger.toolPatterns.some(pattern =>
        toolsBeingCalled?.some(tool => pattern.test(tool.name || tool.description))
      );

    if (!isMigrationRelated) {
      return { shouldProceed: true };
    }

    // Inject migration guidance
    return {
      guidance: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 MIGRATION GUIDE - HOW THIS PROJECT APPLIES DATABASE MIGRATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  CRITICAL: This project uses a SPECIFIC migration pattern. Do NOT deviate.

📋 ESTABLISHED PATTERN (from scripts/apply-migrations-062-063.js):

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CREATE NODE.JS SCRIPT                                                    │
│    Location: projects/homeschool-coop/scripts/apply-migration-XXX.js        │
│                                                                              │
│ 2. READ DATABASE PASSWORD                                                   │
│    Source: /home/sean_unix/Projects/dev-framework/.env.secrets              │
│    Pattern: export SUPABASE_DB_PASSWORD="..."                               │
│                                                                              │
│ 3. CONNECT VIA PG CLIENT                                                    │
│    Library: require('pg').Client                                            │
│    Connection: Direct PostgreSQL connection (NOT Supabase CLI)              │
│                                                                              │
│ 4. READ AND EXECUTE SQL FILE                                                │
│    Source: supabase/migrations/XXX_description.sql                          │
│    Method: client.query(sqlContent)                                         │
│                                                                              │
│ 5. VERIFY CHANGES                                                           │
│    Query database to confirm tables/columns/views/indexes exist             │
└─────────────────────────────────────────────────────────────────────────────┘

📝 COMPLETE CODE TEMPLATE:

\`\`\`javascript
#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read database password from secrets
const secretsPath = '/home/sean_unix/Projects/dev-framework/.env.secrets';
const secretsContent = fs.readFileSync(secretsPath, 'utf8');
const dbPassword = secretsContent.match(/export SUPABASE_DB_PASSWORD="(.+)"/)[1];

// Connection string for Supabase
const connectionString = \`postgresql://postgres.ddnushvhvpqchkvyejsn:\${dbPassword}@aws-1-us-east-2.pooler.supabase.com:6543/postgres\`;

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/XXX_description.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Applying migration XXX...\\n');
    await client.query(migrationSQL);
    console.log('✅ Migration XXX applied successfully!\\n');

    // Verify changes (example: check if table exists)
    const verification = await client.query(\`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'your_new_table'
    \`);

    if (verification.rows.length > 0) {
      console.log('✅ Verification: Table created successfully');
    } else {
      console.error('❌ Verification failed: Table not found');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
\`\`\`

🚫 DO NOT TRY THESE APPROACHES (THEY WILL FAIL):

❌ supabase db push
   Reason: Not configured for this project

❌ npx supabase migration up
   Reason: Requires Supabase CLI authentication not available

❌ Direct psql connection attempt
   Reason: Password handling doesn't match project pattern

❌ Login-based Supabase commands
   Reason: No interactive login available in CI/automation

❌ env -u SUPABASE_ACCESS_TOKEN supabase ...
   Reason: Unsetting token doesn't solve the auth issue

✅ ONLY VALID APPROACH:

Node.js script with pg Client using .env.secrets password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 FILE LOCATIONS:

Migration SQL files:     projects/homeschool-coop/supabase/migrations/
Application scripts:     projects/homeschool-coop/scripts/
Database password:       /home/sean_unix/Projects/dev-framework/.env.secrets

📚 REFERENCE EXAMPLES:

- scripts/apply-migrations-062-063.js  (Most recent, best reference)
- scripts/apply-migration-061.js
- scripts/apply-migration-060.js
- scripts/apply-migration-059.js

🔍 VERIFICATION PATTERNS:

After applying migration, ALWAYS verify:

1. Tables exist:
   SELECT table_name FROM information_schema.tables WHERE table_name = '...'

2. Columns added:
   SELECT column_name FROM information_schema.columns WHERE table_name = '...'

3. Views created:
   SELECT table_name FROM information_schema.views WHERE table_name = '...'

4. Indexes created:
   SELECT indexname FROM pg_indexes WHERE indexname = '...'

5. Functions created:
   SELECT routine_name FROM information_schema.routines WHERE routine_name = '...'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ QUICK START:

1. Check existing scripts for latest pattern
2. Create new script following template above
3. Update migration number (XXX) and description
4. Run: node projects/homeschool-coop/scripts/apply-migration-XXX.js
5. Verify success with database queries

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ TROUBLESHOOTING:

Problem: "ENOENT: no such file or directory, open '.env.secrets'"
Solution: Use absolute path /home/sean_unix/Projects/dev-framework/.env.secrets

Problem: "password authentication failed"
Solution: Double-check password regex matches .env.secrets format exactly

Problem: "SSL connection error"
Solution: Add ssl: { rejectUnauthorized: false } to Client config

Problem: "permission denied"
Solution: Make script executable: chmod +x scripts/apply-migration-XXX.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 REMEMBER: Follow this pattern EXACTLY. Do not attempt alternative methods.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,
      shouldProceed: true,
      metadata: {
        hookName: 'migration-guide',
        triggeredBy: isMigrationRelated ? 'keyword-match' : 'tool-pattern-match',
        timestamp: new Date().toISOString()
      }
    };
  },

  // Hook configuration
  config: {
    priority: 'critical',
    blocking: false, // Don't block execution, just inject guidance
    applyToAllSessions: true, // Works across all bot instances
    persistGuidance: true // Keep showing until migration is complete
  }
};
