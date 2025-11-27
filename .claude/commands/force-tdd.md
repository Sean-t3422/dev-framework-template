# Force TDD

**Command**: `/force-tdd`

**Description**: ENFORCES Test-Driven Development. Cannot be bypassed. Tracks and ensures tests are run FIRST, fail FIRST, then guides implementation to match EXACTLY what tests expect.

---

## What it does

1. **Starts TDD enforcement** - Locks the feature in TDD mode
2. **Runs tests immediately** - Forces RED phase
3. **Captures test expectations** - Parses what functions tests expect
4. **Blocks wrong implementations** - Prevents creating wrong files/functions
5. **Verifies implementation matches** - Ensures you build what tests want
6. **Only unlocks after tests pass** - GREEN phase must be achieved

---

## Usage

```
/force-tdd <feature-name>
```

Then:
1. Tests run automatically (they MUST fail)
2. You see EXACTLY what functions are expected
3. You implement ONLY those functions
4. Tests run again until they pass

---

## Example - CORRECT TDD Flow

```
User: /force-tdd user-reports

Claude:
🔴 Starting TDD Enforcement for: user-reports
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Running tests to capture expectations...

❌ Tests failed (GOOD! This is the RED phase)

📋 Test Expectations Captured:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Expected Files:
   - src/lib/reports/data-formatter.ts
   - src/lib/reports/export-csv.ts

🔧 Expected Functions:
   - formatCurrency(value)
   - formatPercentage(value, decimals)
   - formatPhoneNumber(phone)    <-- NOT formatPhone!
   - generateCSV(data, options)   <-- NOT arrayToCSV!

📦 Expected Exports:
   - formatCurrency
   - formatPercentage
   - formatPhoneNumber

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ NOW IMPLEMENT EXACTLY THESE FUNCTIONS!

[User implements the functions]

🔍 Checking implementation...
✅ Created: src/lib/reports/data-formatter.ts
✅ Contains: formatPhoneNumber (matches test expectation)
❌ ERROR: You created formatPhone but tests expect formatPhoneNumber!

🔧 FIX: Rename to exactly what tests expect!

[User fixes the function name]

🧪 Running tests...
✅ Tests passing! GREEN phase complete

You can now refactor if needed.
```

---

## What Gets Enforced

### 🔴 RED Phase (Forced)
- Tests MUST be run first
- Tests MUST fail
- Cannot write any code until tests fail
- Test expectations are captured

### 🟢 GREEN Phase (Guided)
- Can only implement expected files
- Must use expected function names
- Must match expected signatures
- Tests must pass to proceed

### 🔵 REFACTOR Phase (Optional)
- Can improve code
- Tests must stay green
- Can extract, rename, optimize

---

## Enforcement Rules

**CANNOT**:
- Skip running tests first
- Create different file names than tests expect
- Use different function names than tests expect
- Proceed without tests passing

**MUST**:
- Run tests first (RED)
- Read test failures
- Implement exact function names
- Make tests pass (GREEN)

---

## Example Violations & Fixes

### Violation: Wrong Function Name
```
❌ Tests expect: formatPhoneNumber
❌ You created: formatPhone
🔧 FIX: Rename to formatPhoneNumber
```

### Violation: Wrong File Location
```
❌ Tests expect: src/lib/reports/data-formatter.ts
❌ You created: src/lib/reports/formatters.ts
🔧 FIX: Create file at expected location
```

### Violation: Missing Export
```
❌ Tests import: { formatCurrency }
❌ You didn't export it
🔧 FIX: Add: export { formatCurrency }
```

---

## Why This Exists

The problem: Even when told to "follow TDD", implementations are created without looking at tests, leading to:
- Wrong file names (formatters.ts vs data-formatter.ts)
- Wrong function names (formatPhone vs formatPhoneNumber)
- Missing exports that tests expect
- Aliasing and adapter files as band-aids

This command PREVENTS that by enforcing the TDD cycle.

---

## Emergency Commands

```
/force-tdd status    # Check current TDD state
/force-tdd verify    # Verify tests pass
/force-tdd complete  # Mark cycle complete
/force-tdd reset     # Emergency reset (avoid!)
```

---

## Integration with Build Workflow

When `/build-feature` is run, it automatically:
1. Starts `/force-tdd` for the feature
2. Ensures tests are run first
3. Captures expectations
4. Guides implementation
5. Verifies tests pass

---

## Success Metrics

**Perfect TDD**:
- 0 violations
- Tests fail first
- Implementation matches exactly
- Tests pass without modifications

**Good TDD**:
- < 3 violations
- Minor name mismatches
- Tests pass with small fixes

**Failed TDD**:
- Tests modified to match implementation (backwards!)
- Alias files created
- Band-aid fixes

---

## The Golden Rule

> **Tests are the specification. Implementation must match tests, not the other way around.**

No exceptions. No bypassing. No band-aids.