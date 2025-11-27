# Sync Documentation

**Command**: `/sync-documentation`

**Description**: Reconciles conflicts, removes duplicates, and ensures documentation consistency across framework and project levels.

---

## What it does

1. **Scans all documentation:**
   - Framework level (/.claude/*)
   - Project level (./PROJECT_SPECIFIC.md)
   - Archived docs
   - Command files

2. **Identifies issues:**
   - Duplicate information
   - Conflicting instructions
   - Outdated entries
   - Missing cross-references

3. **Proposes fixes:**
   - Consolidate duplicates
   - Resolve conflicts
   - Update stale content
   - Add missing links

4. **Maintains hierarchy:**
   - Framework = universal rules
   - Project = specific overrides
   - Recent = supersedes old

---

## Usage

### Full Sync
```
/sync-documentation
```

### Check Specific Area
```
/sync-documentation --check versions
/sync-documentation --check patterns
/sync-documentation --check errors
```

### Dry Run (Preview Only)
```
/sync-documentation --dry-run
```

---

## Example Output

**User says:** `/sync-documentation`

**Claude responds:**
```
🔄 Syncing Dev Framework Documentation...

Scanning documentation structure...
- Framework docs: 6 files
- Project docs: 1 file
- Command docs: 8 files
- Archive docs: 7 files

──────────────────────────────────────
⚠️ ISSUES FOUND
──────────────────────────────────────

1. DUPLICATE: Vercel deployment requirements
   Found in:
   - PROJECT_CONTEXT.md (line 145)
   - TROUBLESHOOTING.md (line 89)
   - FIX_DEPLOYMENT_ISSUES.md (line 23)

   Action: Consolidate to single source

2. CONFLICT: Tailwind CSS version
   - .clauderc says: "3.4.x"
   - Old brief says: "latest"

   Action: Update to consistent "3.4.x"

3. OUTDATED: React 19 reference
   - ARCHITECTURE_DECISIONS.md mentions considering React 19
   - Should note React 19 doesn't exist

   Action: Update with current status

4. MISSING LINK: TypeScript fix
   - TROUBLESHOOTING.md references fix
   - No link to actual solution

   Action: Add link to type definition file

──────────────────────────────────────
✅ PROPOSED FIXES
──────────────────────────────────────

1. Consolidate Vercel requirements:
   → Keep in PROJECT_CONTEXT.md (primary)
   → Reference from other files
   → Remove duplicates

2. Standardize version requirements:
   → Update all to "3.4.x" for Tailwind
   → Add "NOT v4" warning consistently

3. Update outdated references:
   → Mark React 19 as non-existent
   → Update decision record

4. Add cross-references:
   - TROUBLESHOOTING.md → Link to fixes
   - PROJECT_CONTEXT.md → Link to ADRs
   - Commands → Link to patterns

──────────────────────────────────────
📊 HEALTH METRICS
──────────────────────────────────────

Documentation Health: 85% ↑
- Completeness: 90%
- Consistency: 78%
- Currency: 87%
- Cross-links: 80%

After sync: ~95% expected

──────────────────────────────────────

Proceed with sync? [y/n/preview]
```

**User says:** `y`

**Claude:**
```
✅ Documentation synchronized!

Changes made:
- Consolidated 3 duplicate sections
- Resolved 1 version conflict
- Updated 2 outdated references
- Added 5 cross-reference links
- Removed 0 obsolete entries

Documentation structure:
📁 Framework (/.claude/)
  ✓ PROJECT_CONTEXT.md - Primary patterns
  ✓ TROUBLESHOOTING.md - Error reference
  ✓ ARCHITECTURE_DECISIONS.md - ADRs
  ✓ FEATURE_PATTERNS.md - Templates

📁 Project (homeschool-coop)
  ✓ PROJECT_SPECIFIC.md - Overrides only

Health improved: 85% → 94%

✨ Documentation is now consistent and well-linked!
```

---

## Sync Rules

### Hierarchy Rules
1. **Project overrides Framework**
   - If conflict, project wins
   - Document the override

2. **Recent overrides Old**
   - Newer dates take precedence
   - Archive old versions

3. **Specific overrides General**
   - Exact error > general pattern
   - Detailed > abstract

### Consolidation Rules
1. **Keep in most logical location**
   - Errors → TROUBLESHOOTING.md
   - Patterns → FEATURE_PATTERNS.md
   - Decisions → ARCHITECTURE_DECISIONS.md

2. **Reference from others**
   - Don't duplicate, link instead
   - Use "See: [file]" format

3. **Maintain single source of truth**
   - One authoritative location
   - Others reference it

---

## Conflict Resolution

When conflicts found:

```
CONFLICT: Next.js version requirement

Location A: "14.2.5 or higher"
Location B: "14.2.5 exactly"
Location C: "14.x"

Resolution options:
1. Use most restrictive: "14.2.5 exactly"
2. Use most recent: (check dates)
3. Manual selection
4. Keep all with clarification

Choose [1-4]:
```

---

## Health Metrics

The sync command measures:

### Completeness (0-100%)
- All patterns documented?
- All errors have solutions?
- All decisions recorded?

### Consistency (0-100%)
- Same information everywhere?
- No contradictions?
- Clear hierarchy?

### Currency (0-100%)
- Dates on entries?
- Old stuff marked/removed?
- Recent updates included?

### Cross-links (0-100%)
- Related docs linked?
- References work?
- No orphaned docs?

---

## Automatic Triggers

Sync suggestions appear when:
- Adding new documentation
- After major updates
- Conflicts detected
- Monthly maintenance

---

## Manual Maintenance

### Archive Old Content
```
/sync-documentation --archive-before 2024-01-01
```

### Remove Resolved Issues
```
/sync-documentation --remove-resolved
```

### Update All Dates
```
/sync-documentation --update-timestamps
```

---

## Integration

Works with other commands:
- `/update-project-context` → May trigger sync
- `/check-project` → Uses synced docs
- `/check-feature` → Relies on consistency

---

## Best Practices

Run sync when:
- ✅ After major documentation updates
- ✅ Before starting new project
- ✅ Monthly maintenance
- ✅ When confusion arises
- ✅ After team changes

---

## Success Indicators

Well-synced documentation has:
- ✅ No duplicate information
- ✅ Clear hierarchy
- ✅ Consistent versions
- ✅ Working cross-links
- ✅ Updated timestamps
- ✅ Health score > 90%

---

## Notes

- Non-destructive by default
- Creates backup before changes
- Can be reverted if needed
- Improves over time
- Essential for large projects