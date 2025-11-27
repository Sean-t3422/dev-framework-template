# Check MCP Connectivity

**Command**: `/check-mcps`

**Description**: Verifies MCP server connectivity and determines whether to use MCP tools or fallback to CLI commands. Models Logelo's MCP loading approach.

---

## What it does

1. **Tests each configured MCP server:**
   - Supabase MCP (database operations)
   - GitHub MCP (repository management)
   - Playwright MCP (browser automation)

2. **Reports connectivity status:**
   - ✅ Connected and working
   - ⚠️ Configured but not responding
   - ❌ Not available (use CLI fallback)

3. **Establishes session strategy:**
   - Which MCPs to use
   - Which CLI tools to use as fallbacks
   - Documents the approach for this session

---

## Usage

### Check All MCPs
```
/check-mcps
```

### Check Specific MCP
```
/check-mcps supabase
/check-mcps github
/check-mcps playwright
```

---

## How It Works

### Step 1: Test Supabase MCP

Try to execute a simple database query:

```typescript
// Attempt MCP call
mcp__supabase__execute_sql({
  sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 3"
})
```

**Success Response:**
```
✅ Supabase MCP - Connected
   Tables found: [list of tables]
   Strategy: Use MCP for database operations
```

**Failure Response:**
```
⚠️ Supabase MCP - Not responding
   Fallback: Use 'supabase' CLI via Bash
   Test: supabase --version
```

### Step 2: Test GitHub MCP

Try to list repository information:

```typescript
// Attempt MCP call
mcp__github__get_repository({
  owner: "[repo-owner]",
  repo: "[repo-name]"
})
```

**Success Response:**
```
✅ GitHub MCP - Connected
   Repository: [repo info]
   Strategy: Use MCP for GitHub operations
```

**Failure Response:**
```
⚠️ GitHub MCP - Not responding
   Fallback: Use 'gh' CLI via Bash
   Test: gh repo view
```

### Step 3: Test Playwright MCP

Try to check browser availability:

```typescript
// Attempt MCP call
mcp__playwright__browser_list()
```

**Success Response:**
```
✅ Playwright MCP - Connected
   Browsers: chromium, firefox, webkit
   Strategy: Use MCP for browser automation
```

**Failure Response:**
```
⚠️ Playwright MCP - Not responding
   Fallback: Use 'npx playwright' via Bash
   Test: npx playwright --version
```

---

## Example Output

**User says:** `/check-mcps`

**Claude responds:**

```
🔌 Testing MCP Server Connectivity...

Supabase MCP:
⚠️ Not responding (timeout after 5s)
→ Fallback: Using 'supabase' CLI
→ Verified: supabase 1.123.4

GitHub MCP:
⚠️ Not responding (MCP server not found)
→ Fallback: Using 'gh' CLI
→ Verified: gh version 2.40.0

Playwright MCP:
⚠️ Not responding (MCP server not found)
→ Fallback: Using 'npx playwright'
→ Verified: playwright 1.40.0

📋 Session Strategy:

DATABASE OPERATIONS:
✗ MCP not available
✓ Using: supabase db remote commit
✓ Using: Direct SQL via psql

GITHUB OPERATIONS:
✗ MCP not available
✓ Using: gh issue create/list
✓ Using: gh pr create/view

BROWSER TESTING:
✗ MCP not available
✓ Using: npx playwright test
✓ Using: Direct test commands

💡 Note: MCPs are configured globally but not connecting in WSL2.
   All operations will use CLI fallbacks which work reliably.

✅ Ready to proceed with CLI-based workflow
```

---

## When to Use

### ✅ Run this command when:
- Starting a new session
- User mentions database queries
- User wants GitHub operations
- User requests browser testing
- Claude reports "tool not available"

### 🔄 Re-run when:
- Switching between projects
- MCPs suddenly stop working
- After system restarts

---

## Fallback Strategies

### Database Operations (Supabase)

**When MCP Available:**
```typescript
const result = await mcp__supabase__execute_sql({
  sql: "SELECT * FROM users LIMIT 10"
});
```

**When MCP NOT Available:**
```bash
# Option 1: Direct psql
supabase db remote commit

# Option 2: Via Supabase CLI
echo "SELECT * FROM users LIMIT 10" | \
  psql $DATABASE_URL
```

### GitHub Operations

