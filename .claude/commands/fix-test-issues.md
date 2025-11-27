# Fix Test Issues

**Command**: `/fix-test-issues`

**Description**: Automatically diagnoses and fixes common test problems including styling issues, login failures, and selector mismatches.

---

## What it does

1. **Diagnoses the problem** - Identifies what type of test failure
2. **Applies automatic fixes** - Clears cache, rebuilds, fixes selectors
3. **Updates test files** - Corrects login flow and selectors
4. **Verifies fix** - Re-runs tests to confirm resolution

---

## Usage

```
/fix-test-issues [issue-type]
```

Issue types:
- `styles` - CSS/Tailwind not loading
- `login` - Can't log in during tests
- `selectors` - Elements not found
- `all` - Try all fixes

---

## Automatic Fixes Applied

### For Styling Issues
```bash
# Automatically runs:
rm -rf .next
npm run dev
# Rebuilds and verifies styles load
```

### For Login Issues
```javascript
// Automatically updates tests to:
// 1. Click "Email Login" tab first
// 2. Wait for email field
// 3. Use real credentials
```

### For Selector Issues
```javascript
// Automatically updates to flexible selectors:
// FROM: [data-testid="specific-id"]
// TO: button:has-text("Save"), [type="submit"]
```

---

## Example Output

```
User: /fix-test-issues login

Claude:
🔧 Diagnosing test login issues...

Found problems:
❌ Tests not clicking "Email Login" tab
❌ Waiting for wrong selector
❌ Using outdated credentials

Applying fixes:
✅ Updated login flow in 3 test files
✅ Added "Email Login" tab click
✅ Updated selectors to match UI
✅ Verified credentials are current

Re-running tests...
✅ Login now works!

3 test files updated:
- settings.e2e.test.ts
- profile.e2e.test.ts
- user-settings.e2e.test.ts

Tests now passing: 15/27 (up from 3/27)
```

---

## Common Issues & Auto-Fixes

### 1. "CSS not loading" / "Styles missing"
**Auto-fix**: Clears .next folder and rebuilds

### 2. "Cannot find email input"
**Auto-fix**: Adds Email Login tab click before filling

### 3. "Element not found" / "Timeout waiting for selector"
**Auto-fix**: Updates to flexible selectors that match current UI

### 4. "Event handlers cannot be passed to Client Component"
**Auto-fix**: Identifies and reports server/client boundary issues

### 5. "Tests pass locally but fail in CI"
**Auto-fix**: Adds proper environment variables and timeouts

---

## Manual Fixes Suggested

Sometimes the command will suggest manual fixes:

```
⚠️ Manual fix needed:

The component at src/app/settings/page.tsx is passing
an onUpdate function from server to client component.

Move the function definition to the client component:
- Move lines 45-48 to SettingsClient.tsx
- Remove onUpdate prop from line 52

Then re-run: /fix-test-issues
```

---

## Integration with Workflow

This command is automatically suggested when:
- `/test-feature` fails with known issues
- `/build-feature` encounters test failures
- E2E tests have < 20% pass rate

---

## Quick Fix Priority

The command fixes issues in this order:
1. 🔴 **Critical**: Login flow (blocks all tests)
2. 🔴 **Critical**: Build issues (.next corruption)
3. 🟡 **Important**: Selector mismatches
4. 🟡 **Important**: Timeout adjustments
5. 🟢 **Minor**: Visual regression updates

---

## When NOT to Use

Don't use this command for:
- Logical errors in code (fix the code)
- Database issues (check migrations)
- Genuine test failures (fix the feature)

This is for TEST INFRASTRUCTURE issues, not code bugs.

---

## Success Metrics

After running `/fix-test-issues`:

**Good outcome**:
- Login works: ✅
- Styles load: ✅
- E2E pass rate: > 50%
- Unit tests: Still 100%

**Perfect outcome**:
- All E2E tests pass
- Visual regression matches
- No manual fixes needed

---

## Related Commands

- `/setup-test-auth` - Configure credentials
- `/test-feature` - Run full test suite
- `/build-feature` - Complete development workflow