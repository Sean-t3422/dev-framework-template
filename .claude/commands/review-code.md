# Review Code

**Command**: `/review-code [file_path] [review_type]`

**Purpose**: Run security + performance code review on specified files.

---

## What This Command Does

1. Analyze the specified file(s) for:
   - Security vulnerabilities (SQL injection, XSS, CSRF, RLS issues)
   - Performance issues (N+1 queries, missing indexes, slow patterns)
   - Code quality (error handling, type safety, maintainability)

2. Return findings with severity levels and fix recommendations.

---

## Review Types

| Type | What It Checks |
|------|---------------|
| `security` | SQL injection, XSS, CSRF, RLS policies, auth bypass |
| `performance` | N+1 queries, missing indexes, slow patterns, caching |
| `security-and-performance` | Both (default, recommended) |
| `quick` | Fast scan for critical issues only |

---

## Usage Examples

```
/review-code src/app/api/students/route.ts
/review-code src/lib/payments.ts security
/review-code supabase/migrations/20240101000001_initial_schema.sql performance
```

---

## How to Execute This Review

When this command is invoked:

1. **Use Task tool with codex-reviewer agent:**

```
Task({
  subagent_type: "codex-reviewer",
  prompt: "Review [file_path] for [review_type]. Check for security vulnerabilities, performance issues, and code quality. Return findings with severity and fixes."
})
```

2. **If Codex CLI not available, run static analysis:**

```bash
node lib/code-reviewer.js --file [file_path] [review_type]
```

---

## Output Format

### Findings Report

```
CODE REVIEW RESULTS
═══════════════════════════════════════

File: [file_path]
Review Type: [type]

CRITICAL (must fix before merge):
- [issue description]
  Line: X
  Fix: [recommended fix]

HIGH (should fix):
- [issue description]
  Line: X
  Fix: [recommended fix]

MEDIUM (consider fixing):
- [issue description]

LOW (nice to have):
- [issue description]

═══════════════════════════════════════
Summary: X critical, Y high, Z medium, W low
Recommendation: [APPROVE | APPROVE_WITH_CHANGES | REJECT]
═══════════════════════════════════════
```

---

## Security Checks

### SQL Injection
- Raw SQL with string concatenation
- Unparameterized queries
- Dynamic table/column names

### XSS
- Unescaped user input in HTML
- dangerouslySetInnerHTML usage
- Missing Content-Security-Policy

### Authentication/Authorization
- Missing auth checks in API routes
- Role bypass vulnerabilities
- RLS policy gaps

### Data Exposure
- Sensitive data in logs
- PII in error messages
- Missing field filtering

---

## Performance Checks

### Database
- N+1 query patterns (loop with queries)
- Missing indexes on filtered columns
- Unbounded queries (no LIMIT)
- Full table scans

### API
- Missing caching headers
- Large payload without pagination
- Synchronous blocking operations

### React/Frontend
- Missing useMemo/useCallback
- Large re-renders
- Missing code splitting

---

## Related Commands

- `/checkpoint` - Record review approval
- `/status` - Check workflow status
- `/build-feature` - Full TDD workflow
