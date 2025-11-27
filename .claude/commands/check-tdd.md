# Check TDD Compliance

**Command**: `/check-tdd`

**Description**: Verifies your project follows TDD practices. Shows what's good, what needs work, and how to fix issues.

---

## What it does

1. **Scans your changes:**
   - Staged files
   - Modified files
   - New files

2. **Checks compliance:**
   - Every code file has tests
   - Tests are passing
   - Coverage meets minimum (70%)

3. **Provides report:**
   - ✅ What's good
   - ❌ What needs fixing
   - 📚 How to fix it

4. **Tracks progress:**
   - Your TDD score
   - Improvement over time
   - Learning milestones

---

## Usage

### Check current status
```
/check-tdd
```

### Check specific files
```
/check-tdd src/components/Button.tsx
```

### Detailed report
```
/check-tdd --verbose
```

---

## Example Output

**User says:** `/check-tdd`

**Claude responds:**
```
🔍 TDD Compliance Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking 5 changed files...

✅ PASSING (3 files)
├─ src/utils/formatter.ts
│  └─ Test: src/utils/formatter.test.ts ✓
├─ src/components/Header.tsx
│  └─ Test: src/components/Header.test.tsx ✓
└─ src/api/users.ts
   └─ Test: src/api/users.test.ts ✓

❌ NEEDS ATTENTION (2 files)
├─ src/services/auth.ts
│  └─ Missing test file!
│     Fix: /fix-tests src/services/auth.ts
└─ src/helpers/validator.ts
   └─ Test exists but failing (2 failures)
      Fix: /fix-tests src/helpers/validator.ts

📊 OVERALL SCORE: 60% (3/5 compliant)

Coverage Report:
├─ Lines: 72% ✅
├─ Functions: 68% ⚠️
├─ Branches: 65% ⚠️
└─ Statements: 71% ✅

📈 Progress Tracking:
├─ Tests written today: 8
├─ TDD streak: 3 days
└─ Improvement: +15% from yesterday

🎯 Next Step:
Fix the 2 issues above with /fix-tests
Then you can commit your work!

💡 Pro tip: Write tests FIRST next time to avoid this step!
```

---

## Detailed Compliance Rules

### ✅ File is Compliant When:
- Has corresponding test file
- All tests pass
- Coverage > 70%
- Tests were written first (ideal)

### ❌ File is Non-Compliant When:
- No test file exists
- Tests are failing
- Coverage < 70%
- Tests were written after code

### 🎯 TDD Score Calculation:
- 20 points: Test file exists
- 30 points: Tests passing
- 30 points: Good coverage
- 20 points: Tests written first
- **Total: 100 points possible**

---

## Progress Tracking

The command tracks your TDD journey:

```
📈 Your TDD Progress
━━━━━━━━━━━━━━━━━━━━

Week 1: ██░░░░░░░░ 20%  (Learning)
Week 2: ████░░░░░░ 40%  (Improving)
Week 3: ██████░░░░ 60%  (Good habits)
Week 4: ████████░░ 80%  (Almost there!)
Current: █████████░ 90%  (TDD Champion!)

Achievements Unlocked:
🏆 First Test - Wrote your first test
🏆 Test Streak - 3 days of TDD
🏆 Coverage Hero - Reached 80% coverage
🏆 Edge Master - Tested edge cases

Keep it up! You're doing great!
```

---

## Common Issues and Solutions

### Issue: "I forgot to write tests first"
```
That's okay! Here's what to do:
1. Run: /fix-tests [file]
2. Review the tests created
3. Next time, write test first!
```

### Issue: "My tests are failing"
```
Let's fix them together:
1. Run: /fix-tests
2. I'll identify the issue
3. We'll fix it step by step
```

### Issue: "Coverage is too low"
```
Let's improve coverage:
1. Run: /fix-tests --coverage
2. I'll find untested code
3. We'll add missing tests
```

---

## For Supervisors

Daily report includes:
- Files checked
- Compliance rate
- Common issues
- Learning progress
- Time spent fixing vs. writing tests first

---

## Educational Features

### Learn from Mistakes
```
📚 Learning Moment:
You wrote code before tests for auth.ts

Why tests first matters:
- Forces you to plan
- Simpler implementation
- Better code design

Try this next time:
1. Write what you want: test('should authenticate user'...)
2. Then implement it
```

### Celebrate Success
```
🎉 Awesome! All files have tests!
Your TDD compliance: 100%

You're building quality software!
Keep up the great work!
```

---

## Integration

Works with:
- `/fix-tests` - Fix any issues found
- `/learn-tdd` - Understand why this matters
- `/create-feature` - Start with TDD from beginning

---

## Notes

- Non-judgmental feedback
- Always shows how to fix
- Tracks improvement over time
- Makes TDD feel achievable