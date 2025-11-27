# Automatic Workflow Triggers

## Intent Patterns (No commands needed!)

When you use these phrases, I'll automatically trigger the right workflow:

### 🏗️ Building/Development Triggers
**Phrases that trigger /build-feature:**
- "I want to build..."
- "Let's create..."
- "I need to implement..."
- "Help me develop..."
- "I want to add..."
- "Let's add a feature..."
- "Can you implement..."

**Example:**
```
User: "I want to build a payment processing system"
Claude: [Automatically runs /build-feature workflow]
```

### 🔍 Discovery/Planning Triggers
**Phrases that trigger discovery + story creation:**
- "I want to start developing..."
- "Let's plan..."
- "I'm thinking about adding..."
- "Help me design..."
- "I need to figure out..."

**Example:**
```
User: "I want to start developing a dashboard"
Claude: [Automatically runs discovery → story workflow]
```

### 🐛 Bug Fix Triggers
**Phrases that trigger fast-path fixes:**
- "Fix this bug..."
- "There's an issue with..."
- "This is broken..."
- "Can you fix..."
- "Update this..."
- "Change this..."

**Example:**
```
User: "Fix the typo in the header"
Claude: [Fast path - direct fix, no TDD]
```

### 🧪 Test Triggers
**Phrases that trigger test generation:**
- "Write tests for..."
- "Test this feature..."
- "Add test coverage..."
- "Create tests..."

**Example:**
```
User: "Write tests for the payment module"
Claude: [Generates comprehensive test suite]
```

### 📝 Documentation Triggers
**Phrases that trigger docs workflow:**
- "Document this..."
- "Update the docs..."
- "Write documentation for..."
- "Explain how this works..."

**Example:**
```
User: "Document the API endpoints"
Claude: [Creates/updates documentation]
```

## How It Works

I'll recognize your intent and:
1. Inform you what workflow I'm starting
2. Execute it automatically
3. No need to remember commands!

## You Can Always Override

- Use explicit commands when you want specific control
- Say "wait" or "stop" if I misinterpret
- Use "/fast-mode on" for quick work
- Use "/build-feature" explicitly for full control

## Behind the Scenes

This works by pattern matching on your input:
```javascript
const intents = {
  build: /i (want to|need to|would like to) (build|create|implement|add|develop)/i,
  fix: /fix|broken|issue|bug|typo|error/i,
  test: /test|tests|coverage|spec/i,
  docs: /document|documentation|explain|docs/i
};
```

Natural language → Automatic workflow! 🚀