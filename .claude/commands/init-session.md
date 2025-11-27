# Session Initialization

**Command**: `/init-session`

**Purpose**: Initialize a new Claude Code session with full project context and MCP connectivity for dev-framework projects.

---

## What This Command Does

This command performs complete session setup:

1. **Loads Project Context**
   - Framework documentation and patterns
   - Recent work history
   - Current project state

2. **Tests MCP Connectivity**
   - Verifies each configured MCP server
   - Reports which MCPs are available
   - Sets fallback strategy for unavailable MCPs

3. **Validates Environment**
   - Checks dev server status
   - Verifies database connectivity
   - Confirms required tools are available

4. **Sets Session Strategy**
   - Documents which tools to use
   - Establishes workflow preferences
   - Prepares for efficient development

---

## Usage

Simply run at the start of any new session:

```
/init-session
```

---

## Execution Steps

### Step 1: Welcome and Context Loading

Say to user:
```
🚀 Initializing Dev Framework Session...

📚 Loading project context...
```

Then read these files in order:
1. `docs/history/TODO_POLISH.md` - Current work
2. `.claude/CLAUDE.md` - Framework instructions
3. Run: `git status` to see current changes
4. Run: `git log -5 --oneline` to see recent work

Report:
```
✅ Project Context Loaded
- Current project: [project-name]
- Last session: [from TODO_POLISH.md]
- Current branch: [from git status]
- Recent work: [summary from git log]
```

### Step 2: Test MCP Connectivity

Test each MCP server to determine availability:

#### Test Supabase MCP

Try this:
```typescript
mcp__supabase__list_tables()
```

**If success:**
```
✅ Supabase MCP - Connected
   → Will use MCP for database operations
```

**If fails:**
```
⚠️  Supabase MCP - Not available
   → Fallback: Using 'supabase' CLI via Bash
```

#### Test GitHub MCP

Try this:
```typescript
mcp__github__get_file_contents({
  owner: "[repo-owner]",
  repo: "[repo-name]",
  path: "package.json"
})
```

**If success:**
```
✅ GitHub MCP - Connected
   → Will use MCP for GitHub operations
```

**If fails:**
```
⚠️  GitHub MCP - Not available
   → Fallback: Using 'gh' CLI via Bash
```

#### Test Playwright MCP

Try this:
```typescript
mcp__playwright__browser_list()
```

**If success:**
```
✅ Playwright MCP - Connected
   → Will use MCP for browser automation
```

**If fails:**
```
⚠️  Playwright MCP - Not available
   → Fallback: Using 'npx playwright' via Bash
```

### Step 3: Environment Validation

Check development environment:

```bash
# Check if dev server is running
if curl -s http://localhost:3456 > /dev/null 2>&1; then
  echo "✅ Dev server running on port 3456"
else
  echo "⚠️  Dev server not running (start with: npm run dev)"
fi

# Check required CLI tools
command -v supabase > /dev/null && echo "✅ Supabase CLI available"
command -v gh > /dev/null && echo "✅ GitHub CLI available"
command -v npx > /dev/null && echo "✅ NPX available"
```

### Step 4: Report Session Strategy

Provide comprehensive status report:

```
═══════════════════════════════════════
🎯 Dev Framework Session Ready!
═══════════════════════════════════════

📋 PROJECT INFO:
   Name: [project-name]
   Branch: [branch-name]
   Last Work: [summary]

🔌 MCP SERVER STATUS:
   Supabase:  [✅ Connected | ⚠️  Using CLI fallback]
   GitHub:    [✅ Connected | ⚠️  Using CLI fallback]
   Playwright: [✅ Connected | ⚠️  Using CLI fallback]

💡 SESSION STRATEGY:
   • Database: [MCP | supabase CLI]
   • GitHub: [MCP | gh CLI]
   • Testing: [MCP | npx playwright]
   • Workflows: Proactive (auto-detect build intent)
   • TDD: Complexity-adaptive (skip for simple tasks)

🚦 ENVIRONMENT:
   Dev Server: [✅ Running | ⚠️  Not started]
   Tools: [list available tools]

✨ READY FOR DEVELOPMENT!

   Next: Describe what you want to build, or:
   • /build-feature - Start a new feature
   • /fast-mode on - Enable quick development
   • /check-project - Deep context load
═══════════════════════════════════════
```

