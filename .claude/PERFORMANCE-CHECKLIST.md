# Performance Checklist - Built Into Every Feature

**Purpose**: Ensure every feature is optimized from day one.

---

## Database Layer Performance

### ✅ Query Optimization
- [ ] **No N+1 queries** - Use RPC functions or batch queries
- [ ] **Indexes on all WHERE clauses**
- [ ] **Indexes on all JOIN columns**
- [ ] **Indexes on all ORDER BY columns**
- [ ] **Query time < 100ms** (P95)

### ✅ RPC Functions
- [ ] **Single RPC call** instead of multiple queries
- [ ] **Select only needed columns**
- [ ] **Connection pooling** configured

---

## API Layer Performance

### ✅ Response Times
- [ ] **< 200ms P95 response time**
- [ ] **Performance monitoring** tracked
- [ ] **Slow query logging**

### ✅ Caching
- [ ] **React Query caching** configured
- [ ] **HTTP cache headers** set
- [ ] **Invalidation strategy** defined

---

## React/UI Performance

### ✅ Component Optimization
- [ ] **React.memo** for expensive components
- [ ] **useMemo** for expensive calculations
- [ ] **useCallback** for callback stability
- [ ] **No unnecessary re-renders**

### ✅ List Performance
- [ ] **Virtualization** for lists > 100 items
- [ ] **Infinite scroll** with Intersection Observer
- [ ] **Key prop** on all list items

### ✅ Code Splitting
- [ ] **Dynamic imports** for large components
- [ ] **Bundle size < 2MB**

---

## Quick Reference: Common Performance Mistakes

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| N+1 queries in loops | Use RPC function with JOIN |
| Missing database index | Add index on WHERE/JOIN/ORDER BY columns |
| SELECT * | Select only needed columns |
| Unmemoized expensive calculation | Wrap with useMemo |
| Long list without virtualization | Use @tanstack/react-virtual |

---

## Performance is NOT Optional

**Remember:**
- Slow code = Broken code
- We optimize during development, not after launch
- Performance issues caught in development are 100x cheaper to fix
