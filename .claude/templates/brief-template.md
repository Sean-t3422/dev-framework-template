# Brief Template

Use this template when decomposing an Epic into CRUD-sized briefs.

---

## Brief Header

```markdown
# Brief [EPIC]-[Phase].[Number]: [Feature Name]

**Epic**: [Parent epic name]
**Created**: [YYYY-MM-DD]
**Status**: draft | ready | in-progress | complete
```

---

## Template

```markdown
# Brief [EPIC]-[X].[Y]: [Feature Name]

**Epic**: [Parent epic name]
**Created**: [YYYY-MM-DD]
**Status**: draft

---

## Existing Assets (from exploration)

### Found in Our Codebase
- Components: [list or "none found"]
- Patterns: [list or "none found"]
- Similar features: [list or "none found"]

### External Libraries to Use
- shadcn/ui: [components to use]
- Radix UI: [primitives to use]
- Other: [any other libraries]

### Build Custom
- [Only list what MUST be built new]

---

## Requirements

**Who**: [user type]
**What**: [action they want to perform]
**Why**: [benefit or reason]

---

## Acceptance Criteria

- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]
- [ ] [Error states handled appropriately]
- [ ] [Loading states implemented]

---

## Technical Scope

### Files to Create
| File | Purpose |
|------|---------|
| `src/path/file.ts` | [description] |

### Files to Modify
| File | Changes |
|------|---------|
| `src/path/existing.ts` | [what changes] |

### Database Changes
- [ ] Migration needed: [yes/no]
- [ ] Tables affected: [list]
- [ ] RLS policies needed: [yes/no]

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/...` | [description] |

---

## Dependencies

### Blocked By
- [ ] [EPIC]-[X].[Y-1]: [Previous brief if any]

### Blocks
- [ ] [EPIC]-[X].[Y+1]: [Next brief if any]

---

## Brief Metadata

| Attribute | Value |
|-----------|-------|
| **Complexity** | xs / s / m |
| **Has UI** | yes / no |
| **Has Database** | yes / no |
| **Has API** | yes / no |
| **Design Needed** | none / minimal / full |
| **Tests Required** | unit / integration / e2e / all |
```

---

## CRUD Brief Patterns

When decomposing an Epic, use these standard brief types:

### Create Brief (X.1)
```markdown
# Brief [EPIC]-X.1: Create [Entity]

## Requirements
**Who**: [user]
**What**: Create a new [entity]
**Why**: [reason]

## Typical Scope
- Form component
- Validation logic
- API POST endpoint
- Database INSERT
- Success/error handling
```

### Read/View Brief (X.2)
```markdown
# Brief [EPIC]-X.2: View [Entity]

## Requirements
**Who**: [user]
**What**: View [entity] details
**Why**: [reason]

## Typical Scope
- Detail view component
- API GET endpoint
- Database SELECT
- Loading states
```

### List Brief (X.3)
```markdown
# Brief [EPIC]-X.3: List [Entities]

## Requirements
**Who**: [user]
**What**: See a list of [entities]
**Why**: [reason]

## Typical Scope
- List/table component
- Pagination
- API GET (list) endpoint
- Empty state handling
```

### Update Brief (X.4)
```markdown
# Brief [EPIC]-X.4: Edit [Entity]

## Requirements
**Who**: [user]
**What**: Edit an existing [entity]
**Why**: [reason]

## Typical Scope
- Edit form (often reuses Create form)
- API PUT/PATCH endpoint
- Database UPDATE
- Optimistic updates (optional)
```

### Delete Brief (X.5)
```markdown
# Brief [EPIC]-X.5: Delete [Entity]

## Requirements
**Who**: [user]
**What**: Delete/archive [entity]
**Why**: [reason]

## Typical Scope
- Confirmation dialog
- API DELETE endpoint
- Soft delete vs hard delete
- Cascade handling
```

### Search/Filter Brief (X.6)
```markdown
# Brief [EPIC]-X.6: Search [Entities]

## Requirements
**Who**: [user]
**What**: Search/filter [entities]
**Why**: [reason]

## Typical Scope
- Search input component
- Filter controls
- API query parameters
- Debounced search
```

---

## Complexity Sizing Guide

| Size | Scope | Examples |
|------|-------|----------|
| **xs** | 1-2 files, no DB | Fix typo, update copy, add class |
| **s** | 2-4 files, simple logic | Add form field, new utility function |
| **m** | 4-8 files, some complexity | New component with API, simple CRUD |
| **l** | 8-15 files | Should be an Epic - decompose into smaller briefs |
| **xl** | 15+ files | Should be an Epic - decompose into smaller briefs |

**Rule of thumb**: If a Brief feels like a large, decompose it into an Epic.

---

## Example: User Profile Epic

```
PROFILE-1.1: View Profile (Read) - s
PROFILE-1.2: Edit Profile (Update) - m
PROFILE-1.3: Upload Avatar (Create) - s
PROFILE-1.4: Delete Avatar (Delete) - xs
PROFILE-1.5: Change Password (Update) - m
PROFILE-1.6: Delete Account (Delete) - m
```

Each brief gets its own brief → spec → build cycle with Codex review.
