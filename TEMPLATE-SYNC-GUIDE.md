# Template Sync Guide

**IMPORTANT: Read this before pushing updates to the sons' template repo!**

## Overview

This repo (`dev-framework`) is Dad's working repo. The sons use a **separate template repo** (`dev-framework-template`) that contains ONLY the framework tools, not Dad's projects.

### The Setup

| Repo | Purpose | Who Uses It |
|------|---------|-------------|
| `dev-framework` | Dad's working repo (has homeschool-coop project) | Dad |
| `dev-framework-template` | Clean framework template (no projects) | Sons |

### Why Two Repos?

1. **Sons get the tools** - They can use the framework to build their own projects
2. **Sons can't change Dad's tools** - They pull FROM template, never push TO it
3. **Dad's projects stay private** - `homeschool-coop` doesn't go to template
4. **Updates flow one way** - Dad → Template → Sons

---

## Git Remote Setup

```bash
# Dad's repo has these remotes:
origin    → https://github.com/Sean-t3422/dev-framework.git        # Dad's main repo
template  → https://github.com/Sean-t3422/dev-framework-template.git  # Sons' template
```

To verify:
```bash
git remote -v
```

If `template` remote is missing:
```bash
git remote add template https://github.com/Sean-t3422/dev-framework-template.git
```

---

## What Goes to Template (Framework Files)

**INCLUDE these in template:**
```
.claude/                    # Framework config, commands, agents
agents/                     # JavaScript orchestration agents
lib/                        # Library code (spec-parser, state-manager, etc.)
testing-framework/          # Test infrastructure (codex-reviewer, generators)
utils/                      # Utilities (complexity-detector, etc.)
package.json                # Dependencies
.gitignore                  # Git ignore rules
README.md                   # Framework README
SETUP.md                    # Setup instructions
GETTING-UPDATES.md          # How sons get updates
SONS-SETUP-GUIDE.md         # Full setup guide for sons
AGENTS.md                   # Agent documentation
QUICK_START.md              # Quick start guide
```

**NEVER include in template:**
```
projects/homeschool-coop/   # Dad's specific project
projects/hscoophq-marketing/ # Dad's marketing site
briefs/active/*.json        # Active brief files
specs/active/*.json         # Active spec files
blockers/                   # Session-specific blockers
evidence/                   # Session-specific evidence
.dev-framework/plans/       # Session plan files
firebase-debug.log          # Debug files
archive/                    # Archived files
```

---

## How to Sync Updates to Template

### Step 1: Commit Your Changes First
```bash
git add -A
git commit -m "Your commit message"
git push origin main
```

### Step 2: Create a Clean Branch for Template
```bash
# Fetch latest template state
git fetch template

# Create a branch from template/main
git checkout -b template-update template/main
```

### Step 3: Copy Framework Files
```bash
# Copy framework directories (overwrite existing)
git checkout main -- .claude/
git checkout main -- agents/
git checkout main -- lib/
git checkout main -- testing-framework/
git checkout main -- utils/
git checkout main -- package.json
git checkout main -- .gitignore

# Copy documentation
git checkout main -- README.md 2>/dev/null || true
git checkout main -- SETUP.md 2>/dev/null || true
git checkout main -- GETTING-UPDATES.md 2>/dev/null || true
git checkout main -- SONS-SETUP-GUIDE.md 2>/dev/null || true
git checkout main -- AGENTS.md 2>/dev/null || true
git checkout main -- QUICK_START.md 2>/dev/null || true
```

### Step 4: Commit and Push to Template
```bash
git add -A
git commit -m "Sync framework updates from dev-framework

Updates include:
- [List what changed]

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

git push template template-update:main
```

### Step 5: Return to Main Branch
```bash
git checkout main
git branch -D template-update
```

---

## Quick Sync Script

For convenience, here's a one-liner (run from dev-framework root):

```bash
# Sync framework to template
git fetch template && \
git checkout -b template-update template/main && \
git checkout main -- .claude/ agents/ lib/ testing-framework/ utils/ package.json .gitignore && \
git checkout main -- SONS-SETUP-GUIDE.md AGENTS.md QUICK_START.md 2>/dev/null; \
git add -A && \
git commit -m "Sync framework updates" && \
git push template template-update:main && \
git checkout main && \
git branch -D template-update
```

---

## How Sons Get Updates

Sons run these commands (documented in SONS-SETUP-GUIDE.md):

```bash
cd ~/Code/my-dev-framework
git fetch upstream
git merge upstream/main
```

Their `upstream` remote points to `dev-framework-template`.

---

## Troubleshooting

### "Repos have different histories"
This is expected! `dev-framework` and `dev-framework-template` are separate repos. Use the branch method above, not direct pushes.

### "Merge conflict when syncing"
```bash
git checkout main
git branch -D template-update
# Start fresh with the steps above
```

### "Template remote not found"
```bash
git remote add template https://github.com/Sean-t3422/dev-framework-template.git
```

---

## Important Rules

1. **Never push `projects/` to template** - That's Dad's work
2. **Always use the branch method** - Don't try `git push template main:main`
3. **Test after syncing** - Run `/check-project` in a fresh clone to verify
4. **Document significant updates** - Tell sons what changed so they know to pull

---

## For Future Claude Sessions

**When user says "push to template" or "sync to sons' repo":**

1. Read this file first
2. Follow the steps exactly
3. Don't suggest alternative approaches
4. The two repos have DIFFERENT histories - this is intentional

**The sync workflow:**
```
dev-framework (main)
    ↓ checkout files to branch
template-update (branch)
    ↓ push to template/main
dev-framework-template (sons pull from here)
    ↓ sons fetch upstream
sons' local repos
```

---

*Last updated: November 2024*
*Created to document the template sync workflow after it wasn't documented initially.*
