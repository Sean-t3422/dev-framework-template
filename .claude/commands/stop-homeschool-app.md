# Stop Homeschool App

**Command**: `/stop-homeschool-app`

**Description**: Cleanly stops all running processes for the Homeschool Co-op Platform development environment.

---

## What it does

### 1. 🛑 Stop Development Server
- Finds all Next.js processes on port 3456
- Gracefully terminates the dev server
- Cleans up any orphaned node processes

### 2. 🧹 Clean Up Resources
- Closes any open database connections
- Stops any background tasks
- Clears any temporary files

### 3. 📊 Final Status Report
- Confirms what was stopped
- Shows session duration
- Suggests next steps

---

## Usage

### Stop Everything
```
/stop-homeschool-app
```

---

## Example Output

**User says:** `/stop-homeschool-app`

**Claude responds:**
```
🛑 Stopping Homeschool Co-op Development Environment...

Step 1/3: Finding Running Processes
----------------------------------------
✅ Found Next.js dev server on port 3456 (PID: 12345)
✅ Found node processes (3 workers)

Step 2/3: Stopping Services
----------------------------------------
🔸 Stopping Next.js dev server... DONE
🔸 Terminating node workers... DONE
🔸 Closing database connections... DONE
✅ All services stopped successfully

Step 3/3: Session Summary
----------------------------------------
📊 Session Duration: 2 hours 34 minutes
📁 Project: homeschool-coop
🔧 Port 3456 is now free

✅ SHUTDOWN COMPLETE - All services stopped

To restart, run: /start-homeschool-app
```

---

## Error Handling

### If No Services Running
```
ℹ️ No services currently running

Nothing to stop. The development environment is already shut down.
```

### If Port Still Occupied After Stop
```
⚠️ Port 3456 still occupied after shutdown

Force stopping remaining processes...
✅ Forced shutdown complete
```

---

## Implementation Details

The command executes:
```bash
# 1. Find processes on port 3456
lsof -ti:3456

# 2. Gracefully stop (SIGTERM)
kill -15 <PID>

# 3. If still running after 5 seconds, force stop (SIGKILL)
kill -9 <PID>

# 4. Clean up any orphaned node processes
pkill -f "next-server.*3456"
```

---

## When to Use

### ✅ Use when:
- Done with development session
- Need to free up port 3456
- Server is acting strange
- Before system shutdown
- Switching to different project

### 🔄 After stopping:
- Run `/start-homeschool-app` to restart
- Port 3456 will be available for other uses

---

## Related Commands

- `/start-homeschool-app` - Start everything back up
- `/check-project` - Just load context without starting server

---

## Notes

- Graceful shutdown (tries SIGTERM before SIGKILL)
- Waits up to 5 seconds for clean shutdown
- Forces shutdown if processes won't stop
- Safe to run multiple times
- Won't affect other projects or ports