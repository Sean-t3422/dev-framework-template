# Autonomous TDD Orchestration Setup

## The Problem You're Solving

Currently, you're manually copy-pasting between:
1. **TDD Enforcement Chat** (Cursor extension) - Validates TDD compliance
2. **Implementation Agents** (Claude Code terminals) - Write code and tests
3. Back and forth, back and forth...

## The Solution: Autonomous Orchestration

The TDD Orchestration Hub acts as an autonomous middleman that:
- Receives reports from implementation agents automatically
- Validates TDD compliance in real-time
- Sends directives back to agents
- Blocks violations without your intervention
- Maintains state across multiple parallel builds

## Architecture

```
┌─────────────────────┐     HTTP POST      ┌──────────────────────┐
│  Implementation     │────────────────────>│   TDD Orchestration  │
│  Agent (Build 010)  │<────────────────────│        Hub           │
│                     │     Directives      │                      │
└─────────────────────┘                     │   - Validates TDD    │
                                            │   - Tracks state     │
┌─────────────────────┐     HTTP POST      │   - Sends directives │
│  Implementation     │────────────────────>│   - Blocks violations│
│  Agent (Build 011)  │<────────────────────│                      │
│                     │     Directives      └──────────────────────┘
└─────────────────────┘                              ▲
                                                     │
┌─────────────────────┐                              │
│  Your TDD Extension │──────────────────────────────┘
│  (Monitoring Only)  │         WebSocket
└─────────────────────┘     (Real-time updates)
```

## Quick Start

### 1. Start the TDD Orchestration Hub

```bash
# In one terminal, start the hub
node testing-framework/tdd-orchestration-hub.js

# Output:
# 🚀 TDD Orchestration Hub Starting...
#    HTTP API: http://localhost:7777
#    WebSocket: ws://localhost:7778
```

### 2. Configure Your Implementation Agents

Add this to the beginning of your implementation agent's prompt:

```markdown
## TDD Orchestration Integration

You are integrated with an autonomous TDD Orchestration Hub.

**MANDATORY: After EVERY action, report to the hub:**

1. After writing files:
   ```javascript
   // Report: POST to http://localhost:7777/report
   {
     "sessionId": "build-010-[timestamp]",
     "buildId": "build-010",
     "agent": "Build-010-Agent",
     "feature": "[feature-name]",
     "phase": "[current-phase]",
     "action": "implementation",
     "files": ["path/to/file.ts"],
     "message": "Implemented [what]"
   }
   ```

2. After running tests:
   ```javascript
   // Report: POST to http://localhost:7777/report
   {
     "sessionId": "[same-session-id]",
     "buildId": "build-010",
     "agent": "Build-010-Agent",
     "phase": "[current-phase]",
     "action": "test_run",
     "testResults": {
       "total": 82,
       "passing": 45,
       "failing": 37
     },
     "message": "Tests: 45/82 passing (54.9% GREEN)"
   }
   ```

3. Wait for directive in response:
   - If status: "PROCEED" → Continue
   - If status: "BLOCKED" → STOP and follow corrective actions

**You CANNOT proceed if blocked. The hub enforces TDD strictly.**
```

### 3. Monitor in Your TDD Extension

Your Cursor extension can monitor everything via WebSocket:

```javascript
// In your extension
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7778');

ws.on('message', (data) => {
  const event = JSON.parse(data);

  switch(event.type) {
    case 'report':
      console.log(`📥 ${event.sessionId}: ${event.report.message}`);
      break;

    case 'directive':
      if (event.directive.status === 'BLOCKED') {
        console.log(`🛑 BLOCKED: ${event.directive.message}`);
      } else {
        console.log(`✅ APPROVED: ${event.directive.message}`);
      }
      break;

    case 'session_complete':
      console.log(`🏁 Complete: ${event.summary.feature} - ${event.summary.duration}`);
      break;
  }
});
```

## Integration Methods

### Method 1: Shell Script Wrapper (Easiest)

Create a wrapper script your agents can call:

