# Check Feature Context

**Command**: `/check-feature <feature-name>`

**Description**: Loads project context and finds relevant patterns, similar features, and applicable blueprints for a specific feature.

---

## What it does

1. **Runs /check-project first** (if not already loaded)

2. **Searches for similar features:**
   - Existing implementations
   - Related patterns
   - Applicable blueprints
   - Relevant tests

3. **Identifies requirements:**
   - Data models needed
   - API endpoints required
   - UI components to create
   - Security considerations

4. **Suggests approach:**
   - Which pattern to follow
   - Potential gotchas
   - Testing strategy
   - Complexity estimate

---

## Usage

### Basic Feature Check
```
/check-feature attendance
/check-feature payment-processing
/check-feature user-notifications
```

### With More Context
```
/check-feature "attendance tracking for classes"
/check-feature "stripe payment integration"
```

---

## Example Output

**User says:** `/check-feature attendance`

**Claude responds:**
```
📚 Checking context for: Attendance Feature

──────────────────────────────────────
🔍 SIMILAR FEATURES FOUND
──────────────────────────────────────

1. Enrollment System (moderate complexity)
   - Location: src/app/(app)/enrollments/
   - Pattern: List with filters
   - Has: CRUD operations, RLS policies

2. Class Management (complex)
   - Location: src/app/(app)/classes/
   - Pattern: Dashboard page with forms
   - Has: Teacher assignment, scheduling

──────────────────────────────────────
📋 APPLICABLE PATTERNS
──────────────────────────────────────

From FEATURE_PATTERNS.md:
✓ "Dashboard Page" pattern (exact match)
✓ "Form with Validation" pattern
✓ "List with Filters" pattern
✓ "Real-time Updates" pattern (optional)

Suggested Implementation:
1. Use Dashboard Page pattern for main view
2. Add attendance form using Form pattern
3. Show history using List pattern

──────────────────────────────────────
🏗️ RELEVANT BLUEPRINTS
──────────────────────────────────────

None specific to attendance, but consider:
- CRUD Blueprint (for basic operations)
- Real-time Blueprint (for live updates)

──────────────────────────────────────
📊 FEATURE REQUIREMENTS
──────────────────────────────────────

Data Model:
- Table: attendance (already exists!)
  - class_id, student_id, date
  - status (present/absent/excused)
  - recorded_by, notes

Files to Create:
- src/app/(app)/attendance/page.tsx
- src/app/api/attendance/route.ts
- src/components/attendance/AttendanceForm.tsx
- src/components/attendance/AttendanceList.tsx

Required Exports:
- Page: dynamic = 'force-dynamic', runtime = 'nodejs'
- API: Same exports required
- Components: Wrap hooks in Suspense

Security:
- RLS policy exists (teachers can mark)
- Validate teacher has permission
- Audit trail for changes

──────────────────────────────────────
⚠️ GOTCHAS TO AVOID
──────────────────────────────────────

From TROUBLESHOOTING.md:
- Remember Suspense for useSearchParams
- Add dynamic exports to all routes
- Use Zod for validation

From Similar Features:
- Date handling: use ISO strings
- Timezone: store in UTC
- Permissions: check role === 'TEACHER'

──────────────────────────────────────
🎯 RECOMMENDED APPROACH
──────────────────────────────────────

Complexity: Moderate (2-3 days)

Step 1: Create attendance page
- Copy dashboard page pattern
- Add teacher permission check

Step 2: Build attendance form
- Date picker for session
- Student list from enrollments
- Quick mark all present button

Step 3: Add API endpoint
- POST /api/attendance
- Validate teacher permission
- Bulk update support

Step 4: Add history view
- Filter by date range
- Export to CSV option
- Show statistics

Testing Strategy:
- Integration test for marking attendance
- Unit test for permission checks
- E2E test for full workflow

──────────────────────────────────────
📝 READY TO BUILD
──────────────────────────────────────

Next steps:
1. Create brief: /build-feature
2. Or start directly with pattern from FEATURE_PATTERNS.md
3. Remember: All routes need dynamic/nodejs exports!

Similar feature for reference:
→ Check enrollments implementation at src/app/(app)/enrollments/
```

---

## Pattern Matching

The command looks for patterns in:

### 1. Feature Name Analysis
```
"attendance" → Matches: tracking, recording, CRUD
"payment" → Matches: Stripe, transactions, webhooks
"notification" → Matches: email, real-time, queues
```

### 2. Existing Code Search
```
- Searches for similar component names
- Looks for related API endpoints
- Finds comparable data models
```

### 3. Blueprint Matching
```
- CRUD operations → CRUD Blueprint
- Real-time needs → WebSocket Blueprint
- File handling → Upload Blueprint
```

---

## Integration with Build Flow

```
/check-feature attendance
→ Understand requirements
→ See similar implementations
→ /build-feature (if ready)
→ Implementation with patterns
```

---

## Advanced Usage

### Compare Multiple Features
```
/check-feature "attendance vs gradebook"

Shows:
- Shared patterns
- Common components
- Reusable code
```

### Check Feasibility
```
/check-feature "video streaming"

Warns if:
- No similar patterns exist
- Requires new dependencies
- Complex architecture needed
```

---

## Feature Complexity Estimation

Based on patterns found:

| Complexity | Indicators | Time Estimate |
|------------|------------|---------------|
| Simple | Direct pattern match, no new deps | Hours |
| Moderate | Combines 2-3 patterns | 2-3 days |
| Complex | New patterns needed | 1 week |
| Critical | Architecture changes | 2+ weeks |

---

## Success Indicators

The command helps avoid:
- ❌ Reinventing existing patterns
- ❌ Missing security requirements
- ❌ Forgetting required exports
- ❌ Creating duplicate functionality
- ❌ Using wrong patterns

Instead ensuring:
- ✅ Reuses existing code
- ✅ Follows established patterns
- ✅ Includes all requirements
- ✅ Estimates accurately
- ✅ Tests appropriately

---

## Notes

- Always runs /check-project first
- Searches both framework and project
- Learn from existing code
- Suggests simplest approach
- Links to exact pattern locations