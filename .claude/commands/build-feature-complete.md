# Build Feature Complete

**Command**: `/build-feature-complete`

**Description**: The REAL build-feature command that AUTOMATICALLY runs ALL steps without human intervention. Cannot be stopped midway. Enforces complete TDD workflow.

---

## What It Does (AUTOMATICALLY)

1. **Creates Brief** (brief-writer agent)
2. **Creates Spec** (spec-writer agent)
3. **Generates Tests** (testing-coordinator agent)
4. **Runs Tests & Captures Contract** (tdd-enforcer agent)
5. **Shows Implementation Requirements** (exact function names)

**ALL STEPS RUN AUTOMATICALLY - NO MANUAL INTERVENTION NEEDED**

---

## Usage

```
/build-feature-complete [requirements]
```

Or if you already ran `/build-feature` and it stopped:
```
/build-feature-complete --continue
```

---

## The Difference

### ❌ Old `/build-feature` (What keeps happening):
```
1. Creates brief ✅
2. Creates spec ✅
3. STOPS ❌
4. Never generates tests ❌
5. Jumps to implementation ❌
```

### ✅ New `/build-feature-complete`:
```
1. Creates brief ✅
2. Creates spec ✅
3. Generates tests ✅ (AUTOMATIC)
4. Runs TDD enforcer ✅ (AUTOMATIC)
5. Shows exact functions ✅ (AUTOMATIC)
```

---

## Example

```
User: /build-feature-complete Teacher substitute system

Claude:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE BUILD WORKFLOW STARTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Step 1/5: Creating brief...
[Invoking brief-writer agent...]
✅ Brief created: briefs/active/019-substitute.md

📋 Step 2/5: Creating spec...
[Invoking spec-writer agent...]
✅ Spec created: specs/active/spec-019-substitute.md

🧪 Step 3/5: Generating tests...
[Invoking testing-coordinator agent...]
✅ Tests generated:
   - tests/unit/substitute/*.test.ts (12 files)
   - tests/integration/substitute/*.test.ts (5 files)

🔴 Step 4/5: Running TDD enforcement...
[Invoking tdd-enforcer agent...]
Running tests... FAILED (Good! RED phase)

📋 TEST CONTRACT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Expected Functions:
- createAbsenceRequest(teacherId, type, familyIds?)
- sendSubstituteNotifications(classId, date)
- acceptSubstituteRequest(requestId, substituteId)
- checkCooldownPeriod(substituteId)
- notifyAdministrator(assignmentDetails)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Step 5/5: Ready for implementation!

YOU MUST IMPLEMENT THESE EXACT FUNCTION NAMES.
No variations, no aliases.

Workflow complete. All tests generated and contract captured.
```

---

## Why This Solves The Problem

1. **Can't Stop Early** - All 5 steps run automatically
2. **Can't Skip Tests** - Steps 3 & 4 are mandatory
3. **Can't Use Wrong Names** - Contract shows exact names
4. **No Manual Steps** - Everything is automated

---

## For Your Sons / Other Users

They just need to know ONE command:
```
/build-feature-complete [what they want to build]
```

Everything else happens automatically. No babysitting needed!