---

## What Happens Behind the Scenes

### MCP Initialization

When you first start Claude Code with this project, Claude Code reads `settings.local.json` and sees:

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "github",
    "supabase",
    "playwright",
    ...
  ]
}
```

This tells Claude Code to:
1. Look at your global MCP config (`~/.config/claude/claude_desktop_config.json`)
2. Start the MCP server processes listed in `enabledMcpjsonServers`
3. Establish connections to those servers
4. Make MCP tools available in the session

### Why MCPs Might Not Connect

Even with proper configuration, MCPs might not connect because:

1. **WSL2 Environment Issues**
   - MCP servers may have path issues
   - Socket communication differences
   - Environment variable mismatches

2. **MCP Server Startup Delays**
   - Some MCPs take time to initialize
   - Network connections may timeout
   - Server processes may fail silently

3. **Missing Dependencies**
   - MCPs may require specific packages
   - Global npm modules might be missing
   - Python uvx tools might need setup

### The Fallback Strategy

**This is OK!** The dev-framework is designed to work with OR without MCPs:

| Operation | With MCP | Without MCP |
|-----------|----------|-------------|
| Database Query | `mcp__supabase__execute_sql()` | `supabase db remote` via Bash |
| GitHub Issue | `mcp__github__create_issue()` | `gh issue create` via Bash |
| Browser Test | `mcp__playwright__browser_navigate()` | `npx playwright test` via Bash |

**Same end result, different path.** CLI tools are reliable, battle-tested, and work everywhere.

---

## When to Run This Command

### Always Run When:
- ✅ Starting a new Claude Code session
- ✅ Opening the project for the first time
- ✅ After updating `.claude/settings.local.json`
- ✅ When MCPs aren't responding
- ✅ After system restarts

### Automatically Triggered By:
- `/build-feature` - Runs initialization first
- Other workflow commands - Check if initialized

---

## Troubleshooting

### "All MCPs showing as unavailable"

**This is normal in WSL2!** MCPs may not connect in WSL2 environment.

**Solution**: Use CLI fallbacks (they work perfectly)

**Verify**:
```bash
# All these should work
supabase --version
gh --version
npx playwright --version
```

### "Want to force MCP connection"

**Try**:
1. Close Claude Code completely
2. Verify global config: `cat ~/.config/claude/claude_desktop_config.json`
3. Reopen Claude Code in project directory
4. Run `/init-session` again

**If still not working**: CLI fallbacks are the recommended approach.

### "Command takes too long"

MCP testing can take 5-10 seconds per server.

**Speed it up**:
- Skip slow MCPs in `enabledMcpjsonServers`
- Use CLI-only mode (remove MCP permissions from settings)

---

## Related Commands

- `/check-project` - Load context only (faster than full init)
- `/health-check` - Validate environment only
- `/build-feature` - Includes initialization step

---

## Comparison with Logelo

### Logelo's Approach:
- `/context-load` or `/luke-context-load` loads project files
- `/platform-startup-w` starts application services (Redis, Firebase, Next.js)
- MCPs are configured the same way via `settings.local.json`

### Dev Framework's Approach:
- `/init-session` combines context loading + MCP testing + environment validation
- No application services to start (uses existing dev server)
- Same MCP configuration pattern
- Graceful fallback to CLI tools

---

## Notes

- **MCPs are optional**: Framework works great with just CLI tools
- **First run may be slow**: MCP testing takes time
- **Results are cached for session**: Only runs once per session
- **Can force re-run**: Just call `/init-session` again
- **Proactive by default**: Most workflows auto-initialize

---

## Success Indicators

After running `/init-session`, you should see:

✅ Clear project context summary
✅ MCP status for each server
✅ Fallback strategy documented
✅ Environment validation results
✅ Ready to start development immediately

**No blockers, no uncertainty, ready to code!**
