#!/usr/bin/env node
/**
 * Shared Migration Helper for All Agents
 *
 * Generates unique timestamp-based migration numbers that prevent
 * conflicts when multiple agents work simultaneously.
 *
 * Format: YYYYMMDDHHMMSS_description.sql
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MigrationHelper {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.migrationsDir = path.join(projectPath, 'supabase', 'migrations');
  }

  /**
   * Generate a unique migration number
   * Always includes random component for concurrent safety
   */
  async getNextMigrationNumber() {
    const now = new Date();
    const baseTimestamp = this.formatTimestamp(now);

    // ALWAYS add random suffix for concurrent safety
    // This ensures that even if multiple agents call this at the exact same millisecond,
    // they will get different numbers
    const random = crypto.randomBytes(3).toString('hex');
    let finalNumber = `${baseTimestamp}${random}`;

    // Still check for the extremely rare case of random collision
    let attempts = 0;
    const maxAttempts = 100;

    while (await this.migrationExists(finalNumber)) {
      attempts++;

      if (attempts > maxAttempts) {
        throw new Error(`Failed to generate unique migration number after ${maxAttempts} attempts`);
      }

      // Generate new random suffix
      const newRandom = crypto.randomBytes(4).toString('hex');
      finalNumber = `${baseTimestamp}${newRandom}`;
    }

    return finalNumber;
  }

  /**
   * Format date as migration timestamp
   * Format: YYYYMMDDHHMMSS
   */
  formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Check if a migration with this number already exists
   */
  async migrationExists(number) {
    if (!fs.existsSync(this.migrationsDir)) {
      return false;
    }

    const files = await fs.promises.readdir(this.migrationsDir);
    return files.some(file => file.startsWith(`${number}_`));
  }

  /**
   * Create a migration file with proper locking to prevent conflicts
   */
  async createMigration(description, content) {
    // Ensure migrations directory exists
    if (!fs.existsSync(this.migrationsDir)) {
      await fs.promises.mkdir(this.migrationsDir, { recursive: true });
    }

    // Get unique migration number
    const number = await this.getNextMigrationNumber();

    // Sanitize description for filename
    const sanitizedDesc = description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50); // Limit length

    const filename = `${number}_${sanitizedDesc}.sql`;
    const filepath = path.join(this.migrationsDir, filename);

    // Write file with exclusive flag to prevent concurrent writes
    await fs.promises.writeFile(filepath, content, { flag: 'wx' });

    return {
      number,
      filename,
      filepath
    };
  }

  /**
   * Get the latest migration for reference
   */
  async getLatestMigration() {
    if (!fs.existsSync(this.migrationsDir)) {
      return null;
    }

    const files = await fs.promises.readdir(this.migrationsDir);
    const migrations = files
      .filter(f => f.endsWith('.sql'))
      .filter(f => /^\d{14}/.test(f))
      .sort()
      .reverse();

    if (migrations.length === 0) {
      return null;
    }

    const latest = migrations[0];
    const match = latest.match(/^(\d{14})_(.+)\.sql$/);

    if (!match) {
      return null;
    }

    return {
      number: match[1],
      description: match[2],
      filename: latest
    };
  }

  /**
   * Validate migrations directory for issues
   */
  async validateMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      return { valid: true, issues: [] };
    }

    const files = await fs.promises.readdir(this.migrationsDir);
    const issues = [];

    // Check for duplicates
    const numbers = new Map();
    for (const file of files) {
      const match = file.match(/^(\d+)_/);
      if (match) {
        const num = match[1];
        if (numbers.has(num)) {
          issues.push(`Duplicate number ${num}: ${numbers.get(num)} and ${file}`);
        } else {
          numbers.set(num, file);
        }
      }
    }

    // Check for mixed formats
    const hasSequential = files.some(f => /^\d{3}_/.test(f));
    const hasTimestamp = files.some(f => /^\d{14}/.test(f));

    if (hasSequential && hasTimestamp) {
      issues.push('Mixed migration formats detected (sequential and timestamp)');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// CLI interface for testing
if (require.main === module) {
  const projectPath = process.cwd();
  const helper = new MigrationHelper(projectPath);

  const command = process.argv[2];

  async function run() {
    switch (command) {
      case 'next':
        const next = await helper.getNextMigrationNumber();
        console.log(`Next migration number: ${next}`);
        break;

      case 'latest':
        const latest = await helper.getLatestMigration();
        if (latest) {
          console.log(`Latest migration: ${latest.filename}`);
        } else {
          console.log('No migrations found');
        }
        break;

      case 'validate':
        const result = await helper.validateMigrations();
        if (result.valid) {
          console.log('✅ All migrations valid');
        } else {
          console.log('❌ Migration issues found:');
          result.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        break;

      case 'create':
        const description = process.argv[3];
        if (!description) {
          console.error('Usage: migration-helper create <description>');
          process.exit(1);
        }
        const migration = await helper.createMigration(description, '-- Migration content here\n');
        console.log(`Created: ${migration.filename}`);
        break;

      default:
        console.log('Usage: migration-helper <command>');
        console.log('Commands:');
        console.log('  next     - Get next migration number');
        console.log('  latest   - Show latest migration');
        console.log('  validate - Check for migration issues');
        console.log('  create <description> - Create a new migration');
    }
  }

  run().catch(console.error);
}

module.exports = { MigrationHelper };