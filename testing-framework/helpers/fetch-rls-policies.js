#!/usr/bin/env node
/**
 * Helper script to fetch RLS policies using Supabase MCP
 * This is called by the post-implementation-validator
 *
 * Usage: node fetch-rls-policies.js <project-path>
 *
 * Note: This script should be invoked by Claude which has access to Supabase MCP.
 * It cannot directly call MCP from Node.js - instead it returns a signal that
 * Claude should use MCP to fetch policies.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const projectPath = process.argv[2] || process.cwd();

    // Read .env.local to get Supabase project ref
    const envPath = path.join(projectPath, '.env.local');

    if (!fs.existsSync(envPath)) {
      throw new Error('.env.local not found');
    }

    const envContent = fs.readFileSync(envPath, 'utf8');

    const projectRefMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
    if (!projectRefMatch) {
      throw new Error('Could not find Supabase project ref in .env.local');
    }

    const projectRef = projectRefMatch[1];

    // Signal to validator that MCP should be used
    // The validator running in Claude context can then use MCP directly
    const response = {
      success: true,
      useMCP: true,
      projectRef,
      message: 'Use mcp__supabase__execute_sql to fetch policies'
    };

    console.log(JSON.stringify(response));

  } catch (error) {
    const response = {
      success: false,
      error: error.message
    };
    console.log(JSON.stringify(response));
    process.exit(1);
  }
}

main();
