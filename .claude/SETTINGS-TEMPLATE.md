# Settings Template - Framework Master

## ⚠️ CRITICAL: This is the MASTER settings file

The file `settings.local.json` in this directory is the MASTER template for ALL projects.

**Location**: `/dev-framework/.claude/settings.local.json`

**Inherited by**: ALL projects linked via `link-framework.sh` or `init-new-project.sh`

## How to Edit Framework Settings

1. Open `/dev-framework/.claude/settings.local.json`
2. Add your patterns to the `"allow"` array
3. Save - changes apply to ALL projects instantly

## Required Permissions

These permissions MUST be in the framework settings:

```json
{
  "permissions": {
    "allow": [
      "SlashCommand(*)"  ← CRITICAL: Enables proactive workflows
    ]
  }
}
```

Without `SlashCommand(*)`, workflows will ask for permission every time.

## Common Patterns to Add

```json
"allow": [
  "SlashCommand(*)",
  "Bash(node:*)",
  "Bash(npm:*)",
  "Bash(git:*)",
  "Bash(grep:*)",
  "Bash(find:*)",
  "Bash(PGPASSWORD:*)",  // For database projects
  "Bash(curl:*)",        // For API testing
  "Bash(npx:*)"          // For tool execution
]
```

## DO NOT

- ❌ Create per-project settings.local.json files
- ❌ Override settings in child projects
- ❌ Remove the SlashCommand(*) pattern

## Verify Settings

From any linked project:
```bash
../../scripts/verify-framework.sh
```

Should show:
✅ SlashCommand auto-approval enabled
