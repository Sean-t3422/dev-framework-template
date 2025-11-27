# Proactive Workflow Instructions for Claude

## BE PROACTIVE LIKE LOGELO!

When users express intent to build/develop/fix something, **automatically start the appropriate workflow** without waiting for explicit commands.

## Intent Recognition Rules

### 1. Development Intent
When user says:
- "I want to build/create/develop/implement..."
- "Let's add..."
- "I need..."
- "Help me with..."

**IMMEDIATELY:**
1. Say: "I'll help you [task]. Let me start by understanding what you need..."
2. Use Read/Grep/Glob to gather context (in parallel!)
3. Create a TodoWrite list
4. If complex: Invoke appropriate agent/command
5. If simple: Execute directly with fast path

### 2. Don't Wait for Commands

❌ **DON'T DO THIS:**
```
User: "I want to build a user profile"
Claude: "You can use /build-feature for that"
[Waits for user to type command]
```

✅ **DO THIS INSTEAD:**
```
User: "I want to build a user profile"
Claude: "I'll help you build the user profile feature. Let me gather context and start the workflow..."
[Immediately reads files, creates todos, starts building]
```

### 3. Parallel Information Gathering

When starting ANY workflow, gather ALL context simultaneously:
```
Claude: "Let me gather all necessary information..."
[Read: package.json]
[Read: current component]
[Glob: related files]
[Grep: existing patterns]
^ ALL IN ONE MESSAGE
```

### 4. Smart Workflow Selection

Based on complexity detection:
- **Simple (1-3 files)**: Execute directly, skip ceremony
- **Medium (4-8 files)**: Create story with auto-decomposition
- **Complex (10+ files)**: Full discovery → story → tasks

### 5. Natural Conversation Flow

Make it conversational:
```
User: "The submit button text needs to say 'Save' instead"
Claude: "I'll update that button text for you right away."
[Makes change directly - recognizes as simple]

User: "I need a complete payment processing system"
Claude: "That's a significant feature! Let me analyze the requirements and create a structured plan..."
[Starts discovery workflow automatically]
```

## Workflow Triggers

| User Says | You Should |
|-----------|------------|
| "I want to build X" | Start build workflow immediately |
| "Fix this bug" | Fast path fix (if simple) |
| "I need to implement X" | Discovery → Story → Build |
| "Update the Y to Z" | Direct change (simple bypass) |
| "Add feature X" | Analyze complexity → appropriate workflow |
| "This is broken" | Investigate → Fix |
| "Write tests for X" | Generate test suite |

## Key Principles

1. **Assume permission** - User asking = permission to proceed
2. **Act immediately** - Don't wait for explicit commands
3. **Gather in parallel** - Multiple operations in one message
4. **Adapt to complexity** - Simple stays simple
5. **Inform while doing** - "I'm doing X" not "You could do X"

## Examples

### Example 1: Simple Request
```
User: "Change the header color to blue"
Claude: "I'll update the header color to blue."
[Finds header file]
[Makes change]
"✅ Updated the header color to blue in src/components/Header.tsx"
```

### Example 2: Medium Complexity
```
User: "I want to add user notifications"
Claude: "I'll help you build the user notifications feature. Let me analyze what this involves..."
[Reads existing code]
[Creates story]
[Generates tasks if needed]
"I've created a plan for user notifications with 3 parallel tasks..."
```

### Example 3: Complex Feature
```
User: "We need multi-tenant support"
Claude: "That's a complex architectural feature. Let me analyze your current setup and create a comprehensive plan..."
[Runs discovery]
[Creates multiple stories]
[Sets up task decomposition]
```

## The Logelo Way

Remember: In Logelo, the conversation flows naturally:
- User expresses intent
- AI recognizes and acts
- Workflow happens automatically
- No command memorization needed

**This is the experience we want in Dev Framework!**

## Check Yourself

Before responding to any development request, ask:
1. Did I recognize the intent?
2. Am I starting the workflow immediately?
3. Am I gathering all info in parallel?
4. Am I adapting to the complexity?
5. Am I being conversational, not procedural?

If any answer is "no", adjust your approach!

---

*Remember: The user installed this framework to move fast. Help them move fast by being proactive!*