# Start as New Developer

**Command**: `/start-developer`

**Description**: Complete onboarding process for new developers. Sets up everything and ensures you can't skip important steps.

---

## What it does

**Complete guided onboarding:**

1. **Welcome & Introduction** (2 min)
   - What you'll build
   - Why TDD matters
   - How guardrails protect you

2. **Learn TDD** (45 min)
   - Mandatory tutorial
   - Cannot skip
   - Must pass quiz

3. **Initialize First Project** (5 min)
   - Choose template
   - Set up guardrails
   - Configure supervisor

4. **Create First Feature** (30 min)
   - Guided TDD example
   - Write test first
   - Make it pass

5. **Verify Everything Works** (2 min)
   - Check TDD compliance
   - Attempt commit
   - Celebrate success!

---

## Usage

### Start fresh (new developer)
```
/start-developer
```

### Resume onboarding
```
/start-developer --resume
```

### Check onboarding status
```
/start-developer --status
```

---

## Complete Onboarding Flow

**User says:** `/start-developer`

**Claude responds:**
```
👋 Welcome to Dev Framework!

I'm Claude, your AI development assistant. I'll help you become a great developer using Test-Driven Development (TDD).

First, let's get to know you:

What's your name?
> Sarah

Great to meet you, Sarah!

Who's your supervisor? (They'll get progress updates)
Email: dad@example.com

Perfect! Let's begin your journey...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 STEP 1: Learn TDD (Required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST complete this tutorial first.
It teaches the most important skill: writing tests BEFORE code.

Starting tutorial... /learn-tdd

[Tutorial runs - 45 minutes]

🎉 Congratulations! You completed TDD training!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 STEP 2: Create Your First Project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's create your first project with TDD guardrails.

What would you like to build?
1. SaaS app (users, subscriptions)
2. Marketplace (buyers, sellers)
3. Content site (blog, docs)
> 1

Project name?
> awesome-saas

Creating project with unbypassable TDD guardrails...

✅ Project created: awesome-saas
✅ TDD guardrails active (CANNOT bypass)
✅ Supervisor notifications configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ STEP 3: Build First Feature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's build your first feature using TDD!

We'll create a user registration feature.

First, we write the TEST:

[Creates test file with guidance]

Now run the test:
> npm test

❌ Test fails (RED) - This is good!

Now let's write code to make it pass:

[Creates implementation]

Run test again:
> npm test

✅ Test passes (GREEN) - Excellent!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ONBOARDING COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sarah, you're now ready to build with TDD!

You've learned:
✅ Why tests come first
✅ The RED-GREEN-REFACTOR cycle
✅ How to use Claude commands
✅ Built your first TDD feature

Your guardrails are active:
🛡️ Cannot commit without tests
🛡️ Cannot push with failing tests
🛡️ Supervisor sees your progress

Available commands:
• /create-feature - Start new features
• /fix-tests - Get help with tests
• /check-tdd - Verify compliance
• /learn-tdd - Review tutorial

Your supervisor (dad@example.com) has been notified!

Happy coding! Remember: ALWAYS write tests first! 🚀
```

---

## Onboarding Stages

### Stage 1: Education (45 min)
- TDD tutorial (mandatory)
- Cannot proceed without completing
- Quiz at the end
- Certificate generated

### Stage 2: Setup (5 min)
- Project initialization
- Guardrails installation
- Supervisor configuration
- Git repository setup

### Stage 3: Practice (30 min)
- Guided feature building
- Write test first
- Make it pass
- Experience success

### Stage 4: Validation (2 min)
- Verify all guardrails work
- Attempt a commit
- Confirm supervisor notifications
- Ready to work independently

---

## Progress Tracking

```
Onboarding Progress: Sarah
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[✅] Welcome & Setup       (2 min)
[✅] TDD Tutorial         (45 min)
[✅] Project Creation      (5 min)
[⏳] First Feature        (30 min)
[ ] Final Validation      (2 min)

Total Time: 52 minutes
Status: In Progress
```

---

## For Supervisors

You receive notifications at each stage:
1. Onboarding started
2. TDD tutorial completed
3. First project created
4. First feature built
5. Onboarding completed

Final report includes:
- Time spent on each section
- Tutorial quiz score
- First feature quality
- Overall readiness assessment

---

## Safety Features

### Cannot Skip Steps
- Tutorial is mandatory
- Each stage must complete
- No shortcuts allowed
- Protects junior developers

### Guardrails Activated
- Pre-commit hooks installed
- Pre-push checks enabled
- All bypass attempts blocked
- Supervisor visibility enabled

### Continuous Guidance
- Every error has help
- Commands always available
- Never left confused
- Always educational

---

## After Onboarding

The developer is ready to:
- Build features independently
- Follow TDD naturally
- Use Claude effectively
- Stay protected by guardrails

They have access to:
- `/create-feature` - Start new work
- `/fix-tests` - Get help
- `/check-tdd` - Verify compliance
- All other framework commands

---

## Integration

This command orchestrates:
1. `/learn-tdd` - Education
2. `/init-project` - Setup
3. `/create-feature` - Practice
4. `/check-tdd` - Validation

All in the correct order with validation between steps.

---

## Notes

- Takes ~90 minutes total
- Cannot be rushed
- Celebrates achievements
- Builds confidence
- Sets up for success