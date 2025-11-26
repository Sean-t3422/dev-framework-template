# Session Initialization

**Command**: `/init-session`

**Purpose**: Initialize a new Claude Code session with full project context and MCP connectivity.

---

## What This Command Does

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

---

## Usage

```
/init-session
```

---

## When to Run

✅ Starting a new Claude Code session
✅ Opening the project for the first time
✅ After updating `.claude/settings.local.json`
✅ When MCPs aren't responding
