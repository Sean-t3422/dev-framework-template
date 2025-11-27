# Update Project Context

**Command**: `/update-project-context`

**Description**: Updates framework documentation with newly discovered patterns, issues, and solutions. Ensures knowledge persists across sessions.

---

## What it does

1. **Analyzes recent work:**
   - Errors encountered and fixed
   - New patterns discovered
   - Decisions made
   - Workarounds implemented
   - Milestones achieved

2. **Determines scope and location:**
   - **Framework-level** (benefits all projects):
     - Error patterns → `/.claude/TROUBLESHOOTING.md`
     - New patterns → `/.claude/FEATURE_PATTERNS.md`
     - Architecture changes → `/.claude/ARCHITECTURE_DECISIONS.md`
     - Common gotchas → `/.claude/PROJECT_CONTEXT.md`
     - Version issues → `/.clauderc`
     - Platform achievements → `/.claude/completed/`

   - **Project-level** (specific to current project):
     - Project milestones → `projects/[project]/docs/completed/`
     - Project-specific configs → `PROJECT_SPECIFIC.md`
     - Project workarounds → Project's troubleshooting

3. **Updates appropriate sections:**
   - Adds new entries with dates
   - Links related issues
   - Preserves context
   - Removes outdated info
   - Creates completion documents for milestones

4. **Commits changes:**
   - Clear commit message
   - References original issue
   - Maintains history

---

## Usage

### After Fixing an Issue
```
/update-project-context
```

### With Specific Context
```
/update-project-context "Fixed Tailwind v4 breaking CSS"
/update-project-context "Discovered new Vercel requirement"
```

### Manual Specification
```
/update-project-context --file TROUBLESHOOTING.md --section "Build Errors"
```

---

## Example Workflow

### Scenario: Just Fixed Deployment Issue

**User says:** `/update-project-context`

**Claude analyzes conversation and responds:**
```
📝 Analyzing recent work for documentation updates...

Found issues and solutions to document:

1. ❌ ISSUE: "Property 'aal' does not exist on type 'Session'"
   ✅ SOLUTION: Created type extensions in supabase-session.d.ts
   📁 UPDATE: TROUBLESHOOTING.md → TypeScript Errors

2. ❌ ISSUE: "useSearchParams() needs Suspense boundary"
   ✅ SOLUTION: Wrap all client hooks in Suspense
   📁 UPDATE: PROJECT_CONTEXT.md → Component Patterns

3. ❌ ISSUE: Tailwind v4 alpha broke styles
   ✅ SOLUTION: Downgrade to v3.4.x
   📁 UPDATE: ARCHITECTURE_DECISIONS.md → New ADR
   📁 UPDATE: .clauderc → Version warnings

Proposed updates:

──────────────────────────────────────
📄 TROUBLESHOOTING.md
──────────────────────────────────────
+ ### Error: "Property 'aal' does not exist on type 'Session'"
+ **Added:** October 15, 2025
+ **Cause:** Supabase types don't include custom session properties
+ **Solution:** Create src/types/supabase-session.d.ts with extensions
+ **Related:** FIX_DEPLOYMENT_ISSUES.md Day 1

──────────────────────────────────────
📄 PROJECT_CONTEXT.md
──────────────────────────────────────
In "Component Patterns" section:
+ // Client components with hooks MUST have Suspense
+ <Suspense fallback={<Loading />}>
+   <ComponentWithUseSearchParams />
+ </Suspense>

──────────────────────────────────────
📄 ARCHITECTURE_DECISIONS.md
──────────────────────────────────────
+ ## ADR-013: Tailwind CSS v3 Only
+ **Date:** October 15, 2025
+ **Status:** Accepted (after v4 crisis)
+ ### Decision
+ Use Tailwind CSS v3.4.x exclusively
+ ### Context
+ Attempted v4 alpha, caused production failures
+ ### Consequences
+ ✅ Stable styling system
+ ❌ Missing v4 performance improvements

──────────────────────────────────────
📄 .clauderc
──────────────────────────────────────
+ ## Version Requirements (CRITICAL)
+ - Tailwind CSS: MUST be 3.4.x (v4 is broken alpha)
+ - @types/react: MUST be 18.x (19 doesn't exist)

Proceed with updates? [y/n]
```

