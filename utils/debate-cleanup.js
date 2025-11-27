#!/usr/bin/env node
/**
 * @fileoverview Debate Document Cleanup Utility
 *
 * Manages temporary debate documents during Codex collaboration.
 * Automatically cleans up after consensus or preserves for human review.
 */

const fs = require('fs').promises;
const path = require('path');

class DebateCleanup {
  constructor(options = {}) {
    this.options = {
      debateRoot: '/tmp/dev-framework/debate',
      archiveRoot: path.join(process.cwd(), 'docs', 'debate-archives'),
      preserveOnFailure: true,
      compressArchives: true,
      ...options
    };
  }

  /**
   * Extract consensus from debate documents
   */
  async extractConsensus(featureId) {
    const debatePath = path.join(this.options.debateRoot, featureId);

    try {
      // Find all debate documents
      const files = await fs.readdir(debatePath);
      const consensus = {
        featureId,
        timestamp: new Date().toISOString(),
        rounds: [],
        finalDecision: null,
        agreements: [],
        disagreements: []
      };

      // Parse debate rounds
      for (const file of files.sort()) {
        if (file.includes('review')) {
          const content = await fs.readFile(path.join(debatePath, file), 'utf8');
          const round = this.parseDebateRound(content);
          consensus.rounds.push(round);
        }

        // Find final approved version
        if (file.includes('FINAL') || file.includes('approved')) {
          consensus.finalDecision = await fs.readFile(path.join(debatePath, file), 'utf8');
        }
      }

      // Extract key agreements and remaining disagreements
      consensus.agreements = this.extractAgreements(consensus.rounds);
      consensus.disagreements = this.extractDisagreements(consensus.rounds);

      return consensus;
    } catch (error) {
      console.error(`Failed to extract consensus for ${featureId}:`, error);
      throw error;
    }
  }

  /**
   * Parse a single debate round
   */
  parseDebateRound(content) {
    const round = {
      timestamp: this.extractTimestamp(content),
      reviewer: this.extractReviewer(content),
      approved: this.isApproved(content),
      concerns: this.extractConcerns(content),
      suggestions: this.extractSuggestions(content)
    };

    return round;
  }

  /**
   * Extract agreements from all rounds
   */
  extractAgreements(rounds) {
    const agreements = [];

    for (let i = 1; i < rounds.length; i++) {
      const previousConcerns = rounds[i - 1].concerns;
      const currentRound = rounds[i];

      // Find concerns that were resolved
      for (const concern of previousConcerns) {
        if (!currentRound.concerns.includes(concern)) {
          agreements.push({
            resolved: concern,
            round: i + 1
          });
        }
      }
    }

    return agreements;
  }

  /**
   * Extract remaining disagreements
   */
  extractDisagreements(rounds) {
    if (rounds.length === 0) return [];

    const lastRound = rounds[rounds.length - 1];
    return lastRound.concerns || [];
  }

  /**
   * Clean up successful debate
   */
  async cleanupSuccessful(featureId) {
    const debatePath = path.join(this.options.debateRoot, featureId);

    try {
      console.log(`  → Cleaning up debate documents for ${featureId}...`);

      // Extract and save consensus first
      const consensus = await this.extractConsensus(featureId);
      await this.saveConsensus(featureId, consensus);

      // Remove debate folder
      await fs.rm(debatePath, { recursive: true, force: true });

      console.log(`    ✅ Debate cleanup complete for ${featureId}`);
      return true;
    } catch (error) {
      console.error(`    ❌ Cleanup failed for ${featureId}:`, error);
      return false;
    }
  }

  /**
   * Archive failed debate for human review
   */
  async archiveFailed(featureId, reason) {
    const debatePath = path.join(this.options.debateRoot, featureId);
    const archivePath = path.join(this.options.archiveRoot, 'failed', featureId);

    try {
      console.log(`  → Archiving failed debate for ${featureId}...`);

      // Create archive directory
      await fs.mkdir(archivePath, { recursive: true });

      // Copy all debate files
      const files = await fs.readdir(debatePath);
      for (const file of files) {
        const src = path.join(debatePath, file);
        const dest = path.join(archivePath, file);
        await fs.copyFile(src, dest);
      }

      // Add failure summary
      const summary = `# Debate Failed - Human Intervention Required

**Feature ID:** ${featureId}
**Date:** ${new Date().toISOString()}
**Reason:** ${reason}

## Action Required
1. Review all debate documents in this folder
2. Make a decision on disputed points
3. Document your rationale in HUMAN_DECISION.md
4. Run workflow-orchestrator with --resume ${featureId}
`;

      await fs.writeFile(
        path.join(archivePath, 'INTERVENTION_REQUIRED.md'),
        summary,
        'utf8'
      );

      // Remove original debate folder
      await fs.rm(debatePath, { recursive: true, force: true });

      console.log(`    📦 Debate archived for human review: ${archivePath}`);
      return archivePath;
    } catch (error) {
      console.error(`    ❌ Archive failed for ${featureId}:`, error);
      throw error;
    }
  }