```bash
#!/bin/bash
# tdd-report.sh

SESSION_ID="build-${BUILD_ID}-$(date +%s)"
HUB_URL="http://localhost:7777"

report_action() {
  local action=$1
  local message=$2
  local extra=$3

  response=$(curl -s -X POST ${HUB_URL}/report \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"${SESSION_ID}\",
      \"buildId\": \"${BUILD_ID}\",
      \"agent\": \"${AGENT_NAME}\",
      \"phase\": \"${CURRENT_PHASE}\",
      \"action\": \"${action}\",
      \"message\": \"${message}\",
      ${extra}
    }")

  echo "$response" | jq -r '.message'

  if echo "$response" | grep -q '"status":"BLOCKED"'; then
    echo "🛑 BLOCKED BY TDD HUB"
    exit 1
  fi
}

# Usage in agent:
# After writing file:
./tdd-report.sh implementation "Wrote user model"

# After running tests:
./tdd-report.sh test_run "45/82 passing" '"testResults":{"total":82,"passing":45}'
```

### Method 2: Direct HTTP Integration

Your agents make HTTP calls directly:

```typescript
// In your implementation agent code
async function reportToTDDHub(action: string, details: any) {
  const response = await fetch('http://localhost:7777/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      buildId: 'build-010',
      agent: 'Build-010-Agent',
      feature: currentFeature,
      phase: currentPhase,
      action: action,
      ...details
    })
  });

  const directive = await response.json();

  if (directive.status === 'BLOCKED') {
    throw new Error(`TDD VIOLATION: ${directive.message}`);
  }

  return directive;
}
```

### Method 3: Use the TDDAgentClient Library

```javascript
const TDDAgentClient = require('./tdd-agent-client');

const tdd = new TDDAgentClient({
  agentId: 'Build-010-Agent',
  buildId: 'build-010',
  strictMode: true
});

// Start session
await tdd.startBuild('build-010', 'user-profile');

// After writing file
await tdd.reportFileWrite('src/models/user.ts', content);

// After running tests
await tdd.reportTestRun(testResults);

// Complete
await tdd.completeBuild();
```

## Real-World Workflow

### Your Current Manual Process:

1. **Build 010 Agent** writes 2 files
2. **You** copy output to TDD Extension
3. **TDD Extension** says "STOP - run tests first"
4. **You** paste back to Build 010 Agent
5. **Build 010 Agent** runs tests
6. **You** copy results to TDD Extension
7. **TDD Extension** says "OK, proceed"
8. **You** paste approval back
9. Repeat 50+ times per feature...

### With Autonomous Orchestration:

1. **Build 010 Agent** writes 2 files → Auto-reports to hub
2. **Hub** validates → Sends "BLOCKED - run tests" directive
3. **Build 010 Agent** receives block → Runs tests → Reports results
4. **Hub** validates → Sends "PROCEED" directive
5. **Build 010 Agent** continues → Next phase
6. **You** just monitor via WebSocket dashboard

## Monitoring Dashboard

Create a simple monitoring dashboard:

```html
<!DOCTYPE html>
<html>
<head>
  <title>TDD Orchestration Monitor</title>
  <style>
    .blocked { color: red; font-weight: bold; }
    .approved { color: green; }
    .session { border: 1px solid #ccc; margin: 10px; padding: 10px; }
  </style>
</head>
<body>
  <h1>TDD Orchestration Live Monitor</h1>
  <div id="sessions"></div>

  <script>
    const ws = new WebSocket('ws://localhost:7778');
    const sessions = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateSession(data);
    };

    function updateSession(data) {
      if (!sessions.has(data.sessionId)) {
        sessions.set(data.sessionId, {
          buildId: data.buildId || 'unknown',
          status: 'active',
          lastAction: '',
          violations: 0
        });
      }

      const session = sessions.get(data.sessionId);

      if (data.type === 'directive') {
        session.status = data.directive.status;
        if (data.directive.status === 'BLOCKED') {
          session.violations++;
        }
      }

      if (data.type === 'report') {
        session.lastAction = data.report.action + ': ' + data.report.message;
      }

      renderSessions();
    }

    function renderSessions() {
      const container = document.getElementById('sessions');
      container.innerHTML = '';

      sessions.forEach((session, id) => {
        const div = document.createElement('div');
        div.className = 'session';
        div.innerHTML = `
          <h3>${session.buildId}</h3>
          <p>Status: <span class="${session.status === 'BLOCKED' ? 'blocked' : 'approved'}">${session.status}</span></p>
          <p>Last: ${session.lastAction}</p>
          <p>Violations: ${session.violations}</p>
        `;
        container.appendChild(div);
      });
    }
  </script>
</body>
</html>
```

