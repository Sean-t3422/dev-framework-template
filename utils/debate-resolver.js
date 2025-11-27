#!/usr/bin/env node
/**
 * @fileoverview Debate Resolution Mechanism
 *
 * Handles disagreements between agents and Codex during collaboration.
 * Implements a structured debate protocol with automatic escalation.
 */

const fs = require('fs').promises;
const path = require('path');

class DebateResolver {
  constructor(options = {}) {
    this.options = {
      maxRounds: 3,
      debateFolder: '/tmp/dev-framework/debate',
      escalationThreshold: 3,
      ...options
    };

    this.currentDebate = null;
    this.debateHistory = [];
  }

  /**
   * Start a new debate between agent and Codex
   */
  async startDebate(featureId, topic, initialPosition, codexFeedback) {
    this.currentDebate = {
      featureId,
      topic,
      startTime: Date.now(),
      rounds: [],
      consensus: null,
      escalated: false
    };

    // Record initial positions
    this.currentDebate.rounds.push({
      round: 1,
      agentPosition: initialPosition,
      codexFeedback: codexFeedback,
      timestamp: new Date().toISOString()
    });

    return this.currentDebate;
  }

  /**
   * Process a round of debate
   */
  async processDebateRound(agentResponse, codexReview) {
    if (!this.currentDebate) {
      throw new Error('No active debate to process');
    }

    const currentRound = this.currentDebate.rounds.length + 1;

    // Check if we've exceeded max rounds
    if (currentRound > this.options.maxRounds) {
      return this.escalateToHuman();
    }

    // Analyze positions
    const analysis = this.analyzePositions(agentResponse, codexReview);

    // Record the round
    this.currentDebate.rounds.push({
      round: currentRound,
      agentPosition: agentResponse,
      codexFeedback: codexReview,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });

    // Check for consensus
    if (analysis.consensus) {
      return this.resolveWithConsensus(analysis.consensusPoints);
    }

    // Check for convergence
    if (analysis.convergenceScore > 0.8) {
      return this.proposeCompromise(analysis);
    }

    // Continue debate
    return {
      status: 'continue',
      round: currentRound,
      nextAction: 'refine',
      suggestions: analysis.suggestions
    };
  }

  /**
   * Analyze positions to find common ground
   */
  analyzePositions(agentPosition, codexFeedback) {
    const analysis = {
      consensus: false,
      consensusPoints: [],
      disagreements: [],
      convergenceScore: 0,
      suggestions: []
    };

    // Parse positions into structured points
    const agentPoints = this.extractPoints(agentPosition);
    const codexPoints = this.extractPoints(codexFeedback);

    // Find agreements
    for (const agentPoint of agentPoints) {
      const matching = codexPoints.find(cp =>
        this.pointsAlign(agentPoint, cp)
      );

      if (matching) {
        analysis.consensusPoints.push({
          topic: agentPoint.topic,
          agreed: agentPoint.position
        });
      } else {
        analysis.disagreements.push({
          topic: agentPoint.topic,
          agentPosition: agentPoint.position,
          codexPosition: null
        });
      }
    }

    // Find Codex points not addressed by agent
    for (const codexPoint of codexPoints) {
      const addressed = agentPoints.find(ap =>
        ap.topic === codexPoint.topic
      );

      if (!addressed) {
        analysis.disagreements.push({
          topic: codexPoint.topic,
          agentPosition: null,
          codexPosition: codexPoint.position
        });
      }
    }

    // Calculate convergence score
    if (agentPoints.length > 0 || codexPoints.length > 0) {
      analysis.convergenceScore = analysis.consensusPoints.length /
        (analysis.consensusPoints.length + analysis.disagreements.length);
    }

    // Generate suggestions for next round
    analysis.suggestions = this.generateSuggestions(analysis);

    // Check if we have full consensus
    analysis.consensus = analysis.disagreements.length === 0 &&
                        analysis.consensusPoints.length > 0;

    return analysis;
  }

