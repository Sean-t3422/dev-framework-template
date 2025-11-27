# Health Check

**Command**: `/health-check`

**Description**: Validates development/production environment is functioning correctly. Catches corrupted builds, asset serving issues, and connection problems before debugging.

---

## What it does

1. **Checks Server Status:**
   - Is dev server running?
   - What port is it on?
   - Is it responding to requests?

2. **Validates Asset Serving:**
   - CSS files loading (not 404)
   - JavaScript bundles accessible
   - Static assets being served

3. **Tests Core Functionality:**
   - Homepage loads
   - API routes respond
   - Database connection works
   - Auth endpoints accessible

4. **Reports Issues:**
   - Clear problem identification
   - Suggested fixes
   - Prevents wrong debugging paths

---

## Usage

### Basic Health Check
```
/health-check
```

### Check Specific Environment
```
/health-check dev
/health-check production
```

### Check After Problems
```
/health-check --verbose
```

---

## How AI Assistants Run This

When an AI assistant sees `/health-check`, they should:

1. Check if dev server is running (ps aux | grep "next dev")
2. Test CSS serving: curl -I http://localhost:3456/_next/static/css/app/layout.css
3. Test homepage: curl -I http://localhost:3456
4. Report findings with clear fixes

## Example Output

### ✅ Healthy Environment
```
🏥 Running Health Check...

✅ Server Status:
   - Dev server: Running on port 3456
   - Process ID: 3503
   - Uptime: 12 minutes

✅ Asset Serving:
   - CSS: Loading correctly (200 OK)
   - JavaScript: Bundled and served
   - Static files: Accessible

✅ Core Functions:
   - Homepage: Renders (200 OK)
   - API health: /api/health responds
   - Database: Connected to Supabase
   - Auth: Login page accessible

🎯 Environment is healthy!
```

### ❌ Corrupted Build Detection
```
🏥 Running Health Check...

✅ Server Status:
   - Dev server: Running on port 3456

❌ Asset Serving Issues Found:
   - CSS: 404 Not Found at /_next/static/css/app/layout.css
   - JavaScript: Some bundles returning 404
   - Diagnosis: Webpack build corrupted

🔧 Recommended Fix:
   1. Stop dev server (kill process 3503)
   2. Clear build cache: rm -rf .next
   3. Restart: npm run dev

⚠️ DO NOT debug components until assets are serving!
```

### ❌ Server Not Running
```
🏥 Running Health Check...

❌ Server Status:
   - No dev server detected
   - Port 3456: Not listening

🔧 Recommended Fix:
   - Start dev server: npm run dev
   - Check for port conflicts
```

### ❌ Database Connection Failed
```
🏥 Running Health Check...

✅ Server Status: Running
✅ Asset Serving: Working

❌ Database Issues:
   - Supabase connection failed
   - Error: Invalid API key

🔧 Recommended Fix:
   - Check .env.local exists
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY
   - Ensure using correct project (YOUR_SUPABASE_PROJECT_ID)
```

---

## When to Run This

### ALWAYS run when:
- 🔴 Styles suddenly disappear
- 🔴 "Cannot read properties of null" errors
- 🔴 Authentication stops working
- 🔴 Pages won't load
- 🔴 After fixing complex errors

### Run BEFORE:
- Debugging component issues
- Changing authentication logic
- Modifying middleware
- Investigating "weird" behavior

### Run AFTER:
- Major dependency updates
- Switching branches
- Clearing node_modules
- Deployment failures

---

## Implementation Details

### Checks Performed

```bash
# 1. Server Running Check
ps aux | grep "next dev"
lsof -i :3456

# 2. Asset Serving Check
curl -I http://localhost:3456/_next/static/css/app/layout.css
# Should return: HTTP/1.1 200 OK

# 3. Homepage Check
curl -I http://localhost:3456
# Should return: HTTP/1.1 200 OK

# 4. API Health Check
curl http://localhost:3456/api/health
# Should return: {"status":"healthy"}

# 5. Database Check
curl http://localhost:3456/api/health/db
# Should return: {"connected":true}
```

### Quick Fix Decision Tree

```
Styles Missing?
├─ Run /health-check
├─ CSS returning 404?
│  └─ Webpack corrupted → Clear .next + restart
├─ CSS returning 200 but empty?
│  └─ Tailwind config issue → Check tailwind.config.ts
└─ CSS has content but not applying?
   └─ Browser cache → Hard refresh

Auth Not Working?
├─ Run /health-check
├─ API routes 404?
│  └─ Missing exports → Check dynamic/runtime exports
├─ API routes 500?
│  └─ Check server logs → npm run dev output
└─ API routes 401?
   └─ Session expired → Clear cookies

Pages Not Loading?
├─ Run /health-check
├─ Server not running?
│  └─ Start it → npm run dev
├─ Port conflict?
│  └─ Kill conflicting process
└─ Build errors?
   └─ Check terminal output
```

---

## Integration with Other Commands

### Automatic Health Check
Other commands can trigger health check first:
- `/check-project` - Validates environment after loading context
- `/build-feature` - Ensures healthy before starting work
- `/debug` - Checks health before debugging

### Manual Override
```
/health-check --fix    # Automatically fix common issues
/health-check --quick  # Just check if server is running
/health-check --full   # Deep check including database queries
```

---

## Common Issues Caught

1. **Webpack Build Corruption** (like today!)
   - Catches CSS/JS 404s immediately
   - Saves hours of component debugging

2. **Environment Variable Issues**
   - Missing .env.local
   - Wrong Supabase project
   - Invalid API keys

3. **Port Conflicts**
   - Multiple dev servers
   - Port already in use
   - Wrong port assumption

4. **Session/Auth Problems**
   - Expired sessions
   - Cookie issues
   - Middleware failures

5. **Database Connection**
   - Network issues
   - Wrong credentials
   - RLS policy blocks

---

## Success Metrics

This command should:
- ✅ Run in under 2 seconds
- ✅ Catch 90% of environment issues
- ✅ Provide actionable fixes
- ✅ Prevent wrong debugging paths
- ✅ Save developer time

---

## Notes

- Non-destructive (read-only checks)
- Can run while server is running
- Works in development and production
- Should be first debugging step
- Prevents "chasing ghosts" in code

---

## Future Enhancements

- Auto-fix common issues
- Production health monitoring
- Performance metrics
- Memory usage tracking
- Bundle size analysis