## Configuration Options

### Hub Configuration

```javascript
const hub = new TDDOrchestrationHub({
  port: 7777,              // HTTP API port
  wsPort: 7778,           // WebSocket port

  // TDD Rules
  maxFilesBeforeTest: 2,   // Block after 2 files
  requireE2E: true,        // E2E mandatory for UI
  requireManualQA: false,  // Can disable if E2E sufficient

  // Enforcement
  strictMode: true,        // Block on any violation
  autoResponse: true       // Send directives automatically
});
```

### Agent Configuration

```javascript
const tdd = new TDDAgentClient({
  hubUrl: 'http://localhost:7777',
  strictMode: true,        // Throw errors on blocks
  autoReport: true,        // Report all actions
  retryOnBlock: false      // Don't retry, fix first
});
```

## Common Patterns

### Pattern 1: Proactive Test Running

Agent learns from blocks and runs tests proactively:

```javascript
// After first block, agent adapts:
let filesWritten = 0;

async function writeFile(path, content) {
  await fs.writeFile(path, content);
  filesWritten++;

  await tdd.reportFileWrite(path, content);

  // Learned behavior: Run tests after 2 files
  if (filesWritten >= 2) {
    console.log('Running tests proactively...');
    const results = await runTests();
    await tdd.reportTestRun(results);
    filesWritten = 0;
  }
}
```

### Pattern 2: Phase-Based Reporting

```javascript
async function implementPhase(phaseName, implementation) {
  console.log(`Starting phase: ${phaseName}`);

  // Do implementation
  await implementation();

  // Always test after phase
  const testResults = await runTests();
  await tdd.reportTestRun(testResults);

  // Report phase complete
  await tdd.reportPhaseComplete(phaseName);
}
```

### Pattern 3: E2E Gate Enforcement

```javascript
async function completeFeature() {
  // Regular tests
  const unitResults = await runUnitTests();
  await tdd.reportTestRun(unitResults);

  // E2E required for UI
  if (hasUIComponents) {
    const e2eResults = await runE2ETests();
    await tdd.reportE2ETests(e2eResults);
  }

  // Request completion
  const directive = await tdd.requestCompletion();

  if (directive.status !== 'APPROVED') {
    throw new Error('Cannot complete - requirements not met');
  }
}
```

## Troubleshooting

### "Connection refused"
- Ensure hub is running: `node tdd-orchestration-hub.js`
- Check port 7777 is available

### "Constantly blocked"
- Agent not reporting test runs
- Check `filesWrittenSinceTest` counter
- Ensure test results format is correct

### "Sessions not completing"
- Call `completeBuild()` when done
- Check for unhandled blocks

## Benefits

1. **Zero Copy-Paste**: Agents communicate directly with hub
2. **Parallel Builds**: Multiple agents work simultaneously
3. **Automatic Enforcement**: TDD violations blocked instantly
4. **Real-Time Monitoring**: See everything via WebSocket
5. **Audit Trail**: All actions logged with timestamps
6. **Learning Agents**: Adapt behavior from violations

## Next Steps

1. Start the hub
2. Add reporting to one agent as a test
3. Monitor via WebSocket
4. Once working, roll out to all agents
5. Enjoy your coffee while agents orchestrate themselves!

## Example Success Metrics

After implementation:
- **Time saved**: 2-3 hours per feature
- **Copy-paste eliminated**: 100%
- **TDD compliance**: 100% (enforced)
- **Parallel builds**: 3-4 simultaneously
- **Your involvement**: Monitor only

The system handles the orchestration autonomously, exactly as you envisioned!