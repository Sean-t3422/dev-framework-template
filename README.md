# Dev Framework Template

A development framework that enforces TDD, clean code practices, and structured workflows with Claude Code.

## Quick Start

1. Clone this template
2. Run `claude /init-session` to initialize
3. Start building with `claude` - the framework guides you automatically

## Features

- **TDD Enforcement** - Tests before implementation
- **Proactive Workflows** - Claude recognizes intent and starts workflows automatically
- **Security & Performance Checkpoints** - Codex reviews at every stage
- **Complexity Detection** - Simple tasks bypass ceremony, complex tasks get full workflow

## Structure

```
.claude/           # Framework rules and commands
agents/            # Agent definitions
testing-framework/ # TDD infrastructure
projects/          # Your projects go here
briefs/            # Requirements briefs
specs/             # Technical specifications
```

## Usage

Just tell Claude what you want to build:

```
"I want to build a user authentication system"
```

Claude will automatically:
1. Start the /build-feature workflow
2. Ask discovery questions
3. Generate tests first (TDD)
4. Implement with security/performance checkpoints
5. Review and finalize

## Commands

- `/build-feature` - Full TDD workflow
- `/fast-mode on/off` - Toggle quick mode for simple tasks
- `/check-project` - Load project context
- `/init-session` - Initialize session

See `.claude/commands/` for all available commands.
