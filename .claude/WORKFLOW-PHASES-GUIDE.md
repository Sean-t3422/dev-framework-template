# Workflow Phases Guide - Unified Orchestration with Codex

**NEW APPROACH**: The unified orchestrator now handles all feature workflows with Codex as the master orchestrator.

---

## The Complete Workflow

```
EXTENDED DISCOVER → FOCUSED DESIGN → BATCHED BUILD → VALIDATED FINALIZE
```

---

## Phase 1: EXTENDED DISCOVER (Thorough Planning Before Implementation)

### Step 1.1: Generate Comprehensive Discovery Questions

**Codex generates 15-20 questions covering:**

- Users & Permissions
- Security & Compliance
- Scope & Boundaries
- Technical Approach
- User Experience
- Success Criteria

### Step 1.2: ⏸️ HUMAN CONFIRMATION POINT #1

**WAIT for user to answer ALL questions before proceeding.**

### Step 1.3: Brief Generation with Codex Review

1. **Invoke brief-writer agent** with user's answers
2. **Codex reviews brief** for engineering balance
3. **If APPROVED** → Move to Phase 2
4. **If REJECTED** → Refine and repeat (max 3 rounds)

---

## Phase 2: DESIGN (Test Strategy & Architecture)

### Step 2.1: Generate Test Strategy

- Test coverage requirements (unit, integration, e2e, security)
- Key test scenarios
- Database schema design
- API endpoints design
- UI components design

### Step 2.2: Codex Reviews Design

- If APPROVED → Move to Phase 3
- If REJECTED → Refine and repeat (max 3 rounds)

---

## Phase 3: BUILD (Complexity Detection → Implementation)

### Step 3.1: Analyze Complexity

Count in the design document:
- tables/migrations
- api routes/endpoints
- components/pages
- services/functions

### Step 3.2: Complexity Decision

**IF (estimatedBlueprints > 5 OR estimatedMinutes > 30 OR tables > 2):**
→ Use HIERARCHICAL ORCHESTRATION

**ELSE:**
→ Use TRADITIONAL TDD (generate tests, implement, Codex checkpoints)

### Step 3.3A: If SIMPLE - Traditional TDD

1. Generate tests (tdd-enforcer agent)
2. Codex reviews tests
3. Run tests (should fail - red)
4. Implement code
5. Codex checkpoint review
6. Run tests (should pass - green)

### Step 3.3B: If COMPLEX - Hierarchical Orchestration

1. Save design/spec to file
2. Run master-orchestrator to generate execution plan
3. Execute plan layer by layer (batched, max 5 at once)
4. Codex reviews each batch
5. Complete!

---

## Phase 4: FINALIZE (Cleanup)

1. Run final tests
2. Check for TODO comments
3. Update documentation
4. Done!

---

## Quick Reference: Agent Names

- `brief-writer` - Creates requirements briefs
- `spec-writer` - Creates detailed technical specs
- `testing-coordinator` - Generates test strategies and test files
- `codex-reviewer` - Reviews code/designs for security, quality, balance
- `master-orchestrator` - Creates execution plans (for complex features)
- `general-purpose` - Executes blueprints
- `tdd-enforcer` - Enforces TDD workflow

---

## Remember

✅ **ALWAYS ask discovery questions BEFORE creating brief**
✅ **ALWAYS get Codex approval before moving to next phase**
✅ **ALWAYS check complexity before deciding orchestration vs TDD**
✅ **NEVER skip phases** - they exist for quality and safety
