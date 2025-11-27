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

## Related Commands

- `/health-check` - Validate environment health
- `/update-project-context` - Update docs after discoveries
- `/check-feature <name>` - Feature-specific context check
- `/sync-documentation` - Resolve conflicts
