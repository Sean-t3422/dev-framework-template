# Orchestration Hub (TDD Progressive Testing)

**Command**: `/orchestration-hub`

**Description**: Starts the TDD Orchestration Hub for autonomous testing enforcement during BUILD phase. Implements progressive testing thresholds discovered through experience.

---

## What it does

Starts a hub that:
1. **Monitors implementation agents** automatically
2. **Enforces progressive TDD** with phase-appropriate thresholds
3. **Eliminates manual copy-paste** between TDD enforcer and builders
4. **Tracks multiple builds** in parallel

---

## Usage

### Start the hub
```
/orchestration-hub
```

### Start with options
```
/orchestration-hub --port 8888 --monitor
```

### Stop the hub
```
/orchestration-hub --stop
```

---

## Progressive Testing Strategy

The hub implements YOUR discovered pattern:

| Phase | Expected Pass Rate | Notes |
|-------|-------------------|-------|
| **Phase 1** (Database/Core) | 20-30% | Unit tests need later implementations |
| **Phase 2** (API/Logic) | 40-50% | More tests can pass with API layer |
| **Phase 3** (UI/Integration) | 70-80% | Most tests should work now |
| **Phase 4** (Final/Polish) | 95-100% | All tests must pass |

---

## Integration with /build-feature

When you run `/build-feature`, the orchestration automatically:
1. Detects when entering BUILD phase
2. Starts the hub if not running
3. Connects implementation agents
4. Monitors TDD compliance

---

## Example Workflow

**User says:** `/orchestration-hub`

**Claude responds:**
```
🚀 Starting TDD Orchestration Hub...

Testing Strategy:
  Phase 1: 20-30% passing expected (unit tests need later phases)
  Phase 2: 40-50% passing expected
  Phase 3: 70-80% passing expected
  Phase 4: 95-100% required

✅ Hub running at:
  HTTP API: http://localhost:7777
  WebSocket: ws://localhost:7778

Status:
  Active sessions: 0
  Ready for builds

The hub will automatically:
- Receive reports from implementation agents
- Validate TDD compliance with progressive thresholds
- Send directives (PROCEED/BLOCKED/WARNING)
- Track all build sessions

Implementation agents should POST reports to:
  http://localhost:7777/report

To monitor in real-time, connect to:
  ws://localhost:7778
```

---

## Behind the scenes

This command runs:
```bash
node testing-framework/tdd-orchestration-hub-v2.js
```

The hub then:
1. Listens for implementation reports
2. Validates against phase-appropriate thresholds
3. Sends intelligent directives
4. Never blocks unnecessarily

---

## Monitoring

### Check status
```
/orchestration-hub --status
```

Shows:
- Active build sessions
- Current phase for each build
- Test pass rates
- Recent directives

### Live monitoring
Open in browser:
```html
http://localhost:7777/monitor
```

Or connect via WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:7778');
ws.on('message', (data) => {
  console.log('Hub event:', JSON.parse(data));
});
```

---

## When to use

### ✅ Start hub when:
- Beginning any `/build-feature`
- Entering TDD implementation phase
- Managing multiple parallel builds
- Want autonomous TDD enforcement

### ⚠️ Hub is for BUILD phase only:
- NOT needed during DISCOVER (brief)
- NOT needed during SPEC (specification)
- NOT needed during design selection
- ONLY needed when actual coding starts

---

## Configuration

Default settings:
- **Port**: 7777 (HTTP API)
- **WebSocket**: 7778 (monitoring)
- **Max files before test suggestion**: 3
- **Progressive thresholds**: Enabled
- **Token spend warnings**: Ignored

---

## Common Patterns

### Pattern 1: Auto-start with build
```
/build-feature "user profile"
[... brief, spec, design ...]
[Orchestration auto-starts hub]
"TDD Hub connected - monitoring implementation"
```

### Pattern 2: Multiple builds
```
/orchestration-hub
[Start Build-010 in terminal 1]
[Start Build-011 in terminal 2]
[Hub manages both simultaneously]
```

### Pattern 3: Recovery from violation
```
Agent: "Tests show 15% passing"
Hub: "WARNING - Below Phase 1 minimum"
Agent: [Fixes critical issues]
Agent: "Tests now 25% passing"
Hub: "PROCEED - Meeting Phase 1 expectations"
```

---

## Troubleshooting

**"Port already in use"**
```bash
# Check what's using port 7777
lsof -i :7777
# Kill if needed
kill -9 [PID]
```

**"Hub not responding"**
- Check hub is running: `/orchestration-hub --status`
- Verify port 7777 is accessible
- Check firewall settings

**"Getting blocked incorrectly"**
- Hub uses progressive thresholds
- Phase 1 only needs 20-30% passing
- Check agent is reporting phase correctly

---

## Benefits

1. **Eliminates manual copy-paste** between TDD enforcer and builders
2. **Allows parallel builds** without confusion
3. **Progressive thresholds** match reality (not rigid 80% gates)
4. **Autonomous enforcement** - you just monitor
5. **Learns from patterns** - agents adapt behavior

---

## Success Metrics

After using the hub:
- **Time saved**: 2-3 hours per feature
- **Copy-paste eliminated**: 100%
- **TDD compliance**: 100% (automatically enforced)
- **Parallel builds supported**: 3-4 simultaneously
- **Your involvement**: Monitor only, no manual orchestration

---

## Notes

- Hub focuses on Gate 5 (test execution) only
- Other gates handled by main orchestration
- Progressive thresholds based on real-world experience
- Never mentions token spend (that's irrelevant)
- Understands unit tests need later phases to pass

---

## Related Commands

- `/build-feature` - Starts feature development (auto-integrates with hub)
- `/review-feature` - Cross-LLM review (separate from hub)
- `/finalize-feature` - Quality gates check (uses hub data)