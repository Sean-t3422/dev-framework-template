# Setup Guide

Complete setup instructions for the Dev Framework.

## Prerequisites

1. **Node.js** (v18 or later)
   ```bash
   # Check your version
   node --version
   
   # Install from: https://nodejs.org/
   ```

2. **Claude Code** (Anthropic's CLI)
   ```bash
   # Install Claude Code
   npm install -g @anthropic-ai/claude-code
   
   # Verify installation
   claude --version
   ```

3. **Git**
   ```bash
   # Check your version
   git --version
   
   # Configure git (first time only)
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## Step-by-Step Setup

### 1. Clone the Repository

```bash
# Clone to your preferred location
git clone https://github.com/Sean-t3422/dev-framework-template.git my-dev-framework
cd my-dev-framework
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Your First Project

```bash
# Create a project directory
mkdir -p projects/my-first-project
cd projects/my-first-project

# Initialize a Node.js project
npm init -y

# Add TypeScript (recommended)
npm install -D typescript @types/node
npx tsc --init
```

### 4. Start Claude Code

```bash
# Navigate back to framework root
cd ../..  # or cd /path/to/my-dev-framework

# Start Claude Code
claude
```

### 5. Initialize Your Session

Once Claude Code is running, type:
```
/init-session
```

This loads the framework context and prepares Claude to help you.

## Your First Feature

Try building something simple:

```
"I want to build a simple todo list with add and remove functionality"
```

Claude will:
1. Ask clarifying questions
2. Generate a requirements brief
3. Create failing tests (TDD approach)
4. Guide you through implementation
5. Review for quality

## Folder Structure Explained

| Folder | Purpose | Can Modify? |
|--------|---------|-------------|
| `.claude/` | Framework rules | NO |
| `agents/` | Agent implementations | NO |
| `lib/` | Orchestration code | NO |
| `testing-framework/` | TDD tools | NO |
| `utils/` | Utilities | NO |
| `projects/` | YOUR CODE | YES |
| `briefs/` | Requirements docs | YES |
| `specs/` | Technical specs | YES |

## Common Issues

### "Command not found: claude"
```bash
# Reinstall Claude Code globally
npm install -g @anthropic-ai/claude-code

# Or use npx
npx @anthropic-ai/claude-code
```

### "Permission denied"
```bash
# On Mac/Linux, you may need:
sudo npm install -g @anthropic-ai/claude-code
```

### Tests Not Running
```bash
# Make sure Jest is installed in your project
cd projects/your-project
npm install -D jest @types/jest ts-jest
```

## Getting Help

1. **In Claude Code**: Just ask! "How do I...?"
2. **Documentation**: Check `.claude/WORKFLOW-PHASES-GUIDE.md`
3. **Commands**: Look in `.claude/commands/`
4. **Dad**: Ask for help - he can see your code!

## Next Steps

1. Complete the setup above
2. Build a small practice project
3. Try the full `/build-feature` workflow
4. Experiment with different complexity levels

Happy coding!
