# Initialize New Project

**Command**: `/init-project`

**Description**: Creates a new project with TDD guardrails, templates, and everything configured correctly. Perfect for junior developers starting their first project.

---

## What it does

1. **Creates project from template:**
   - Asks which type (SaaS, Marketplace, or Content)
   - Sets up complete project structure
   - Installs all dependencies

2. **Installs TDD guardrails:**
   - Pre-commit hooks (cannot be bypassed)
   - Pre-push quality gates
   - Supervisor notifications

3. **Configures developer profile:**
   - Name and email
   - Experience level (always "junior" for safety)
   - Supervisor contact info

4. **Runs initial tutorial:**
   - Quick TDD overview
   - How to use Claude commands
   - First feature walkthrough

5. **Sets up git repository:**
   - Initializes git
   - Creates first commit
   - Sets up remote (if provided)

---

## Usage

### Basic initialization
```
/init-project
```
Claude will ask you:
- Project name
- Project type (SaaS/Marketplace/Content)
- Your name
- Supervisor email (for notifications)

### With options
```
/init-project my-app --template=saas --supervisor=dad@example.com
```

---

## Example Output

**User says:** `/init-project`

**Claude responds:**
```
🚀 Let's create your new project!

I'll help you set up everything with TDD guardrails that will guide you to write tests first.

What would you like to name your project?
> my-awesome-app

What type of application?
1. SaaS (user accounts, subscriptions, dashboard)
2. Marketplace (buyers, sellers, payments)
3. Content (blog, documentation, CMS)
> 1

What's your name? (for git commits)
> Alex

Supervisor email? (they'll be notified of your progress)
> dad@example.com

Creating your project...

✅ Project created: my-awesome-app
✅ Template applied: SaaS
✅ Dependencies installed
✅ TDD guardrails active (CANNOT be bypassed)
✅ Git initialized
✅ Supervisor notifications configured

📚 IMPORTANT: You MUST write tests FIRST!
   - When you try to commit without tests, I'll help you
   - Use /learn-tdd to understand why this matters
   - Use /create-feature to start building

Ready to start! Try: /learn-tdd
```

---

## Guardrails Included

### Pre-commit Hook
- Blocks commits without tests
- Cannot use --no-verify
- Provides Claude command help

### Pre-push Hook
- Runs lint, typecheck, tests
- Cannot use --force
- Must pass all quality gates

### Error Messages
All errors point to Claude commands:
```
❌ No test file found for feature.ts

Don't worry! Ask Claude:
/fix-tests feature.ts

Or learn why tests matter:
/learn-tdd
```

---

## For Supervisors

When a junior developer uses this command:
1. You'll receive an email notification
2. Their commits/pushes will notify you
3. You can check their progress anytime
4. They CANNOT bypass TDD requirements

---

## Integration with Other Commands

After `/init-project`, they should:
1. `/learn-tdd` - Understand TDD workflow
2. `/create-feature` - Start first feature
3. `/check-tdd` - Verify compliance
4. `/fix-tests` - Get help with test issues

---

## Safety Features

- **No bypassing:** Guardrails cannot be disabled
- **Clear guidance:** All errors explain what to do
- **Supervisor visibility:** Every action is tracked
- **Educational:** Teaches while protecting

---

## Notes

- Always creates projects in safe location
- Never modifies framework itself
- All templates include working examples
- Automatic daily progress reports to supervisor