**User says:** `y`

**Claude:**
```
✅ Documentation updated successfully!

Updated files:
- TROUBLESHOOTING.md: Added 1 error solution
- PROJECT_CONTEXT.md: Added 1 pattern requirement
- ARCHITECTURE_DECISIONS.md: Added ADR-013
- .clauderc: Added 2 version warnings

Committed with message:
"docs: Update framework context with Tailwind v4 and Suspense discoveries"

📚 Knowledge captured for future sessions!

Next time any AI encounters these issues, they'll find the solutions immediately.
```

---

## Smart Detection

The command intelligently categorizes updates:

### Completed Milestones → docs/completed/
- Deployment successes
- Feature completions
- Major bug fixes resolved
- Performance improvements
- Migration completions

Creates timestamped completion document with:
- Problem statement
- Solution implemented
- Lessons learned
- Related files changed
- Testing verification

### Error Messages → TROUBLESHOOTING.md
- Exact error text
- Root cause
- Solution steps
- Prevention tips

### Pattern Discoveries → FEATURE_PATTERNS.md
- New implementation patterns
- Better approaches found
- Common structures

### Architecture Changes → ARCHITECTURE_DECISIONS.md
- New ADRs
- Revised decisions
- Lessons learned

### Version Issues → .clauderc
- Package conflicts
- Version requirements
- Compatibility notes

### General Guidelines → PROJECT_CONTEXT.md
- Best practices
- What to avoid
- Security requirements

---

## Update Triggers

### Automatic Prompts
The system prompts for updates after:
- Deployment failures resolved
- Complex debugging sessions
- New pattern discoveries
- Architecture decisions
- Version conflicts resolved

### Manual Triggers
You can also manually trigger:
```
# After any significant discovery
/update-project-context

# After completing a feature
/finalize-feature → "Document any new patterns? [y/n]"

# After code review
/review-feature → "Document these gotchas? [y/n]"
```

---

## Conflict Resolution

When updates conflict with existing docs:

```
⚠️ Conflict detected in ARCHITECTURE_DECISIONS.md:

Existing: "Use Tailwind v4 for performance"
New: "Use Tailwind v3.4.x only"

Resolution options:
1. Replace old with new (recommended)
2. Mark old as deprecated
3. Keep both with clarification
4. Skip this update

Choose [1-4]:
```

---

## History Tracking

Each update includes metadata:
```markdown
### Known Issue: [Title]
- **Discovered:** October 15, 2025
- **Reported by:** Session context
- **Severity:** High/Medium/Low
- **Status:** Active/Resolved/Deprecated
- **Last Updated:** October 15, 2025
- **Solution:** [What fixed it]
- **Related:** [Links to other docs]
```

---

## Bulk Updates

For multiple discoveries:
```
/update-project-context --bulk

Review 5 items to document:
[ ] Vercel export requirements
[ ] Suspense boundary needs
[ ] Tailwind version issue
[ ] TypeScript config
[ ] Bundle size optimization

Select items to document (space to toggle, enter to confirm):
```

---

## Preventing Documentation Rot

The command also:
- Marks outdated entries
- Consolidates duplicates
- Removes resolved issues (after confirmation)
- Updates "Last reviewed" dates

Example:
```
Found potentially outdated entries:

1. "Use create-react-app" (Added: 2023)
   Status: Likely outdated
   Action: Mark as deprecated? [y/n]

2. Duplicate: "Vercel needs dynamic export"
   Found in: 3 locations
   Action: Consolidate? [y/n]
```

---

## Integration with Other Commands

### With /check-project
```
/check-project → Loads current state
[Work happens, issues fixed]
/update-project-context → Saves new knowledge
```

### With /finalize-feature
```
/finalize-feature feature-id
→ "Feature complete! Any new patterns to document?"
→ Automatically triggers update if yes
```

---

## Success Indicators

Good documentation updates have:
- ✅ Specific error messages
- ✅ Clear solutions
- ✅ Prevention strategies
- ✅ Dates and context
- ✅ Links to related issues
- ✅ Examples where helpful

---

## Notes

- Updates are incremental (add to existing)
- Preserves existing knowledge
- Creates backups before major changes
- Can be reverted if needed
- Self-healing: gets better over time