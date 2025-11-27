# Fix Test Issues

**Command**: `/fix-tests [file]`

**Description**: Helps write missing tests, fix failing tests, or improve test coverage. Your TDD assistant when you're stuck.

---

## What it does

1. **Analyzes the problem:**
   - Missing test file?
   - Failing tests?
   - Low coverage?

2. **Writes/fixes tests:**
   - Creates test file if missing
   - Writes comprehensive test cases
   - Follows TDD best practices

3. **Explains what it did:**
   - Why each test matters
   - What edge cases to consider
   - How to run tests

4. **Verifies everything works:**
   - Runs tests
   - Checks coverage
   - Confirms commit will work

---

## Usage

### Fix specific file
```
/fix-tests src/components/Button.tsx
```

### Fix all test issues
```
/fix-tests --all
```

### Improve coverage
```
/fix-tests --coverage
```

---

## Example Scenarios

### Scenario 1: Missing Test File

**User says:** `/fix-tests src/utils/validator.ts`

**Claude responds:**
```
🔍 Checking src/utils/validator.ts...

❌ No test file found!

Let me analyze your code and create comprehensive tests...

Looking at validator.ts, I see it:
- Validates email format
- Checks password strength
- Verifies phone numbers

Creating src/utils/validator.test.ts with:

✅ Email validation tests:
   - Valid emails pass
   - Invalid formats fail
   - Edge cases handled

✅ Password strength tests:
   - Weak passwords fail
   - Strong passwords pass
   - Special characters work

✅ Phone number tests:
   - Valid formats pass
   - International numbers work
   - Invalid formats fail

[Creates test file]

Running tests... ✅ All 12 tests pass!
Coverage: 94%

You can now commit! Try: git add . && git commit -m "Add validator with tests"
```

### Scenario 2: Failing Tests

**User says:** `/fix-tests`

**Claude responds:**
```
🔍 Checking test status...

❌ Found 3 failing tests in calculator.test.ts

Let me look at the failures:

Test: "should handle division by zero"
Expected: Error to be thrown
Actual: Returns Infinity

The issue: Your divide function doesn't handle zero properly.

Fixing implementation...

[Updates code to throw error for division by zero]

✅ All tests now pass!

The fix: Added check for zero divisor before dividing.
This prevents mathematical errors in your app.

Try committing now!
```

---

## Common Issues Fixed

### Missing Test Files
- Analyzes implementation
- Creates comprehensive tests
- Covers edge cases
- Adds documentation

### Failing Tests
- Identifies root cause
- Fixes implementation or test
- Explains the solution
- Prevents future issues

### Low Coverage
- Finds untested code
- Adds missing test cases
- Tests error conditions
- Improves confidence

### Wrong Test Structure
- Fixes test organization
- Improves test names
- Adds proper assertions
- Follows best practices

---

## Educational Approach

The command doesn't just fix - it teaches:

```
💡 Why this test matters:
This test ensures users can't create accounts with weak passwords,
protecting them from hackers.

💡 Edge case to remember:
Always test what happens with empty inputs - users do unexpected things!

💡 Pro tip:
Group related tests in describe blocks for better organization.
```

---

## Integration with TDD Workflow

1. **Try to commit** → Blocked (no tests)
2. **Run `/fix-tests`** → Tests created
3. **Tests pass** → Can commit
4. **Learned something** → Better developer

---

## For Supervisors

When junior developer uses `/fix-tests`:
- You're notified of what was fixed
- See what they struggled with
- Can provide targeted help
- Track learning progress

---

## Safety Features

- Never removes existing tests
- Always runs tests after changes
- Explains every change made
- Maintains high coverage

---

## After Using This Command

Next steps:
- Review the tests created
- Understand why they matter
- Try modifying them
- Run `/check-tdd` to verify

---

## Notes

- Always educational, never condescending
- Celebrates when tests pass
- Provides context for learning
- Available 24/7 for help