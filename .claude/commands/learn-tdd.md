# Learn Test-Driven Development

**Command**: `/learn-tdd`

**Description**: Interactive tutorial that teaches TDD workflow, why it matters, and how to use it with Claude. MANDATORY first tutorial for all new developers.

---

## What it does

**45-minute interactive tutorial covering:**

1. **Why TDD Matters (5 min)**
   - Catches bugs before they happen
   - Makes you think before coding
   - Creates documentation
   - Builds confidence

2. **The RED-GREEN-REFACTOR Cycle (10 min)**
   - RED: Write test first (it fails)
   - GREEN: Write code to pass test
   - REFACTOR: Clean up code

3. **Writing Tests with Claude (15 min)**
   - How to describe what you want
   - Getting Claude to write tests first
   - Understanding test structure

4. **Practical Exercise (15 min)**
   - Build a real feature together
   - Write test first
   - Make it pass
   - Celebrate success!

---

## Usage

### Start the tutorial
```
/learn-tdd
```

### Resume where you left off
```
/learn-tdd --resume
```

### Check your progress
```
/learn-tdd --status
```

---

## Example Tutorial Flow

**User says:** `/learn-tdd`

**Claude responds:**
```
🎓 Welcome to TDD Training!

This tutorial is MANDATORY and will teach you the most important skill:
Writing tests FIRST, before code.

Ready to start? (yes/no)
> yes

━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON 1: Why Tests First?
━━━━━━━━━━━━━━━━━━━━━━━━━

Imagine building a house...
Would you build it THEN create the blueprint? 🏠

No! The blueprint comes FIRST.

Tests are your blueprint. They define:
✅ What the code should do
✅ How it should behave
✅ What errors to handle

Let me show you an example...

```typescript
// ❌ BAD: Code first (no plan)
function calculateTotal(items) {
  // Um... what should this do?
  // What if items is null?
  // Should tax be included?
}

// ✅ GOOD: Test first (clear plan)
test('calculateTotal adds all item prices', () => {
  const items = [
    { price: 10 },
    { price: 20 }
  ];
  expect(calculateTotal(items)).toBe(30);
});

// Now the code writes itself!
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

See how the test TELLS us what to build?

Press ENTER to continue...
```

[Tutorial continues interactively...]

---

## Key Lessons Taught

### Lesson 1: Why TDD?
- Blueprint analogy
- Prevents bugs
- Forces planning

### Lesson 2: RED Phase
```
Write test → Run it → It fails (RED) ✅
This is GOOD! We know our test works.
```

### Lesson 3: GREEN Phase
```
Write minimal code → Run test → It passes (GREEN) ✅
Only write enough to pass!
```

### Lesson 4: REFACTOR Phase
```
Clean up code → Run test → Still passes ✅
Tests protect you while improving.
```

### Lesson 5: Using Claude
```
GOOD prompt:
"I need a function that validates email addresses.
Write the TEST first, then the implementation."

BAD prompt:
"Write an email validator function"
```

---

## Hands-On Exercise

The tutorial includes building a real feature:

**Challenge:** Create a password strength checker

1. **Write test first:**
```typescript
test('weak password fails', () => {
  expect(checkPassword('123')).toBe(false);
});
```

2. **Claude helps implement:**
```typescript
function checkPassword(password) {
  return password.length >= 8;
}
```

3. **Add more tests:**
```typescript
test('strong password passes', () => {
  expect(checkPassword('MyStr0ng!Pass')).toBe(true);
});
```

---

## Progress Tracking

- Tutorial saves progress automatically
- Cannot skip ahead (must complete in order)
- Supervisor notified when completed
- Certificate of completion generated

---

## After Completion

Once finished, the developer:
- ✅ Understands WHY tests come first
- ✅ Knows the RED-GREEN-REFACTOR cycle
- ✅ Can write good prompts for Claude
- ✅ Has completed a real TDD feature

Next command: `/create-feature`

---

## For Supervisors

You'll receive notification when:
- Tutorial started
- Each lesson completed
- Final exercise passed
- Certificate earned

Progress report includes:
- Time spent per lesson
- Exercise attempts
- Understanding score

---

## Cannot Be Skipped

This tutorial is MANDATORY because:
- TDD is non-negotiable
- Protects junior developers
- Builds right habits
- Prevents costly mistakes

---

## Integration

After `/learn-tdd`, they're ready for:
- `/create-feature` - Build with TDD
- `/check-tdd` - Verify compliance
- `/fix-tests` - Get help when stuck

---

## Notes

- Interactive and engaging
- Learn by doing, not reading
- Celebrates successes
- Never makes them feel bad
- Always available for review