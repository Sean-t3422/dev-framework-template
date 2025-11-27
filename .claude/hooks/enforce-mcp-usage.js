#!/usr/bin/env node
/**
 * Hook: Enforce MCP Usage for Database Operations
 *
 * Blocks Bash commands for database operations and enforces
 * MCP tool usage instead. This ensures Claude always uses
 * MCPs instead of falling back to Bash/psql.
 *
 * Triggers: <tool_use> (before execution)
 */

function main(hookInput) {
  const { tool, parameters } = hookInput;

  // Only check Bash tool calls
  if (tool !== 'Bash') {
    return { allow: true };
  }

  const command = parameters?.command || '';

  // Block psql/database commands - should use MCP instead
  if (
    command.includes('psql') ||
    command.includes('PGPASSWORD') ||
    (command.includes('-f') && command.includes('migrations/'))
  ) {
    return {
      allow: false,
      message: `
❌ Database operations must use Supabase MCP, not Bash/psql

You tried to run: ${command.substring(0, 100)}...

Instead, use the Supabase MCP tool:
- For migrations: Use "supabase - Apply migration (MCP)" tool
- For queries: Use "supabase - Execute SQL (MCP)" tool
- For schema: Use "supabase - Get table schema (MCP)" tool

The MCPs are already configured and available. Please use them instead of Bash.
      `.trim()
    };
  }

  // Allow other Bash commands
  return { allow: true };
}

// Hook execution
const hookInput = JSON.parse(process.argv[2] || '{}');
const result = main(hookInput);
console.log(JSON.stringify(result));