  /**
   * Save consensus document
   */
  async saveConsensus(featureId, consensus) {
    const consensusPath = path.join(
      process.cwd(),
      'docs',
      'consensus',
      `${featureId}-consensus.json`
    );

    await fs.mkdir(path.dirname(consensusPath), { recursive: true });
    await fs.writeFile(
      consensusPath,
      JSON.stringify(consensus, null, 2),
      'utf8'
    );

    console.log(`    📝 Consensus saved: ${featureId}-consensus.json`);
  }

  /**
   * Clean up old debate folders (maintenance)
   */
  async cleanupOldDebates(maxAgeDays = 7) {
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    try {
      const folders = await fs.readdir(this.options.debateRoot);

      for (const folder of folders) {
        const folderPath = path.join(this.options.debateRoot, folder);
        const stats = await fs.stat(folderPath);

        if (now - stats.mtimeMs > maxAge) {
          console.log(`  → Removing old debate folder: ${folder}`);
          await fs.rm(folderPath, { recursive: true, force: true });
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old debates:', error);
    }
  }

  /**
   * List active debates
   */
  async listActiveDebates() {
    try {
      const folders = await fs.readdir(this.options.debateRoot);
      const debates = [];

      for (const folder of folders) {
        const folderPath = path.join(this.options.debateRoot, folder);
        const stats = await fs.stat(folderPath);

        debates.push({
          featureId: folder,
          created: stats.birthtime,
          modified: stats.mtime,
          path: folderPath
        });
      }

      return debates;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Helper: Extract timestamp from content
   */
  extractTimestamp(content) {
    const match = content.match(/(?:Date|Timestamp):\s*(.+)/i);
    return match ? match[1] : new Date().toISOString();
  }

  /**
   * Helper: Extract reviewer from content
   */
  extractReviewer(content) {
    if (content.toLowerCase().includes('codex')) {
      return 'codex-reviewer';
    }
    return 'unknown';
  }

  /**
   * Helper: Check if content indicates approval
   */
  isApproved(content) {
    const approvalTerms = [
      'approved',
      'looks good',
      'acceptable',
      'can proceed'
    ];

    const lowerContent = content.toLowerCase();
    return approvalTerms.some(term => lowerContent.includes(term));
  }

  /**
   * Helper: Extract concerns from review
   */
  extractConcerns(content) {
    const concerns = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/(?:concern|issue|problem|risk):/i)) {
        concerns.push(line.trim());
      }
    }

    return concerns;
  }

  /**
   * Helper: Extract suggestions from review
   */
  extractSuggestions(content) {
    const suggestions = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/(?:suggest|recommend|consider|should):/i)) {
        suggestions.push(line.trim());
      }
    }

    return suggestions;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const cleanup = new DebateCleanup();

  if (args.includes('--help') || args.length === 0) {
    console.log('Debate Document Cleanup Utility');
    console.log('');
    console.log('Usage:');
    console.log('  node debate-cleanup.js --list                List active debates');
    console.log('  node debate-cleanup.js --clean <featureId>   Clean successful debate');
    console.log('  node debate-cleanup.js --archive <featureId> Archive failed debate');
    console.log('  node debate-cleanup.js --cleanup-old [days]  Remove old debates');
    console.log('');
    process.exit(0);
  }

  try {
    if (args.includes('--list')) {
      const debates = await cleanup.listActiveDebates();
      console.log('\nActive Debates:');
      for (const debate of debates) {
        console.log(`  - ${debate.featureId} (modified: ${debate.modified})`);
      }
    } else if (args.includes('--clean')) {
      const featureId = args[args.indexOf('--clean') + 1];
      await cleanup.cleanupSuccessful(featureId);
    } else if (args.includes('--archive')) {
      const featureId = args[args.indexOf('--archive') + 1];
      await cleanup.archiveFailed(featureId, 'Manual archive');
    } else if (args.includes('--cleanup-old')) {
      const days = parseInt(args[args.indexOf('--cleanup-old') + 1] || '7');
      await cleanup.cleanupOldDebates(days);
    }

    console.log('\n✅ Operation completed');
  } catch (error) {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { DebateCleanup };

// Run CLI if executed directly
if (require.main === module) {
  main();
}