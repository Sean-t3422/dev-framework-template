#!/usr/bin/env node

/**
 * @fileoverview /orchestration-hub command implementation
 * Starts, stops, or checks status of TDD Orchestration Hub
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

const HUB_PID_FILE = path.join(process.cwd(), '.tdd-hub', 'hub.pid');
const HUB_LOG_FILE = path.join(process.cwd(), '.tdd-hub', 'hub.log');
const HUB_SCRIPT = path.join(__dirname, 'tdd-orchestration-hub-v2.js');

async function ensureHubDir() {
  await fs.mkdir(path.dirname(HUB_PID_FILE), { recursive: true });
}

async function isHubRunning() {
  try {
    const response = await fetch('http://localhost:7777/status');
    return response.ok;
  } catch {
    return false;
  }
}

async function getHubPID() {
  try {
    const pid = await fs.readFile(HUB_PID_FILE, 'utf-8');
    return parseInt(pid.trim());
  } catch {
    return null;
  }
}

async function startHub() {
  console.log('🚀 Starting TDD Orchestration Hub...\n');

  // Check if already running
  if (await isHubRunning()) {
    console.log('✅ Hub is already running!\n');
    await showStatus();
    return;
  }

  await ensureHubDir();

  // Start hub in background
  const logStream = await fs.open(HUB_LOG_FILE, 'w');
  const hub = spawn('node', [HUB_SCRIPT], {
    detached: true,
    stdio: ['ignore', logStream, logStream]
  });

  // Save PID
  await fs.writeFile(HUB_PID_FILE, hub.pid.toString());

  hub.unref();

  // Wait for hub to start
  let retries = 10;
  while (retries > 0) {
    if (await isHubRunning()) {
      console.log('Testing Strategy:');
      console.log('  Phase 1: 20-30% passing expected (unit tests need later phases)');
      console.log('  Phase 2: 40-50% passing expected');
      console.log('  Phase 3: 70-80% passing expected');
      console.log('  Phase 4: 95-100% required\n');

      console.log('✅ Hub running at:');
      console.log('  HTTP API: http://localhost:7777');
      console.log('  WebSocket: ws://localhost:7778\n');

      console.log('Status:');
      console.log('  Active sessions: 0');
      console.log('  Ready for builds\n');

      console.log('The hub will automatically:');
      console.log('- Receive reports from implementation agents');
      console.log('- Validate TDD compliance with progressive thresholds');
      console.log('- Send directives (PROCEED/BLOCKED/WARNING)');
      console.log('- Track all build sessions\n');

      console.log('Implementation agents should POST reports to:');
      console.log('  http://localhost:7777/report\n');

      console.log('To monitor in real-time, connect to:');
      console.log('  ws://localhost:7778\n');

      console.log('To stop the hub later:');
      console.log('  /orchestration-hub --stop');

      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    retries--;
  }

  console.error('❌ Failed to start hub. Check logs at:', HUB_LOG_FILE);
}

async function stopHub() {
  console.log('🛑 Stopping TDD Orchestration Hub...\n');

  const pid = await getHubPID();
  if (!pid) {
    console.log('Hub is not running (no PID file found)');
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    await fs.unlink(HUB_PID_FILE);
    console.log('✅ Hub stopped successfully');
  } catch (error) {
    if (error.code === 'ESRCH') {
      console.log('Hub process not found. Cleaning up PID file.');
      await fs.unlink(HUB_PID_FILE).catch(() => {});
    } else {
      console.error('❌ Error stopping hub:', error.message);
    }
  }
}

async function showStatus() {
  console.log('📊 TDD Orchestration Hub Status\n');

  const running = await isHubRunning();
  console.log(`Status: ${running ? '✅ Running' : '❌ Not running'}`);

  if (running) {
    try {
      const response = await fetch('http://localhost:7777/status');
      const data = await response.json();

      console.log(`\nActive Sessions: ${data.sessions?.length || 0}`);

      if (data.sessions?.length > 0) {
        console.log('\nSessions:');
        for (const session of data.sessions) {
          console.log(`  - ${session.sessionId}`);
          console.log(`    Phase: ${session.phase}`);
          console.log(`    Tests: ${session.testPassRate}% passing`);
          console.log(`    Files written since test: ${session.filesWrittenSinceTest}`);
        }
      }

      console.log('\nTesting Strategy:');
      if (data.strategy) {
        Object.entries(data.strategy).forEach(([phase, config]) => {
          console.log(`  ${phase}: ${config.minPassRate}-${config.targetPassRate}% expected`);
        });
      }
    } catch (error) {
      console.error('Error fetching status:', error.message);
    }
  } else {
    console.log('\nTo start the hub:');
    console.log('  /orchestration-hub');
  }
}

async function showHelp() {
  console.log('TDD Orchestration Hub - Command Help\n');
  console.log('Usage:');
  console.log('  /orchestration-hub           Start the hub');
  console.log('  /orchestration-hub --status  Check hub status');
  console.log('  /orchestration-hub --stop    Stop the hub');
  console.log('  /orchestration-hub --help    Show this help\n');
  console.log('The hub monitors TDD compliance with progressive thresholds:');
  console.log('- Phase 1: 20-30% tests passing OK');
  console.log('- Phase 2: 40-50% tests passing OK');
  console.log('- Phase 3: 70-80% tests passing expected');
  console.log('- Phase 4: 95%+ tests required');
}

// Main command handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case '--stop':
      case 'stop':
        await stopHub();
        break;

      case '--status':
      case 'status':
        await showStatus();
        break;

      case '--help':
      case 'help':
        await showHelp();
        break;

      case undefined:
      case '--start':
      case 'start':
        await startHub();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        await showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { startHub, stopHub, showStatus };