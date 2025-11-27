# Setup Test Auth

**Command**: `/setup-test-auth`

**Description**: Automatically configures real authentication credentials for Playwright testing. This is REQUIRED before any visual/E2E tests can run.

---

## What it does

1. **Checks for existing credentials** - Looks for configured test credentials
2. **Prompts for credentials if missing** - Asks for email/password once
3. **Stores securely** - Saves to `.env.test.local` (git-ignored)
4. **Validates credentials** - Tests login to ensure they work
5. **Enables automatic testing** - All future tests use these credentials

---

## Usage

```
/setup-test-auth
```

Then provide:
- Your real login email
- Your real login password

---

## Automatic Integration

This command is **automatically called** when:
- `/build-feature` is run for the first time
- `/test-feature` needs to run Playwright tests
- `/finalize-feature` runs visual regression tests
- Any E2E test is generated

---

## Example

```
User: /setup-test-auth

Claude:
🔐 Setting up Test Authentication

Checking for existing credentials...
❌ No credentials found

Please provide your login credentials for testing:
(These will be stored securely and never committed to git)

Email: seantfriedlund34@gmail.com
Password: [hidden input]

✅ Validating credentials...
✅ Successfully logged in!
✅ Credentials saved to .env.test.local

Your tests will now automatically use these credentials.
No further setup needed!
```

---

## Security Notes

- Credentials are stored in `.env.test.local`
- This file is automatically added to `.gitignore`
- Never shared or committed
- Only used for local testing
- Can be updated anytime with `/setup-test-auth`

---

## One-Time Setup

You only need to run this ONCE per project. After that, all tests automatically use your credentials.