# Initialize Session

**Command**: `/init`

**Description**: ONE COMMAND to run at the start of every new AI session. Loads all framework context, verifies understanding, and reports ready status.

---

## What it does

1. **Loads ALL documentation automatically:**
   - PROJECT_CONTEXT.md
   - TROUBLESHOOTING.md
   - ARCHITECTURE_DECISIONS.md
   - FEATURE_PATTERNS.md
   - Latest completed work
   - Project-specific overrides

2. **Verifies critical understanding:**
   - ✅ Required exports on routes
   - ✅ Suspense boundaries for hooks
   - ✅ Version requirements
   - ✅ RLS patterns
   - ✅ No alpha/beta packages

3. **Reports clear status:**
   ```
   ✅ Framework context loaded
   ✅ Project: homeschool-coop
   ✅ Patterns understood: 12/12
   ✅ Ready for development
   ```

---

## Usage

### Every New Session
```
/init
```

That's it. One command, everything loaded.

---

## Example Output

**User says:** `/init`

**Claude responds:**
```
🚀 Initializing Dev Framework Session...

📚 Loading Documentation:
   ✅ PROJECT_CONTEXT.md - 473 lines loaded
   ✅ TROUBLESHOOTING.md - 159 lines loaded
   ✅ ARCHITECTURE_DECISIONS.md - 12 decisions
   ✅ FEATURE_PATTERNS.md - 9 templates
   ✅ Latest work: onboarding-phases-4-5-2025-10-14.md

🏗️ Project Context:
   ✅ Project: homeschool-coop
   ✅ Type: Multi-tenant SaaS
   ✅ Port: 3456
   ✅ Database: YOUR_SUPABASE_PROJECT_ID

✅ Critical Patterns Understood:

1. Route Exports:
   export const dynamic = 'force-dynamic';
   export const runtime = 'nodejs';

2. Client Component Pattern:
   <Suspense fallback={<Loading />}>
     <ComponentWithHooks />
   </Suspense>

3. Version Requirements:
   - Next.js: 14.2.5 ✅ (NOT 15)
   - React: 18.3.1 ✅ (NOT 19)
   - Tailwind: 3.4.x ✅ (NOT v4)

4. Supabase Patterns:
   - Server: createClient from '@/lib/supabase/server'
   - Client: createClient from '@/lib/supabase/client'
   - Always use RLS policies

5. What NOT to use:
   ❌ Alpha/beta packages
   ❌ Edge runtime with Supabase
   ❌ @supabase/auth-helpers-nextjs
   ❌ React 19 types

📋 Available Commands:
   - /build-feature - Start new feature
   - /review-feature - Review implementation
   - /finalize-feature - Prep for deployment
   - /update-project-context - Update docs

🎯 SESSION READY - All patterns loaded and verified!

What would you like to build today?
```

---

## Why This Works Better

1. **YOU control when context loads** - Not hoping AI remembers
2. **One command** - Simple, memorable, fast
3. **Clear verification** - You see what was loaded
4. **No ambiguity** - AI can't skip or forget
5. **Consistent** - Same initialization every time

---

## Implementation

The command will:
```typescript
// 1. Load all framework docs
const docs = [
  '.claude/PROJECT_CONTEXT.md',
  '.claude/TROUBLESHOOTING.md',
  '.claude/ARCHITECTURE_DECISIONS.md',
  '.claude/FEATURE_PATTERNS.md'
];

// 2. Load project specific if exists
if (exists('./PROJECT_SPECIFIC.md')) {
  loadProjectSpecific();
}

// 3. Verify understanding with checklist
const verified = [
  'Route exports understood',
  'Suspense patterns understood',
  'Version requirements understood',
  'RLS patterns understood',
  'Anti-patterns understood'
];

// 4. Report status
return formatStatusReport(loaded, verified);
```

---

## When to Use

### ✅ ALWAYS run when:
- Starting new Claude session
- After context seems lost
- Before any feature work
- After switching projects

### 🔄 Re-run if:
- AI suggests wrong patterns
- AI uses alpha/beta packages
- AI forgets requirements

---

## Success Indicators

After running `/init`:
- AI mentions required exports
- AI wraps hooks in Suspense
- AI uses stable versions only
- AI follows established patterns
- AI references documentation

---

## Notes

- Takes ~5 seconds to run
- Worth it for consistency
- Prevents hours of debugging
- One command vs hoping for automation