# Check Project Context

**Command**: `/check-project`

**Description**: Loads and verifies understanding of project patterns, conventions, and requirements. Essential first step before any feature work.

---

## What it does

1. **Runs health check first (if dev server detected):**
   - Validates assets are being served
   - Ensures no corrupted builds
   - Prevents debugging wrong issues

2. **Loads framework documentation:**
   - `/.claude/PROJECT_CONTEXT.md` - Development patterns
   - `/.claude/TROUBLESHOOTING.md` - Known issues
   - `/.claude/ARCHITECTURE_DECISIONS.md` - Key decisions
   - `/.claude/FEATURE_PATTERNS.md` - Implementation templates
   - `/.clauderc` - Configuration

3. **Loads project-specific context:**
   - `./PROJECT_SPECIFIC.md` (if exists in current project)
   - Project's `.env.example` for requirements
   - Recent completed work in `projects/[project]/docs/completed/`

4. **Reports understanding of:**
   - Required exports (`dynamic`, `runtime`)
   - Version requirements (no alpha/beta)
   - File structure patterns
   - Security requirements
   - Common pitfalls to avoid

5. **Sets context for:**
   - Which patterns to follow
   - What NOT to use
   - Deployment requirements
   - Testing strategy

---

## Usage

### Basic Check
```
/check-project
```

### With Specific Focus
```
/check-project deployment
/check-project patterns
/check-project versions
```

---

## Example Output

**User says:** `/check-project`

**Claude responds:**
```
📚 Loading Dev Framework Context...

🏥 Quick Health Check...
✅ Dev server: Running on port 3456
✅ Assets: CSS/JS serving correctly
✅ No issues detected

✅ Framework Documentation Loaded:
   - PROJECT_CONTEXT.md (247 patterns/rules)
   - TROUBLESHOOTING.md (42 known issues)
   - ARCHITECTURE_DECISIONS.md (12 ADRs)
   - FEATURE_PATTERNS.md (9 templates)

✅ Project-Specific Context:
   - Project: homeschool-coop
   - Type: Multi-tenant SaaS
   - Port: 3456
   - Supabase ID: YOUR_SUPABASE_PROJECT_ID

📋 Key Requirements Understood:

MUST HAVE on all routes:
   export const dynamic = 'force-dynamic';
   export const runtime = 'nodejs';

MUST WRAP client hooks:
   <Suspense fallback={<Loading />}>
     <ComponentWithHooks />
   </Suspense>

VERSION REQUIREMENTS:
   ✅ Next.js: 14.2.5 (NOT 15)
   ✅ React: 18.3.1 (NOT 19)
   ✅ Tailwind: 3.4.x (NOT v4 alpha)
   ✅ @types/react: 18.x (NOT 19.x)

PATTERNS TO FOLLOW:
   - Server Components by default
   - Client Components only for interactivity
   - Zod validation schemas
   - RLS policies on all tables
   - Error boundaries on all pages

KNOWN ISSUES:
   - Supabase AAL tracking bug → Custom workaround
   - Vercel static generation → Use dynamic exports
   - React 19 types → Stay on 18.x

🎯 Context loaded and ready for feature development!

Next: Use /build-feature or describe what you need to build.
```

---

## When to Use

### ✅ Always run when:
- Starting a new AI session
- Beginning any feature work
- Switching between projects
- After long breaks
- Before deployment work

### 🔄 Re-run when:
- Context seems lost
- AI suggests wrong patterns
- Errors indicate missing knowledge

---

## Integration with Other Commands

### Automatic Invocation
Other commands automatically run `/check-project` if context not loaded:
- `/build-feature` - Checks context first
- `/review-feature` - Ensures patterns known
- `/finalize-feature` - Verifies requirements

### Manual Override
Force fresh context load:
```
/check-project --force
```

---

## Context Hierarchy

The command loads context in this order:
1. **Framework Level** (applies to all projects)
   - `/.claude/*` files
   - `/.claude/completed/` (platform-wide achievements)
   - Common patterns and rules

2. **Project Level** (specific overrides)
   - `projects/[project]/PROJECT_SPECIFIC.md`
   - `projects/[project]/docs/completed/` (project achievements)
   - Project environment variables
   - Custom configurations

3. **Recent Work** (current state)
   - Latest completed documents
   - Recent architecture decisions

---

## Verification Questions

After loading, the command verifies understanding by checking:

1. **Can identify correct patterns?**
   - "What exports does a dashboard page need?"
   - Expected: `dynamic = 'force-dynamic'`, `runtime = 'nodejs'`

2. **Knows what to avoid?**
   - "Should we upgrade to Tailwind v4?"
   - Expected: "No, v4 is alpha. Use v3.4.x"

3. **Understands project specifics?**
   - "What port does dev server use?"
   - Expected: "3456" (for homeschool-coop)

---

## Troubleshooting

**"Context not found"**
- Ensure you're in dev-framework directory
- Check `/.claude/` folder exists
- Run from project root

**"Project specific not found"**
- Normal if no PROJECT_SPECIFIC.md
- Framework context still loads
- Create one if needed

**"Conflicting information"**
- Project level overrides framework
- Recent decisions override old
- Use `/sync-documentation` to resolve

---

## Related Commands

- `/health-check` - Validate environment health
- `/update-project-context` - Update docs after discoveries
- `/check-feature <name>` - Feature-specific context check
- `/sync-documentation` - Resolve conflicts

---

## Success Indicators

You'll know it's working when AI:
- ✅ Uses correct exports on routes
- ✅ Wraps hooks in Suspense
- ✅ Avoids alpha/beta packages
- ✅ Follows established patterns
- ✅ References known issues correctly

---

## Notes

- Context persists for entire session
- Re-run if behavior seems off
- Updates accumulate over time
- Project-specific overrides framework