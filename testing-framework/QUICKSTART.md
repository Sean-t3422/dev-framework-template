# Dev Framework Testing System - Quick Start

## What You Just Got

A **complete testing system** that combines:
- ✅ Automated test generation (like Luke's SAAW, but better)
- ✅ Cross-LLM competitive review (your innovation)
- ✅ Complexity-based quality gates
- ✅ TDD workflow automation

**This is YOUR IP** - no SAAW/Logelo branding.

---

## 5-Minute Demo

### 1. Create a Feature Brief

```bash
cd /home/sean_unix/Projects/dev-framework

cat > briefs/test-feature.json << 'EOF'
{
  "id": "test-feature",
  "title": "User Profile Update",
  "description": "Allow users to update their profile information",
  "requirements": [
    "Users can update name and email",
    "Email must be validated",
    "Changes are saved to Supabase"
  ]
}
EOF
```

### 2. Analyze Complexity

```bash
node testing-framework/cli.js analyze briefs/test-feature.json
```

**You'll see:**
```
📊 Analyzing feature complexity...

Complexity Analysis:
  Level: moderate (Moderate Feature)
  Confidence: 82%
  Test Strategy: Integration + unit tests for business logic
  Estimated Time: 3-5 files, < 200 lines

Test Types Required:
  - integration
  - unit

Coverage Targets:
  Lines: 50%
  Branches: 40%
  Functions: 45%

Recommendations:
  - Write integration tests for user workflows
  - Add unit tests for business logic
  - Cover main error cases
```

### 3. Generate Tests (TDD Style)

```bash
node testing-framework/cli.js generate briefs/test-feature.json
```

**You'll get:**
```
🎯 Generating tests for feature...

Generated 2 test files:

  ✓ integration: test-feature.integration.test.ts
  ✓ unit: test-feature.unit.test.ts

Test Plan:
  Complexity: moderate
  Strategy: Integration + unit tests for business logic
  Estimated Time: 30-60 minutes

Next Steps:
  1. Review all generated tests
  2. Implement features incrementally
  3. Make integration tests pass first
  4. Add unit tests for logic
  5. Ensure coverage targets met
```

### 4. Look at Generated Tests

```bash
cat tests/integration/test-feature.integration.test.ts
```

**You'll see TDD-style tests:**
```typescript
describe('UserProfile Integration Tests', () => {
  it('should update name and email', async () => {
    // TODO: Implement
    expect(true).toBe(false); // FAILING - Implement this test
  });

  it('should validate email format', async () => {
    // TODO: Implement
    expect(true).toBe(false); // FAILING - Implement this test
  });

  // etc...
});
```

### 5. Now Implement (Make Tests Pass)

This is TDD - you have failing tests, now make them pass!

---

## Real-World Usage

### For Homeschool-Coop Project

```bash
cd projects/homeschool-coop

# 1. Create brief for your next feature
cat > ../../briefs/class-scheduling.json << 'EOF'
{
  "id": "class-scheduling",
  "title": "Class Scheduling System",
  "description": "Co-op admins can create and schedule classes",
  "requirements": [
    "Admins can create new classes",
    "Classes have time slots and enrollment limits",
    "Parents can view available classes",
    "RLS enforces co-op boundaries"
  ]
}
EOF

# 2. Initialize complete testing workflow
node ../../testing-framework/cli.js init ../../briefs/class-scheduling.json

# Output shows:
# - Complexity: complex
# - 26 tests generated
# - Cross-LLM review REQUIRED (because it's complex)

# 3. Implement following TDD
npm test  # Keep this running

# 4. After implementation, mandatory cross-LLM review
node ../../testing-framework/cli.js review class-scheduling \
  src/app/admin/classes/page.tsx \
  src/lib/scheduling.ts

# 5. Finalize (checks all gates)
node ../../testing-framework/cli.js finalize class-scheduling

# If all passes, deploy!
```

---

## Key Differences from SAAW/Logelo

| Feature | SAAW/Logelo | Your System |
|---------|-------------|-------------|
| **Naming** | Story, SAAW Board | Feature, Brief/Blueprint |
| **Levels** | xs/s/m/l/xl | trivial/simple/moderate/complex/critical |
| **Cross-LLM** | Not included | **Fully integrated & mandatory for complex** |
| **A/B Testing** | Not included | **Built-in** |
| **Templates** | Generic | **Next.js + Supabase specific** |
| **Quality Gates** | Basic | **Enhanced with cross-LLM enforcement** |
| **IP Ownership** | Luke (SAAW), Luke+You (Logelo) | **100% Yours** |

---

## Integration with Your Existing Workflow

### Before
```
Brief → Blueprint → Code → Test → Deploy
```

### After
```
Brief → Analyze → Generate Tests (TDD) → Code → Cross-LLM Review (if complex) → Gates → Deploy
```

**Your existing scripts stay the same:**
- `scripts/cross-llm-test.sh` - Now called by orchestrator
- `scripts/ab-test-llms.sh` - Now accessible via CLI

---

## Commands Reference

```bash
# Analyze complexity only
node testing-framework/cli.js analyze <feature.json>

# Generate tests only
node testing-framework/cli.js generate <feature.json>

# Full workflow (analyze + generate + setup)
node testing-framework/cli.js init <feature.json>

# Run cross-LLM review
node testing-framework/cli.js review <featureId> <file1> <file2> ...

# Run A/B test across LLMs
node testing-framework/cli.js abtest "prompt" <models>

# Finalize and check all gates
node testing-framework/cli.js finalize <featureId>

# Help
node testing-framework/cli.js help
```

---

## What Was Generated

```
testing-framework/
├── complexity-analyzer.js    # Determines feature complexity
├── test-generator.js         # Creates TDD-style tests
├── test-orchestrator.js      # Coordinates workflow + cross-LLM
├── quality-gates.js          # Enforces quality standards
├── cli.js                    # Command-line interface
├── index.js                  # Main entry point
├── package.json              # Package definition
├── README.md                 # Full documentation
└── QUICKSTART.md             # This file
```

---

## Next Steps

1. **Try the demo** (see 5-Minute Demo above)
2. **Read full docs**: `testing-framework/README.md`
3. **Review strategy**: `docs/3-testing-strategy.md`
4. **Use for next feature** in homeschool-coop

---

## Questions?

**"Why is this better than SAAW?"**
- Adds cross-LLM competitive review
- Integrates your existing scripts
- Next.js + Supabase templates
- Your own IP

**"Do I have to use it for everything?"**
- No! Only trivial changes skip tests
- Simple features: quick tests only
- Complex/Critical: Full workflow

**"What if I just want complexity analysis?"**
```bash
node testing-framework/cli.js analyze briefs/feature.json
```

**"Can I customize complexity levels?"**
- Yes! Edit `complexity-analyzer.js`
- Adjust coverage targets
- Modify test types

---

## Pro Tips

1. **Start small** - Use for one new feature first
2. **Trust the system** - If it says "complex", it probably is
3. **Use cross-LLM review** - It catches real bugs
4. **Don't over-test** - Trivial changes don't need tests
5. **Follow TDD** - Write tests first (system does this for you)

---

## Success!

You now have a **complete testing system** that:
- ✅ Generates tests before coding (TDD)
- ✅ Adapts to feature complexity
- ✅ Enforces cross-LLM review when needed
- ✅ Prevents untested code from deploying
- ✅ Is 100% your own IP

**Ready to use for homeschool-coop!**
