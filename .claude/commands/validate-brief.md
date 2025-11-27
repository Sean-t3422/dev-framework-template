# Validate Brief - Check if Brief is Ready for Orchestration

**Command**: `/validate-brief [brief-path]`

**Description**: Run Codex validation on a brief to check if it's ready for automated orchestration. Does NOT start the workflow - just validates.

---

## Usage

```
/validate-brief briefs/active/my-feature.md
```

---

## What it checks

Codex reviews the brief for:

1. **Clear requirements** - Are user needs well-defined?
2. **Scope boundaries** - What's in/out?
3. **Security considerations** - Auth, RLS, data isolation?
4. **Success criteria** - How do we know it's done?
5. **Technical approach** - Is implementation path clear?

---

## Output

### If ready

```
✅ READY FOR ORCHESTRATION

Brief is complete and ready for automated orchestration.
Run: /continue-brief briefs/active/my-feature.md
```

### If not ready

```
⚠️ NEEDS MORE DETAIL

Codex found gaps in the brief:
- Missing security requirements (RLS policies not defined)
- Success criteria unclear
- No scope boundaries specified

Recommendation: Update the brief to address these issues,
then run /validate-brief again.
```

---

## When to use

- **Before handoff**: Validate your brainstormed brief before `/continue-brief`
- **Quick check**: Make sure your brief meets orchestrator requirements
- **Iterative refinement**: Validate → Fix → Validate until ready

---

**Last Updated**: 2025-11-26