  /**
   * Extract structured points from text
   */
  extractPoints(text) {
    const points = [];
    const lines = text.split('\n');

    let currentTopic = null;
    let currentPosition = [];

    for (const line of lines) {
      // Look for topic headers
      if (line.match(/^#+\s+(.+)/) || line.match(/^\d+\.\s+(.+)/)) {
        if (currentTopic && currentPosition.length > 0) {
          points.push({
            topic: currentTopic,
            position: currentPosition.join(' ').trim()
          });
        }

        currentTopic = line.replace(/^[#\d.\s]+/, '').trim();
        currentPosition = [];
      } else if (line.trim() && currentTopic) {
        currentPosition.push(line.trim());
      }
    }

    // Add last point
    if (currentTopic && currentPosition.length > 0) {
      points.push({
        topic: currentTopic,
        position: currentPosition.join(' ').trim()
      });
    }

    return points;
  }

  /**
   * Check if two points align
   */
  pointsAlign(point1, point2) {
    // Simple topic matching
    if (point1.topic.toLowerCase() === point2.topic.toLowerCase()) {
      return this.positionsCompatible(point1.position, point2.position);
    }

    // Check for related topics
    const keywords1 = this.extractKeywords(point1.topic);
    const keywords2 = this.extractKeywords(point2.topic);

    const overlap = keywords1.filter(k => keywords2.includes(k));
    if (overlap.length > 0) {
      return this.positionsCompatible(point1.position, point2.position);
    }

    return false;
  }

  /**
   * Check if positions are compatible
   */
  positionsCompatible(pos1, pos2) {
    const agreements = ['yes', 'agreed', 'correct', 'acceptable', 'approved'];
    const disagreements = ['no', 'disagree', 'incorrect', 'unacceptable', 'rejected'];

    const pos1Lower = pos1.toLowerCase();
    const pos2Lower = pos2.toLowerCase();

    // Both agree
    if (agreements.some(a => pos1Lower.includes(a)) &&
        agreements.some(a => pos2Lower.includes(a))) {
      return true;
    }

    // Both disagree on same thing (alignment!)
    if (disagreements.some(d => pos1Lower.includes(d)) &&
        disagreements.some(d => pos2Lower.includes(d))) {
      return true;
    }

    // Check for semantic similarity (simplified)
    const keywords1 = this.extractKeywords(pos1);
    const keywords2 = this.extractKeywords(pos2);

    const overlap = keywords1.filter(k => keywords2.includes(k));
    return overlap.length >= Math.min(keywords1.length, keywords2.length) * 0.5;
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were', 'to', 'for', 'of', 'with', 'in'];
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));

    return [...new Set(words)];
  }

  /**
   * Generate suggestions for next debate round
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    // Focus on disagreements
    for (const disagreement of analysis.disagreements) {
      if (disagreement.agentPosition && disagreement.codexPosition) {
        suggestions.push(`Consider middle ground on: ${disagreement.topic}`);
      } else if (!disagreement.agentPosition) {
        suggestions.push(`Address Codex concern about: ${disagreement.topic}`);
      } else if (!disagreement.codexPosition) {
        suggestions.push(`Clarify your position on: ${disagreement.topic}`);
      }
    }

    // Build on agreements
    if (analysis.consensusPoints.length > 0) {
      suggestions.push(`Build on agreed points: ${analysis.consensusPoints.map(p => p.topic).join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Propose a compromise based on analysis
   */
  async proposeCompromise(analysis) {
    const compromise = {
      status: 'compromise_proposed',
      consensusPoints: analysis.consensusPoints,
      proposedResolutions: []
    };

    // Generate compromise proposals for disagreements
    for (const disagreement of analysis.disagreements) {
      const proposal = this.generateCompromiseProposal(disagreement);
      compromise.proposedResolutions.push(proposal);
    }

    // Save compromise proposal
    await this.saveCompromiseProposal(compromise);

    return compromise;
  }

  /**
   * Generate a compromise proposal for a disagreement
   */
  generateCompromiseProposal(disagreement) {
    const proposal = {
      topic: disagreement.topic,
      proposal: null,
      rationale: null
    };

    // Simple compromise strategies
    if (disagreement.topic.includes('test')) {
      proposal.proposal = 'Include essential tests, defer edge cases to phase 2';
      proposal.rationale = 'Balances thoroughness with development speed';
    } else if (disagreement.topic.includes('abstraction')) {
      proposal.proposal = 'Start simple, refactor when patterns emerge';
      proposal.rationale = 'Avoids premature optimization while maintaining quality';
    } else if (disagreement.topic.includes('performance')) {
      proposal.proposal = 'Implement basic solution, profile, then optimize';
      proposal.rationale = 'Data-driven optimization prevents over-engineering';
    } else {
      proposal.proposal = 'Implement minimal viable solution with clear extension points';
      proposal.rationale = 'Satisfies immediate needs while enabling future growth';
    }

    return proposal;
  }

  /**
   * Resolve debate with consensus
   */
  async resolveWithConsensus(consensusPoints) {
    this.currentDebate.consensus = consensusPoints;
    this.currentDebate.endTime = Date.now();
    this.currentDebate.duration = this.currentDebate.endTime - this.currentDebate.startTime;

    // Save consensus document
    await this.saveConsensusDocument();

    return {
      status: 'resolved',
      consensus: consensusPoints,
      rounds: this.currentDebate.rounds.length,
      duration: this.currentDebate.duration
    };
  }

  /**
   * Escalate to human when consensus cannot be reached
   */
  async escalateToHuman() {
    this.currentDebate.escalated = true;
    this.currentDebate.escalationReason = 'Max debate rounds exceeded without consensus';

    // Save escalation package
    await this.saveEscalationPackage();

    return {
      status: 'escalated',
      reason: this.currentDebate.escalationReason,
      rounds: this.currentDebate.rounds,
      requiresHumanDecision: true,
      savedTo: path.join(this.options.debateFolder, this.currentDebate.featureId, 'ESCALATION.md')
    };
  }

  /**
   * Save consensus document
   */
  async saveConsensusDocument() {
    const consensusPath = path.join(
      this.options.debateFolder,
      this.currentDebate.featureId,
      'CONSENSUS.md'
    );

    const content = `# Consensus Reached

**Feature:** ${this.currentDebate.featureId}
**Topic:** ${this.currentDebate.topic}
**Rounds:** ${this.currentDebate.rounds.length}
**Duration:** ${Math.round(this.currentDebate.duration / 1000)}s

## Agreed Points

${this.currentDebate.consensus.map(point =>
  `- **${point.topic}:** ${point.agreed}`
).join('\n')}

## Debate History

${this.currentDebate.rounds.map(round =>
  `### Round ${round.round}
- Agent Position: ${round.agentPosition.substring(0, 100)}...
- Codex Feedback: ${round.codexFeedback.substring(0, 100)}...
`).join('\n')}
`;

    await fs.mkdir(path.dirname(consensusPath), { recursive: true });
    await fs.writeFile(consensusPath, content, 'utf8');
  }

  /**
   * Save compromise proposal
   */
  async saveCompromiseProposal(compromise) {
    const proposalPath = path.join(
      this.options.debateFolder,
      this.currentDebate.featureId,
      'COMPROMISE_PROPOSAL.md'
    );

    const content = `# Compromise Proposal

**Feature:** ${this.currentDebate.featureId}
**Convergence Score:** ${(compromise.convergenceScore * 100).toFixed(1)}%

## Agreed Points
${compromise.consensusPoints.map(p => `- ${p.topic}: ${p.agreed}`).join('\n')}

## Proposed Resolutions
${compromise.proposedResolutions.map(r =>
  `### ${r.topic}
**Proposal:** ${r.proposal}
**Rationale:** ${r.rationale}
`).join('\n')}

## Next Steps
1. Review proposed resolutions
2. Accept, modify, or request alternatives
3. Proceed with agreed approach
`;

    await fs.mkdir(path.dirname(proposalPath), { recursive: true });
    await fs.writeFile(proposalPath, content, 'utf8');
  }

  /**
   * Save escalation package for human review
   */
  async saveEscalationPackage() {
    const escalationPath = path.join(
      this.options.debateFolder,
      this.currentDebate.featureId,
      'ESCALATION.md'
    );

    const content = `# Human Intervention Required

**Feature:** ${this.currentDebate.featureId}
**Topic:** ${this.currentDebate.topic}
**Reason:** ${this.currentDebate.escalationReason}
**Rounds Attempted:** ${this.currentDebate.rounds.length}

## Unresolved Issues

${this.identifyUnresolvedIssues().map(issue =>
  `- **${issue.topic}:**
  - Agent: ${issue.agentPosition}
  - Codex: ${issue.codexPosition}
`).join('\n')}

## Debate History

${this.currentDebate.rounds.map(round =>
  `### Round ${round.round} (${round.timestamp})

**Agent Position:**
${round.agentPosition}

**Codex Feedback:**
${round.codexFeedback}

**Analysis:**
- Consensus Points: ${round.analysis ? round.analysis.consensusPoints.length : 0}
- Disagreements: ${round.analysis ? round.analysis.disagreements.length : 0}
- Convergence: ${round.analysis ? (round.analysis.convergenceScore * 100).toFixed(1) : 0}%
`).join('\n---\n')}

## Resolution Needed

Please review the debate history and make a decision on the unresolved issues.
Document your decision and rationale in HUMAN_DECISION.md, then run:

\`\`\`bash
node workflow-orchestrator.js --resume ${this.currentDebate.featureId}
\`\`\`
`;

    await fs.mkdir(path.dirname(escalationPath), { recursive: true });
    await fs.writeFile(escalationPath, content, 'utf8');
  }

  /**
   * Identify unresolved issues from the debate
   */
  identifyUnresolvedIssues() {
    if (!this.currentDebate || this.currentDebate.rounds.length === 0) {
      return [];
    }

    const lastRound = this.currentDebate.rounds[this.currentDebate.rounds.length - 1];
    if (lastRound.analysis && lastRound.analysis.disagreements) {
      return lastRound.analysis.disagreements;
    }

    return [];
  }
}

// Export for use
module.exports = { DebateResolver };

// CLI interface
if (require.main === module) {
  console.log('Debate Resolution Mechanism');
  console.log('This module is meant to be imported, not run directly.');
  console.log('Use: const { DebateResolver } = require("./debate-resolver");');
}