**When MCP Available:**
```typescript
const issues = await mcp__github__list_issues({
  owner: "repo-owner",
  repo: "repo-name",
  state: "open"
});
```

**When MCP NOT Available:**
```bash
# Using gh CLI
gh issue list --state open
gh issue create --title "Bug" --body "Description"
gh pr create --title "Feature" --body "Changes"
```

### Browser Testing (Playwright)

**When MCP Available:**
```typescript
const page = await mcp__playwright__browser_navigate({
  url: "http://localhost:3456",
  browser: "chromium"
});
```

**When MCP NOT Available:**
```bash
# Direct Playwright commands
npx playwright test
npx playwright test --headed
npx playwright codegen http://localhost:3456
```

---

## Integration with CLAUDE.md

When Claude starts a session, CLAUDE.md should trigger this check:

```markdown
## Session Initialization

1. **Load Context**: Read CLAUDE.md (you're doing it now)
2. **Check MCPs**: Run /check-mcps to verify connectivity
3. **Set Strategy**: Use MCPs if available, CLI if not
4. **Proceed**: Ready for user requests
```

---

## Understanding MCP Connectivity

### Why MCPs Might Not Connect in WSL2

1. **MCP Server Path Issues**: MCP servers may be configured for Windows paths
2. **Socket Communication**: Unix sockets vs Windows named pipes
3. **Environment Variables**: Different between Windows and WSL2
4. **Port Binding**: Localhost behaves differently in WSL2

### The Good News

**CLI fallbacks work perfectly in WSL2:**
- `supabase` CLI works ✅
- `gh` CLI works ✅
- `playwright` works ✅

**User confirmed:** "I've worked on Logelo in my WSL environment, so I know that it works."

This means Logelo likely:
1. Tests MCP connectivity at startup
2. Falls back to CLI gracefully
3. Doesn't fail when MCPs aren't available

---

## Comparison with Logelo

### Logelo's Approach (from investigation)

**Agents declare MCP requirements:**
```yaml
---
name: design-image-finder
tools: mcp__stock-images__search_stock_images, mcp__replicate__*, Write, Read, Bash
model: opus
---
```

**Context loading command:**
- `/context-load` or `/luke-context-load`
- Loads project files + verifies tool availability
- Sets up session with known tool set

**Launch modes:**
- `codex` - Basic mode
- `codex-full` - All tools including MCPs
- `codex-dev` - Development focus

### Dev Framework Approach (this command)

**Proactive testing:**
- Test each MCP at session start
- Report what's available vs what's not
- Set fallback strategy immediately

**No silent failures:**
- Always verify before using
- Document the strategy for user
- Show what will be used

**Graceful degradation:**
- CLI fallbacks always available
- No workflow interruption
- Same end result

---

## Troubleshooting

### "All MCPs showing as unavailable"

**Expected in WSL2**: This is normal. MCPs may not connect in WSL2 environment.

**Solution**: Use CLI fallbacks (they work great!)

**Verify fallbacks work:**
```bash
# Test each CLI tool
supabase --version
gh --version
npx playwright --version
```

### "Want to enable MCPs in WSL2"

**Check global MCP config:**
```bash
cat ~/.config/claude/claude_desktop_config.json
```

**Verify MCP servers are installed:**
```bash
# For Node-based MCPs
npm list -g @modelcontextprotocol/server-*

# For system MCPs
which supabase
which gh
```

**Current Status**: MCPs configured but not connecting. CLI fallbacks work perfectly.

### "Logelo works in WSL2 with MCPs"

**Investigation needed**: Look at how Logelo:
1. Initializes MCP connections
2. Handles WSL2 environment differences
3. Tests connectivity before use

**For now**: Use CLI approach (proven to work)

---

## Related Commands

- `/check-project` - Load project documentation and patterns
- `/health-check` - Verify development environment
- `/build-feature` - Start feature development (uses detected tools)

---

## Success Indicators

After running `/check-mcps`, you should see:

✅ Clear status for each MCP
✅ Fallback strategy documented
✅ CLI tools verified as working
✅ Ready to proceed with appropriate tools

**Key Principle**: Never let MCP unavailability block workflow. CLI fallbacks are first-class citizens in dev-framework.

---

## Notes

- This command models Logelo's MCP loading approach
- Adapted for dev-framework's structure
- Prioritizes CLI reliability over MCP requirements
- User confirmed CLI approach works in WSL2
- MCPs are "nice to have" not "must have"
