# Fast Mode Toggle

**Command**: `/fast-mode [on|off|status]`

## Description
Quickly toggle between strict TDD mode and fast development mode.

## What it does

### `/fast-mode on`
- Enables complexity-based TDD bypass for simple changes
- Expands auto-approvals
- Allows parallel execution
- Best for: Quick fixes, UI tweaks, documentation updates

### `/fast-mode off`
- Enforces strict TDD for all changes
- Maintains quality gates
- Sequential execution with full checks
- Best for: Critical features, payment systems, authentication

### `/fast-mode status`
- Shows current mode
- Lists what's enabled/disabled

## Usage Example

```
User: /fast-mode on
Claude: 🚀 Fast mode ENABLED!
  ✅ Simple changes bypass TDD
  ✅ Parallel execution active
  ✅ Auto-approvals expanded

  Perfect for quick fixes and UI tweaks.

User: Update the header text color to blue
Claude: [Executes directly without TDD ceremony]

User: /fast-mode off
Claude: 🔒 Strict mode ENABLED!
  ✅ TDD required for all changes
  ✅ Full quality gates active
  ✅ Cross-LLM review available

  Best for critical features.
```

## Implementation
This command modifies:
- `.claude/auto-approval.config` - WORKFLOW_AUTOMATION.skip_tdd_for_simple_tasks
- `.claude/hooks/auto-tdd-enforcer.js` - ALLOW_SIMPLE_BYPASS flag

Perfect for switching between exploration and production-quality development!