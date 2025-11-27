---
name: database-patterns
description: Automatically apply Supabase and PostgreSQL best practices when working with migrations, schema changes, queries, or RLS policies. Use whenever database work is detected.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - mcp__supabase__execute_sql
  - mcp__supabase__apply_migration
  - mcp__supabase__list_tables
---

# Database Patterns Skill

## When This Skill Activates

This skill automatically applies when you detect:
- Keywords: "migration", "table", "column", "RLS", "policy", "schema"
- File paths: `supabase/migrations/`, `*.sql`
- Database errors or query issues
- Schema design discussions

## Critical: Project-Specific Conventions

**ALWAYS read PROJECT_CONTEXT.md first to learn naming conventions!**

Common conventions in Supabase projects:
- Snake_case for tables and columns
- Plural table names (e.g., `family_groups`, `payments`)
- Junction tables with `_` separator (e.g., `family_members`)
- Timestamp columns: `created_at`, `updated_at`

## RLS Policy Template

Every table MUST have Row Level Security enabled:

```sql
-- Enable RLS (always first)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Admin full access policy
CREATE POLICY "Admins have full access to table_name"
ON table_name FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- User read policy (customize per table)
CREATE POLICY "Users can read their own table_name"
ON table_name FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- User write policy (customize per table)
CREATE POLICY "Users can update their own table_name"
ON table_name FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## Common RLS Mistakes to Prevent

❌ **DON'T:**
- Use `SELECT *` in policies (performance issue)
- Skip null checks: `user_id = auth.uid()` fails if user_id is null
- Use CASCADE deletes without understanding impact
- Create circular dependencies in policies
- Forget to test policies with non-admin users

✅ **DO:**
- Check for nulls: `user_id IS NOT NULL AND user_id = auth.uid()`
- Use specific columns in policy checks
- Add indexes for foreign keys used in policies
- Test with `SET ROLE` to simulate different users
- Document complex policies with comments

## Migration Best Practices

### File Naming
```bash
# Good
20250106_add_email_notifications.sql
20250106_create_payment_items_table.sql

# Bad
migration.sql
fix.sql
update.sql
```

### Idempotent SQL
Always use `IF NOT EXISTS` or `IF EXISTS`:

```sql
-- Tables
CREATE TABLE IF NOT EXISTS table_name (...);

-- Columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'my_table' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE my_table ADD COLUMN new_column TEXT;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);

-- Functions
CREATE OR REPLACE FUNCTION function_name() ...

-- Policies (drop if exists, then create)
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...
```

### Transaction Safety
```sql
BEGIN;
  -- All changes here
  -- Will rollback on error
COMMIT;
```

## Security Checklist

Before finalizing any migration:

- [ ] RLS enabled on all tables
- [ ] Admin policy exists and tested
- [ ] User policies prevent unauthorized access
- [ ] No SQL injection vectors (use parameterized queries in code)
- [ ] Sensitive data has appropriate policies
- [ ] Foreign key constraints in place
- [ ] Indexes for policy performance
- [ ] Functions use SECURITY DEFINER carefully

## Performance Optimization

### Indexing Strategy
```sql
-- Foreign keys (always index these)
CREATE INDEX idx_table_foreign_key ON table_name(foreign_key_id);

-- Columns used in WHERE clauses
CREATE INDEX idx_table_search_column ON table_name(search_column);

-- Composite indexes for multi-column queries
CREATE INDEX idx_table_composite ON table_name(col1, col2);

-- Partial indexes for specific conditions
CREATE INDEX idx_table_active ON table_name(status)
WHERE status = 'active';
```

### Query Optimization
- Use `EXPLAIN ANALYZE` to check query plans
- Avoid N+1 queries (use JOINs or batch fetches)
- Use materialized views for expensive aggregations
- Limit result sets with appropriate WHERE clauses

## Integration with Dev Framework

This skill runs **automatically** during:
1. `/build-feature` when feature involves database changes
2. Direct database work outside workflows
3. Migration creation and review
4. Query optimization tasks

You don't need to invoke it manually - it activates when database work is detected.

## Codex Review Integration

After creating migrations, automatically trigger Codex review for:
- Security vulnerabilities (SQL injection, RLS gaps)
- Performance issues (missing indexes, inefficient queries)
- Breaking changes (data loss, schema conflicts)

## Testing Database Changes

Always test migrations:

```bash
# Local test
supabase db reset
supabase db push

# Test RLS policies
psql -c "SET ROLE authenticated; SELECT * FROM table_name;"

# Check for performance issues
psql -c "EXPLAIN ANALYZE SELECT * FROM table_name WHERE ..."
```

## Common Patterns Library

### User-Owned Resources
```sql
CREATE TABLE user_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_resources_user_id ON user_resources(user_id);

ALTER TABLE user_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resources"
ON user_resources FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Many-to-Many Relationships
```sql
CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

### Soft Deletes
```sql
ALTER TABLE table_name ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update existing queries to exclude soft-deleted
CREATE VIEW table_name_active AS
SELECT * FROM table_name WHERE deleted_at IS NULL;

-- Admin policy to see all
CREATE POLICY "Admins see all including deleted"
ON table_name FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users see only non-deleted
CREATE POLICY "Users see only active records"
ON table_name FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() AND deleted_at IS NULL
);
```

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- Project-specific: `docs/DATABASE_MIGRATION_METHODS.md`
