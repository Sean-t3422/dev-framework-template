# Evidence Collection

This directory stores evidence artifacts that prove feature completion and quality standards are met. Evidence is required for progression through the workflow phases.

## Directory Structure

```
evidence/
├── session-{id}/           # Per-session evidence
│   ├── layer-0.json        # Layer execution results
│   ├── layer-1.json
│   ├── screenshots/        # Visual evidence
│   │   ├── api-test.png
│   │   └── ui-complete.png
│   ├── logs/              # Execution logs
│   │   ├── test-output.log
│   │   └── performance.log
│   └── metrics/           # Performance data
│       ├── api-response.json
│       └── db-queries.json
└── README.md
```

## Evidence Requirements by Type

### Database Operations
- [ ] Schema migration successful
- [ ] RLS policies verified
- [ ] Query performance < 100ms
- [ ] Screenshot of table structure

### API Endpoints
- [ ] All tests passing
- [ ] Response time < 200ms P95
- [ ] Error handling verified
- [ ] Screenshot/log of successful requests

### UI Components
- [ ] Visual screenshot
- [ ] Console free of errors
- [ ] Accessibility checks passed
- [ ] Performance metrics (LCP, FID, CLS)

### Integration Tests
- [ ] Test suite output
- [ ] Coverage report > 85%
- [ ] No failing tests
- [ ] Performance benchmarks met

## Collection Process

1. **During Execution**: Each blueprint execution must produce evidence
2. **Layer Completion**: Evidence aggregated per execution layer
3. **Phase Validation**: Evidence reviewed before phase progression
4. **Final Audit**: All evidence validated in FINALIZE phase

## Evidence Format

### JSON Structure
```json
{
  "blueprintId": "bp-api-12345",
  "timestamp": "2024-01-01T00:00:00Z",
  "success": true,
  "evidence": {
    "tests": {
      "passed": 42,
      "failed": 0,
      "coverage": 87.5
    },
    "performance": {
      "p50": 45,
      "p95": 189,
      "p99": 234
    },
    "screenshots": [
      "evidence/session-123/screenshots/api-test.png"
    ],
    "logs": [
      "evidence/session-123/logs/test-output.log"
    ]
  }
}
```

## Validation Criteria

Evidence is considered valid when:
1. All required fields are present
2. Tests show passing status
3. Performance meets targets
4. Visual evidence confirms functionality
5. No critical errors in logs

## Retention Policy

- Active sessions: Keep all evidence
- Completed features: Archive after 30 days
- Failed attempts: Keep for debugging (7 days)
- Production releases: Permanent archive

## Tools for Evidence Collection

- Screenshots: Playwright, Puppeteer, or manual capture
- Logs: Console output, test runners, application logs
- Metrics: Performance API, database explain plans
- Tests: Jest, Vitest, Playwright reports

## Important Notes

- **Never proceed without evidence** - This is a hard requirement
- **Evidence must be reproducible** - Include commands/steps
- **Automate where possible** - Reduce manual collection
- **Version control excluded** - Don't commit evidence files (too large)