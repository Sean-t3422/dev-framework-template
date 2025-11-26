# Getting Framework Updates

How to receive updates to the dev framework without losing your projects.

## Setting Up for Updates

When you first clone the repository, set up an "upstream" remote:

```bash
# Add the original repo as upstream
git remote add upstream https://github.com/Sean-t3422/dev-framework-template.git

# Verify remotes
git remote -v
# You should see:
# origin    https://github.com/YOUR-USERNAME/your-repo.git (fetch)
# origin    https://github.com/YOUR-USERNAME/your-repo.git (push)
# upstream  https://github.com/Sean-t3422/dev-framework-template.git (fetch)
# upstream  https://github.com/Sean-t3422/dev-framework-template.git (push)
```

## Pulling Updates

When Dad pushes updates to the framework:

```bash
# 1. Fetch the latest updates
git fetch upstream

# 2. Make sure you're on main branch
git checkout main

# 3. Merge upstream changes
git merge upstream/main

# 4. If there are conflicts, ask for help!
#    Or resolve them:
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "Merged framework updates"
```

## What Gets Updated

| Folder | Updated? | Notes |
|--------|----------|-------|
| `.claude/` | YES | Framework rules and commands |
| `agents/` | YES | Agent definitions |
| `lib/` | YES | Orchestration code |
| `testing-framework/` | YES | Testing tools |
| `utils/` | YES | Utilities |
| `projects/` | NO | Your code is safe |
| `briefs/` | NO | Your briefs are safe |
| `specs/` | NO | Your specs are safe |

## Avoiding Conflicts

1. **NEVER modify files in `.claude/`, `agents/`, `lib/`, etc.**
   - If you need custom behavior, ask Dad to add it to the framework

2. **Keep your code in `projects/`**
   - This folder is ignored by framework updates

3. **Commit your changes before pulling updates**
   ```bash
   git add .
   git commit -m "Save my work before update"
   git fetch upstream
   git merge upstream/main
   ```

## If Something Goes Wrong

```bash
# Undo the merge if it's not working
git merge --abort

# Or reset to before the merge
git reset --hard HEAD~1

# Then ask Dad for help!
```

## Checking for Updates

```bash
# See if there are new updates available
git fetch upstream
git log main..upstream/main --oneline

# If you see commits listed, there are updates!
```

## Questions?

Ask Dad! He can:
- Push fixes to the framework
- Help resolve merge conflicts
- Add new features you request
- See your code to help debug
