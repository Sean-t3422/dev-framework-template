# Dev Framework Template

A professional development framework that enforces TDD (Test-Driven Development), clean code practices, and structured workflows with Claude Code.

## Quick Start

```bash
# 1. Clone this repository
git clone https://github.com/Sean-t3422/dev-framework-template.git my-projects
cd my-projects

# 2. Install dependencies
npm install

# 3. Start Claude Code
claude

# 4. Initialize your session
/init-session

# 5. Start building!
"I want to build a todo app"
```

## What This Framework Does

### Automatic Intent Recognition
Just describe what you want to build, and Claude automatically:
- Starts the appropriate workflow
- Asks the right discovery questions
- Generates tests BEFORE code (TDD)
- Reviews for security and performance
- Guides you through implementation

### Complexity-Based Workflows
- **Simple tasks** (typos, styling) → Quick fixes, no ceremony
- **Moderate features** → Tests + implementation
- **Complex features** → Full TDD with checkpoints
- **Critical systems** → Architecture review + comprehensive testing

### Built-in Quality Gates
- TypeScript type checking
- ESLint code quality
- Test coverage requirements
- Security reviews
- Performance checks

## Project Structure

```
my-projects/
├── .claude/              # Framework rules (DON'T MODIFY)
│   ├── CLAUDE.md         # Main framework instructions
│   ├── commands/         # Available slash commands
│   └── agents/           # Agent definitions
├── agents/               # JavaScript agent implementations
├── lib/                  # Orchestration libraries
├── testing-framework/    # TDD infrastructure
├── utils/                # Utility tools
├── projects/             # YOUR PROJECTS GO HERE
│   └── my-app/           # Example: your first project
├── briefs/               # Requirements documents
│   └── active/           # Current briefs
└── specs/                # Technical specifications
    └── active/           # Current specs
```

## Creating Your First Project

```bash
# In Claude Code, just say:
"I want to create a new project called my-awesome-app"

# Or manually:
mkdir -p projects/my-awesome-app
cd projects/my-awesome-app
npm init -y
```

## Common Commands

| Command | Description |
|---------|-------------|
| `/build-feature` | Start full TDD workflow for a feature |
| `/orchestrate` | **Switch to orchestrator mode** - Claude delegates to sub-agents instead of doing work directly |
| `/status` | Show current workflow status and next actions |
| `/fast-mode on` | Enable quick mode for simple tasks |
| `/fast-mode off` | Back to strict TDD mode |
| `/init-session` | Initialize Claude Code session |
| `/check-project` | Load current project context |

### Orchestrator Mode

When you say "be the orchestrator" or use `/orchestrate`, Claude switches from doing work directly to delegating:

- **Before**: Claude reads files, writes code, makes edits
- **After**: Claude creates blueprints and dispatches sub-agents to do the work

This is useful for complex multi-part features where you want systematic execution with quality gates.

## Example Workflows

### Building a Feature
```
You: "I want to build user registration"

Claude:
1. Asks discovery questions (what fields? validation rules?)
2. Creates a requirements brief
3. Generates failing tests (TDD)
4. Implements code to pass tests
5. Reviews for security issues
6. Finalizes and documents
```

### Quick Fix
```
You: "Fix the typo in the header"

Claude:
- Detects simple task
- Makes the fix directly
- No unnecessary ceremony
```

### Orchestrator Mode
```
You: "I need you to orchestrate building these 5 UI components"

Claude:
1. Analyzes and creates blueprints for each component
2. Pre-validates blueprints with Codex (GPT-5)
3. Dispatches sub-agents to build each component
4. Verifies each implementation
5. Tracks progress with hierarchical todos
```

## Getting Framework Updates

See [GETTING-UPDATES.md](./GETTING-UPDATES.md) for how to pull updates from the main framework.

## Need Help?

If you get stuck:
1. Ask Claude: "How do I [your question]?"
2. Check `.claude/WORKFLOW-PHASES-GUIDE.md` for workflow details
3. Check `.claude/commands/` for available commands
4. Ask Dad for help! (He can see your code and help debug)

## Important Rules

1. **DON'T modify `.claude/` folder** - This is the framework core
2. **DO create projects in `projects/` folder** - Your code goes here
3. **DO follow TDD** - Let Claude generate tests first
4. **DO commit often** - Small, focused commits

## License

Private - For family use only.
