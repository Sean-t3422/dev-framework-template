# Test Feature (Visual + E2E)

**Command**: `/test-feature`

**Description**: Automatically runs visual and E2E tests with Playwright after implementation. Takes screenshots, analyzes UI, and catches issues before manual testing.

---

## What it does

1. **Auto-detects credentials** - Sets up auth if not configured
2. **Starts dev server** - Ensures app is running
3. **Runs Playwright tests** - Executes all E2E tests
4. **Takes screenshots** - Captures UI across viewports
5. **Analyzes visually** - AI checks for UI issues
6. **Generates report** - HTML report with screenshots
7. **Blocks if issues** - Prevents deployment if critical issues found

---

## Usage

### Automatic (triggered by workflow)
Runs automatically after `/build-feature` implementation

### Manual
```
/test-feature [feature-name]
```

---

## Automatic Workflow Integration

```mermaid
graph TD
    A[/build-feature] --> B[Generate Tests]
    B --> C[Implement Feature]
    C --> D[Unit Tests Pass]
    D --> E[**/test-feature RUNS**]
    E --> F{Visual Tests Pass?}
    F -->|Yes| G[✅ Ready for Review]
    F -->|No| H[❌ Fix Required]
```

---

## What Gets Tested

### 1. Visual Regression
- Screenshots across desktop/tablet/mobile
- Comparison with baselines
- Layout consistency

### 2. Accessibility
- WCAG compliance
- Keyboard navigation
- Screen reader support
- Color contrast

### 3. Responsive Design
- No horizontal scroll
- Touch targets on mobile
- Content visibility

### 4. Real User Flows
- Login with real credentials
- Form submissions
- Data persistence
- Error handling

### 5. Performance
- Load times < 3s
- FCP < 1.8s
- Resource optimization

---

## Example Output

```
User: /test-feature user-settings

Claude:
🎭 Running Visual & E2E Tests for: user-settings

🔐 Using configured credentials...
✅ Logged in as: seantfriedlund34@gmail.com

📱 Testing across viewports...
  ✅ Desktop (1920x1080): Passed
  ✅ Tablet (768x1024): Passed
  ✅ Mobile (390x844): Passed

♿ Accessibility audit...
  ✅ No WCAG violations
  ✅ Keyboard navigable
  ✅ Proper ARIA labels

🖼️ Visual analysis...
  Overall Score: 92%
  Layout: ✅ Excellent
  Responsive: ✅ Excellent
  Accessibility: ✅ Good
  Performance: ⚠️ Minor issues

💡 Suggestions:
  - Optimize image loading
  - Add loading states for async operations

📊 Reports generated:
  Visual: test-results/playwright/user-settings/visual-report.html
  Screenshots: test-results/playwright/user-settings/screenshots/

✅ PASSED - Ready for manual review
```

---

## Failure Handling

If tests fail:

```
❌ VISUAL TESTS FAILED

Critical Issues Found:
  - Horizontal scroll on mobile
  - Button text not visible
  - Form validation not working

Next steps:
1. Review visual report
2. Fix identified issues
3. Re-run: /test-feature user-settings

Blocking deployment until fixed.
```

---

## Behind the Scenes

Runs these automated steps:
1. `node cli/testing/test-credentials.js check`
2. `node cli/testing/playwright-test-runner.js test <feature>`
3. `node cli/testing/screenshot-analyzer.js analyze`
4. `node .claude/hooks/post-build-visual-test.js`

---

## Notes

- **Automatic**: Runs as part of build workflow
- **Real data**: Uses your actual login credentials
- **Blocks bad UI**: Won't let broken UI reach production
- **No manual commands**: Everything is automated

---

## Success Criteria

Tests pass when:
- ✅ All viewports render correctly
- ✅ No accessibility violations
- ✅ Screenshots match expectations
- ✅ Performance within limits
- ✅ Real login/logout works