# Performance Checklist - Built Into Every Feature

**Purpose**: Ensure every feature is optimized from day one. Performance is NOT optional.

**Integration**: This checklist is automatically enforced by Codex reviewer at every TDD checkpoint.

---

## Database Layer Performance

### ✅ Query Optimization
- [ ] **No N+1 queries** - Use RPC functions or batch queries
- [ ] **Indexes on all WHERE clauses** - Every filtered column needs an index
- [ ] **Indexes on all JOIN columns** - Foreign keys and join conditions
- [ ] **Indexes on all ORDER BY columns** - Sorting columns need indexes
- [ ] **Composite indexes** for multi-column queries (e.g., `WHERE user_id = X AND status = Y`)
- [ ] **Partial indexes** for filtered queries (e.g., `WHERE deleted_at IS NULL`)
- [ ] **Query time < 100ms** (P95) - Measure with `EXPLAIN ANALYZE`

### ✅ RPC Functions
- [ ] **Single RPC call** instead of multiple queries
- [ ] **Select only needed columns** - Don't use `SELECT *`
- [ ] **Proper parameter validation** - Prevent negative offsets
- [ ] **Connection pooling** configured (pgbouncer)

### ✅ Real-time Subscriptions
- [ ] **Filtered subscriptions** - Not global table listeners
- [ ] **RLS policies efficient** - No circular dependencies
- [ ] **Cleanup on unmount** - Prevent memory leaks

---

## API Layer Performance

### ✅ Response Times
- [ ] **< 200ms P95 response time** - Measure with `performance.now()`
- [ ] **Performance monitoring** tracked (frontend-metrics.ts)
- [ ] **Slow query logging** - Log queries > 100ms

### ✅ Caching
- [ ] **React Query caching** - staleTime/cacheTime configured
- [ ] **HTTP cache headers** - Cache-Control, ETag set appropriately
- [ ] **Invalidation strategy** - Clear cache on mutations

### ✅ Error Handling
- [ ] **Try/catch blocks** - No unhandled promise rejections
- [ ] **Proper status codes** - 400, 401, 403, 404, 500
- [ ] **No sensitive data** in error messages

---

## React/UI Performance

### ✅ Component Optimization
- [ ] **React.memo** for expensive components
- [ ] **useMemo** for expensive calculations
- [ ] **useCallback** for callback stability
- [ ] **Proper memo comparison** - Include all relevant props
- [ ] **No unnecessary re-renders** - Check with React DevTools

### ✅ List Performance
- [ ] **Virtualization** for lists > 100 items (@tanstack/react-virtual)
- [ ] **Infinite scroll** with Intersection Observer
- [ ] **Memoized filtering** - Prevent recalculation on scroll
- [ ] **Key prop** on all list items (stable, unique keys)

### ✅ Image Optimization
- [ ] **Next.js Image component** - Automatic optimization
- [ ] **Lazy loading** - Images below fold
- [ ] **Proper sizes prop** - Responsive images
- [ ] **WebP format** - Modern image formats
- [ ] **Fallback handling** - Error states for failed loads

### ✅ Code Splitting
- [ ] **Dynamic imports** for large components
- [ ] **Bundle size < 2MB** - Analyze with webpack-bundle-analyzer
- [ ] **Tree shaking** - Remove unused exports

### ✅ State Management
- [ ] **Appropriate state scope** - Local vs global
- [ ] **Debouncing/throttling** for frequent events
- [ ] **Optimistic updates** - Instant UI feedback

---

## Testing Performance

### ✅ Performance Tests
- [ ] **API benchmarks** - Response time assertions
- [ ] **Load testing** - Concurrent user scenarios
- [ ] **Database performance tests** - Query count assertions
- [ ] **Component render tests** - usePerformanceMonitor hook

### ✅ Regression Prevention
- [ ] **Performance budgets** - Fail if thresholds exceeded
- [ ] **Bundle size limits** - Fail if bundle > 2MB
- [ ] **API time limits** - Fail if > 200ms P95

---

## Monitoring & Observability

### ✅ Metrics Tracking
- [ ] **Page load metrics** - DNS, TTFB, DOM complete
- [ ] **API call tracking** - Duration, P95, error rates
- [ ] **Component render tracking** - Slow render warnings
- [ ] **Performance summary** - Logged to console (dev only)

### ✅ Alerting
- [ ] **Slow API calls** - Warn if > 1000ms
- [ ] **Slow renders** - Warn if > 100ms
- [ ] **Memory leaks** - Cleanup verified

---

## Security & Performance Together

### ✅ Security WITHOUT Performance Cost
- [ ] **RLS policies** don't cause N+1 queries
- [ ] **Input validation** doesn't block the event loop
- [ ] **Authentication checks** cached appropriately
- [ ] **CSRF protection** doesn't add > 10ms overhead

### ✅ Performance WITHOUT Security Cost
- [ ] **Caching** respects user permissions
- [ ] **Batch operations** maintain RLS enforcement
- [ ] **Optimizations** don't bypass security checks

---

## Pre-Deployment Checklist

### ✅ Final Performance Audit
- [ ] All API endpoints < 200ms P95
- [ ] All database queries < 100ms
- [ ] Bundle size < 2MB
- [ ] No console errors in production
- [ ] No memory leaks over 24 hours
- [ ] Load tested with 100+ concurrent users

### ✅ Final Security Audit
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] All RLS policies tested
- [ ] All input validation present
- [ ] CSRF protection on mutations
- [ ] Rate limiting configured

---

## Quick Reference: Common Performance Mistakes

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| N+1 queries in loops | Use RPC function with JOIN |
| Missing database index | Add index on WHERE/JOIN/ORDER BY columns |
| Global real-time listener | Filter subscription to user's data |
| SELECT * | Select only needed columns |
| Unmemoized expensive calculation | Wrap with useMemo |
| Component re-renders unnecessarily | Use React.memo with proper comparison |
| Long list without virtualization | Use @tanstack/react-virtual |
| Images without optimization | Use Next.js Image component |
| No performance monitoring | Track with FrontendPerformanceMonitor |
| No response time tracking | Use performance.now() in API routes |

---

## Integration with TDD Workflow

**This checklist is automatically enforced at every Codex checkpoint:**

1. **Checkpoint 1** (Test Generation) - Performance tests included?
2. **Checkpoint 2** (Database) - Indexes present? N+1 prevented?
3. **Checkpoint 3** (API) - Response times tracked? Caching configured?
4. **Checkpoint 4** (UI) - Components memoized? Lists virtualized?
5. **Checkpoint 5** (Integration) - End-to-end times acceptable?
6. **Checkpoint 6** (Final) - All performance targets met?

**Codex blocks progression if critical performance issues detected.**

---

## Performance is NOT Optional

**Remember:**
- Slow code = Broken code
- We optimize during development, not after launch
- Performance issues caught in development are 100x cheaper to fix than in production
- Every feature includes performance tests from day one

**The goal:** Ship fast code the first time, every time.
