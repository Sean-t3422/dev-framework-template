# Start Homeschool App (Complete Session Setup)

**Command**: `/start-homeschool-app`

**Description**: Complete session initialization for Homeschool Co-op Platform development. Loads all context, verifies environment, and starts dev server.

---

## What it does (IN ORDER)

### 1. 🚀 Initialize Framework Context
- Automatically runs `/check-project` to load all documentation
- Loads PROJECT_CONTEXT.md, TROUBLESHOOTING.md, FEATURE_PATTERNS.md
- Verifies understanding of critical patterns

### 2. 🔌 Verify Supabase Connection
- Checks `.env.local` exists with required variables
- Verifies Supabase project ID is `YOUR_SUPABASE_PROJECT_ID`
- Tests database connection with a simple query
- Reports connection status

### 3. 📦 Check Dependencies
- Verifies package.json has correct versions:
  - Next.js 14.2.5 (NOT 15)
  - React 18.3.1 (NOT 19)
  - Tailwind 3.4.x (NOT v4)
- Runs `npm install` if node_modules missing
- Warns about any version mismatches

### 4. 🛠️ Start Development Environment
- Changes to `projects/homeschool-coop` directory
- Starts Next.js dev server on port 3456
- Opens in background so you can continue working
- Shows URLs for app and Mailpit

### 5. ✅ Final Status Report
- Confirms all patterns loaded
- Shows database connection status
- Lists available slash commands
- Ready for development

---

## Usage

### Start New Session
```
/start-homeschool-app
```

That's it! Everything is initialized and ready.

---

## Example Output

**User says:** `/start-homeschool-app`

**Claude responds:**
```
🚀 Starting Homeschool Co-op Development Session...

Step 1/5: Loading Framework Context
----------------------------------------
📚 Running /check-project...
✅ PROJECT_CONTEXT.md loaded (473 lines)
✅ TROUBLESHOOTING.md loaded (159 lines)
✅ FEATURE_PATTERNS.md loaded (9 templates)
✅ ARCHITECTURE_DECISIONS.md loaded (12 decisions)

Critical patterns understood:
✅ Route exports: dynamic='force-dynamic', runtime='nodejs'
✅ Suspense boundaries for client hooks
✅ Version requirements (Next 14.2.5, React 18.3.1, Tailwind 3.4.x)
✅ RLS policies on all tables

Step 2/5: Verifying Supabase Connection
----------------------------------------
✅ .env.local found
✅ Project ID: YOUR_SUPABASE_PROJECT_ID (correct)
✅ Testing connection... SUCCESS
✅ Database accessible, RLS enabled

Step 3/5: Checking Dependencies
----------------------------------------
✅ Next.js: 14.2.5 (correct)
✅ React: 18.3.1 (correct)
✅ Tailwind: 3.4.10 (correct)
✅ All packages up to date

Step 4/5: Starting Dev Server
----------------------------------------
📁 Working directory: projects/homeschool-coop
🔧 Starting Next.js on port 3456...
✅ Server running (background)

Step 5/5: Session Ready!
----------------------------------------
🌐 App URL: http://localhost:3456
📧 Mailpit: http://127.0.0.1:54324

Available Commands:
- /build-feature - Start new feature
- /review-feature - Review code
- /finalize-feature - Prep for deploy
- /update-project-context - Update docs
- /codex-orchestrator - Put Codex in orchestration mode for complex efforts

✅ SESSION INITIALIZED - All systems ready!
What would you like to build today?
```

---

## Error Handling

### If Supabase Connection Fails
```
❌ Supabase connection failed!

Check your .env.local:
- NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-key]
- SUPABASE_SERVICE_ROLE_KEY=[your-service-key]

Fix the connection and run /start-homeschool-app again.
```

### If Wrong Versions Detected
```
⚠️ Version Mismatches Found:

- Next.js: 15.0.1 (should be 14.2.5)
  Run: npm install next@14.2.5

- Tailwind: 4.0.0-alpha (should be 3.4.x)
  Run: npm install tailwindcss@^3.4.0

Fix versions before continuing!
```

---

## What This Solves

1. **One Command** - No need to remember multiple steps
2. **Context Always Loaded** - Never forgets patterns
3. **Environment Verified** - Catches issues early
4. **Dev Server Running** - Ready to test immediately
5. **Complete Setup** - Everything needed for development

---

## Implementation Details

The command will execute these in sequence:
```typescript
// 1. Load context
await runSlashCommand('/check-project');

// 2. Verify Supabase
const envVars = await checkEnvFile();
const connected = await testSupabaseConnection();

// 3. Check versions
const versions = await verifyPackageVersions();

// 4. Start server
await exec('cd projects/homeschool-coop && npm run dev', {
  background: true
});

// 5. Report status
return formatCompleteStatus(context, connection, versions, server);
```

---

## When to Use

### ✅ ALWAYS run when:
- Starting new Claude session
- Beginning work on homeschool-coop
- After system restart
- After pulling new changes

### 🔄 Re-run if:
- Context seems lost
- Connection issues
- Server crashes

---

## Notes

- Takes ~10-15 seconds for full setup
- Server runs in background
- Can continue working while server starts
- Ctrl+C in terminal stops server
- All verification happens automatically
