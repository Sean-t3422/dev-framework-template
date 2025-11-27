/**
 * @fileoverview Hook System for Dev Framework
 * Sequential, context-accumulating hook system where sub-agents provide research/advice
 * and the orchestrator validates and implements
 * Part of the Dev Framework Testing System
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const readline = require('readline');
const OrchestratorValidator = require('./orchestrator-validator');
const fs = require('fs').promises;

/**
 * Priority levels for hooks
 */
const PRIORITY_LEVELS = {
  critical: {
    skippable: false,
    requiresResolution: true,
    blockingOnFailure: true,
  },
  important: {
    skippable: false,
    requiresResolution: true,
    blockingOnFailure: false,
  },
  optional: {
    skippable: true,
    requiresResolution: false,
    blockingOnFailure: false,
  },
};

/**
 * Hook System - Manages sequential hook execution with context accumulation
 * Research → Advise → Orchestrate → Implement
 */
class HookSystem {
  constructor(options = {}) {
    this.options = {
      maxFeedbackIterations: 3, // Max times to ask agent for revision
      enableHumanInTheLoop: true, // Prompt user on conflicts
      useRealLLMs: true, // PRODUCTION: Always use real LLMs
      enforceOrchestration: true, // Enable orchestrator validation
      ...options,
    };

    // Current execution context
    this.context = {
      brief: null,
      advice: [], // Accumulated advice from all hooks
      projectContext: null,
      decisions: [], // Human decisions made during execution
      revisions: [], // Tracking all revisions
      validationResults: [], // Orchestrator validation results
    };

    // Initialize orchestrator validator
    this.orchestrator = new OrchestratorValidator({
      maxRevisionIterations: this.options.maxFeedbackIterations,
      enableConflictResolution: this.options.enableHumanInTheLoop,
      enforcePatterns: true
    });

    // Configured hook sequence
    this.hooks = {
      sequence: [
        {
          name: 'brief-analysis',
          agent: 'brief-writer',
          priority: 'critical',
          description: 'Analyze requirements and create brief'
        },
        {
          name: 'ui-requirements',
          agent: 'ui-advisor',
          priority: 'critical',
          description: 'Identify UI/UX requirements and patterns'
        },
        {
          name: 'test-strategy',
          agent: 'test-advisor',
          priority: 'critical',
          description: 'Define testing strategy and coverage requirements'
        },
        {
          name: 'security-review',
          agent: 'security-advisor',
          priority: 'critical',
          description: 'Identify security considerations and risks'
        },
        {
          name: 'performance-check',
          agent: 'performance-advisor',
          priority: 'optional',
          description: 'Analyze performance implications'
        },
        {
          name: 'regression-risk',
          agent: 'regression-advisor',
          priority: 'optional',
          description: 'Identify potential regression risks'
        },
      ],
      // Runtime enforcement hooks (triggered during implementation)
      enforcement: [
        {
          name: 'tdd-enforcement',
          agent: 'tdd-enforcer',
          priority: 'critical',
          trigger: 'after-write',
          description: 'Enforce test runs after each implementation phase',
          enabled: true,
          canBeSkipped: false
        }
      ]
    };

    this.executionHistory = [];
  }

  /**
   * Execute hooks sequentially with growing context
   * @param {Object} brief - Initial brief/requirements
   * @param {Object} projectContext - Full project context for orchestrator
   * @returns {Object} Final context with all accumulated advice
   */
  async executeSequentialHooks(brief, projectContext = {}) {
    console.log('\n🔗 Hook System: Sequential Execution Starting');
    console.log(`   Brief: ${brief.title || brief.description || 'Untitled'}`);
    console.log(`   Hooks to execute: ${this.hooks.sequence.length}`);
    console.log('');

    // Initialize context
    this.context = {
      brief,
      advice: [],
      projectContext,
      decisions: [],
      revisions: [],
      startTime: new Date(),
    };

    const results = [];

    // Execute hooks sequentially
    for (const hook of this.hooks.sequence) {
      console.log(`\n📌 Hook: ${hook.name} (${hook.priority})`);
      console.log(`   Agent: ${hook.agent}`);
      console.log(`   ${hook.description}`);

      const priorityConfig = PRIORITY_LEVELS[hook.priority];

      try {
        // Execute hook and get advice
        const result = await this.executeHook(hook);

        // Add to context for next hooks
        this.context.advice.push({
          hookName: hook.name,
          agent: hook.agent,
          priority: hook.priority,
          ...result,
        });

        results.push({
          hook: hook.name,
          success: true,
          result,
        });

        console.log(`   ✅ Hook completed successfully`);
      } catch (error) {
        console.error(`   ❌ Hook failed: ${error.message}`);

        results.push({
          hook: hook.name,
          success: false,
          error: error.message,
        });

        // Handle failure based on priority
        if (priorityConfig.blockingOnFailure) {
          console.log(`   🛑 Critical hook failed - stopping execution`);
          break;
        } else {
          console.log(`   ⚠️  Non-blocking hook failed - continuing`);
        }
      }
    }

    // Run orchestrator validation with feedback loop
    console.log('\n🎯 Orchestrator Validation Phase');
    const validation = await this.runOrchestratorValidation();

    // Store execution history
    this.executionHistory.push({
      brief,
      results,
      validation,
      finalContext: { ...this.context },
      timestamp: new Date(),
      duration: Date.now() - this.context.startTime,
    });

    return {
      success: validation.approved,
      context: this.context,
      validation,
      results,
    };
  }

  /**
   * Run orchestrator validation with feedback loop
   */
  async runOrchestratorValidation() {
    if (!this.options.enforceOrchestration) {
      return { approved: true, message: 'Orchestration disabled' };
    }

    let validation;
    let revisionCount = 0;
    const maxRevisions = this.options.maxFeedbackIterations;

    // Load enhanced project context
    const enhancedContext = await this.loadEnhancedProjectContext();

    while (revisionCount < maxRevisions) {
      // Validate accumulated advice
      validation = await this.orchestrator.validateHookAdvice(
        this.context.advice,
        enhancedContext
      );

      this.context.validationResults.push(validation);

      if (validation.approved) {
        console.log('   ✅ Orchestrator approved implementation plan');
        break;
      }

      console.log(`   ⚠️  Validation issues found (attempt ${revisionCount + 1}/${maxRevisions})`);

      // Display issues
      if (validation.conflicts.length > 0) {
        console.log('   Conflicts:');
        validation.conflicts.forEach(c => {
          console.log(`     - ${c.description}`);
          console.log(`       Resolution: ${c.resolution}`);
        });
      }

      if (validation.patternViolations.length > 0) {
        console.log('   Pattern violations:');
        validation.patternViolations.forEach(v => {
          console.log(`     - ${v.description}`);
          console.log(`       Fix: ${v.fix}`);
        });
      }

      if (validation.missingRequirements.length > 0) {
        console.log('   Missing requirements:');
        validation.missingRequirements.forEach(m => {
          console.log(`     - ${m.requirement} (${m.severity})`);
        });
      }

      // Request revisions from specific hooks
      if (revisionCount < maxRevisions - 1 && validation.revisionRequests.length > 0) {
        console.log('\n   📝 Requesting revisions from hooks...');
        await this.requestHookRevisions(validation.revisionRequests);
        revisionCount++;
      } else {
        break;
      }
    }

    if (!validation.approved && this.options.enableHumanInTheLoop) {
      console.log('\n   👤 Requesting human intervention...');
      validation = await this.requestHumanDecision(validation);
    }

    return validation;
  }

  /**
   * Load enhanced project context with patterns and completed features
   */
  async loadEnhancedProjectContext() {
    const context = {
      ...this.context.projectContext,
      patterns: {},
      completedFeatures: [],
      knownIssues: [],
      blueprints: []
    };

    try {
      // Load project patterns
      const projectRoot = process.cwd();

      // Load from PROJECT_CONTEXT.md
      const contextPath = path.join(projectRoot, '.claude', 'PROJECT_CONTEXT.md');
      try {
        const content = await fs.readFile(contextPath, 'utf-8');
        context.patterns = this.extractPatterns(content);
      } catch (e) {
        console.log('   ℹ️  PROJECT_CONTEXT.md not found, using defaults');
      }

      // Load completed features
      const completedDir = path.join(projectRoot, '.claude', 'completed');
      try {
        const files = await fs.readdir(completedDir);
        context.completedFeatures = files.filter(f => f.endsWith('.md'));
      } catch (e) {
        // Directory doesn't exist
      }

      // Load known issues from TROUBLESHOOTING.md
      const troubleshootingPath = path.join(projectRoot, '.claude', 'TROUBLESHOOTING.md');
      try {
        const content = await fs.readFile(troubleshootingPath, 'utf-8');
        context.knownIssues = this.extractIssues(content);
      } catch (e) {
        // File doesn't exist
      }

      // Load available blueprints
      const blueprintDir = path.join(projectRoot, 'blueprints');
      try {
        const files = await fs.readdir(blueprintDir);
        context.blueprints = files.filter(f => f.endsWith('.md'));
      } catch (e) {
        // Directory doesn't exist
      }

      context.projectRoot = projectRoot;
    } catch (error) {
      console.log(`   ⚠️  Error loading project context: ${error.message}`);
    }

    return context;
  }

  /**
   * Extract patterns from PROJECT_CONTEXT.md
   */
  extractPatterns(content) {
    const patterns = {
      requireDynamicExports: content.includes('export const dynamic'),
      requireDarkMode: content.includes('dark:'),
      requireSuspense: content.includes('Suspense'),
      requireRLS: content.includes('RLS') || content.includes('row level security'),
      useServerComponents: content.includes('Server Components'),
      versions: {}
    };

    // Extract version requirements
    const versionMatch = content.match(/next.*14\.2\.5/i);
    if (versionMatch) {
      patterns.versions.next = '14.2.5';
    }

    return patterns;
  }

  /**
   * Extract known issues from TROUBLESHOOTING.md
   */
  extractIssues(content) {
    const issues = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('##') && lines[i].includes('Issue')) {
        const issue = {
          title: lines[i].replace(/^#+\s*/, ''),
          description: '',
          solution: ''
        };

        // Get description and solution from following lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes('Solution:')) {
            issue.solution = lines[j];
          } else if (lines[j].trim() && !lines[j].startsWith('#')) {
            issue.description += lines[j] + ' ';
          }
        }

        issues.push(issue);
      }
    }

    return issues;
  }

  /**
   * Request revisions from specific hooks
   */
  async requestHookRevisions(revisionRequests) {
    for (const request of revisionRequests) {
      const hook = this.hooks.sequence.find(h => h.name === request.hookName);
      if (!hook) continue;

      console.log(`     Requesting revision from ${request.hookName}...`);

      // Find the original advice
      const originalAdviceIndex = this.context.advice.findIndex(
        a => a.hookName === request.hookName
      );

      if (originalAdviceIndex === -1) continue;

      const originalAdvice = this.context.advice[originalAdviceIndex];

      // Build revision prompt with specific feedback
      const revisionPrompt = this.buildRevisionPrompt(
        hook,
        originalAdvice,
        request.revisions
      );

      try {
        // Call agent with revision request
        const revisedAdvice = await this.callAgentWithRevision(
          hook.agent,
          revisionPrompt,
          originalAdvice
        );

        // Update advice in context
        this.context.advice[originalAdviceIndex] = {
          ...originalAdvice,
          ...revisedAdvice,
          revised: true,
          revisionCount: (originalAdvice.revisionCount || 0) + 1
        };

        console.log(`     ✅ Received revised advice from ${request.hookName}`);
      } catch (error) {
        console.log(`     ❌ Failed to get revision: ${error.message}`);
      }
    }
  }

  /**
   * Build revision prompt with specific feedback
   */
  buildRevisionPrompt(hook, originalAdvice, revisions) {
    let prompt = `You previously provided advice that needs revision.

ORIGINAL ADVICE:
${JSON.stringify(originalAdvice.findings, null, 2)}

ISSUES FOUND BY ORCHESTRATOR:
`;

    for (const rev of revisions) {
      prompt += `
- ${rev.type.toUpperCase()}: ${rev.issue}
  Suggestion: ${rev.suggestion}
`;
    }

    prompt += `
Please revise your advice to address these issues.
Maintain the same JSON structure but update your recommendations.
`;

    return prompt;
  }

  /**
   * Call agent with revision request
   */
  async callAgentWithRevision(agentName, revisionPrompt, originalAdvice) {
    const scriptPath = this.getLLMScript(agentName);
    const fullScriptPath = path.join(process.cwd(), 'scripts', scriptPath);

    try {
      const { stdout } = await execAsync(
        `echo '${revisionPrompt.replace(/'/g, "'\\''")}' | bash ${fullScriptPath}`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      return this.parseAdvice(stdout);
    } catch (error) {
      throw new Error(`Agent revision failed: ${error.message}`);
    }
  }

  /**
   * Request human decision for unresolved issues
   */
  async requestHumanDecision(validation) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\nOrchestrator validation failed after maximum revisions.');
    console.log('Issues remaining:');

    if (validation.conflicts.length > 0) {
      console.log('\nConflicts:');
      validation.conflicts.forEach(c => console.log(`  - ${c.description}`));
    }

    if (validation.patternViolations.length > 0) {
      console.log('\nPattern violations:');
      validation.patternViolations.forEach(v => console.log(`  - ${v.description}`));
    }

    const answer = await new Promise(resolve => {
      rl.question('\nProceed anyway? (y/n): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() === 'y') {
      validation.approved = true;
      validation.humanOverride = true;
      validation.overrideReason = 'Human decision to proceed despite issues';
    }

    return validation;
  }

  /**
   * Execute a single hook and get advice from sub-agent
   * Includes feedback loop for revisions
   * @param {Object} hook - Hook configuration
   * @returns {Object} Advice from sub-agent
   */
  async executeHook(hook) {
    let iteration = 0;
    let currentAdvice = null;
    let satisfied = false;

    while (iteration < this.options.maxFeedbackIterations && !satisfied) {
      if (iteration > 0) {
        console.log(`   🔄 Requesting revision (iteration ${iteration + 1})`);
      }

      // Call sub-agent with accumulated context
      const advice = await this.callSubAgent(hook, currentAdvice);

      // Validate advice format
      const validation = this.validateAdviceFormat(advice);
      if (!validation.valid) {
        console.log(`   ⚠️  Invalid advice format: ${validation.error}`);

        if (iteration === this.options.maxFeedbackIterations - 1) {
          throw new Error(`Invalid advice format after ${this.options.maxFeedbackIterations} attempts`);
        }

        currentAdvice = {
          ...advice,
          feedback: validation.error,
        };
        iteration++;
        continue;
      }

      // Check if advice is satisfactory
      satisfied = this.isAdviceSatisfactory(advice, hook);

      if (!satisfied && iteration < this.options.maxFeedbackIterations - 1) {
        // Provide feedback for improvement
        currentAdvice = {
          ...advice,
          feedback: 'Please provide more specific details and actionable recommendations',
        };
      } else {
        currentAdvice = advice;
      }

      iteration++;
    }

    // Track revision history
    this.context.revisions.push({
      hook: hook.name,
      iterations: iteration,
      finalAdvice: currentAdvice,
      timestamp: new Date(),
    });

    return currentAdvice;
  }

  /**
   * Call sub-agent with current context
   * @param {Object} hook - Hook configuration
   * @param {Object} previousAdvice - Previous advice if requesting revision
   * @returns {Object} Advice from sub-agent
   */
  async callSubAgent(hook, previousAdvice = null) {
    const prompt = this.buildSubAgentPrompt(hook, previousAdvice);

    try {
      let output;

      // Call appropriate agent script
      switch (hook.agent) {
        case 'brief-writer':
        case 'test-advisor':
        case 'security-advisor':
        case 'performance-advisor':
        case 'regression-advisor':
        case 'ui-advisor':
          output = await this.callAgentScript(hook.agent, prompt);
          break;
        default:
          throw new Error(`Unknown agent: ${hook.agent}`);
      }

      // Parse advice response
      return this.parseAdvice(output);
    } catch (error) {
      throw new Error(`Sub-agent call failed: ${error.message}`);
    }
  }

  /**
   * Build prompt for sub-agent with accumulated context
   * @param {Object} hook - Hook configuration
   * @param {Object} previousAdvice - Previous advice if requesting revision
   * @returns {string} Prompt text
   */
  buildSubAgentPrompt(hook, previousAdvice = null) {
    let prompt = `You are a sub-agent providing RESEARCH and ADVICE only (NO code generation).

HOOK: ${hook.name}
ROLE: ${hook.description}

BRIEF:
${JSON.stringify(this.context.brief, null, 2)}

ACCUMULATED CONTEXT FROM PREVIOUS HOOKS:
${this.context.advice.length > 0
  ? this.context.advice.map(a => `
[${a.hookName}] Priority: ${a.priority}
Findings: ${JSON.stringify(a.findings, null, 2)}
`).join('\n')
  : 'No previous advice yet'}
`;

    if (previousAdvice?.feedback) {
      prompt += `

FEEDBACK ON YOUR PREVIOUS ADVICE:
${previousAdvice.feedback}

YOUR PREVIOUS ADVICE:
${JSON.stringify(previousAdvice, null, 2)}

Please revise your advice to address the feedback.
`;
    }

    prompt += `

RESPOND IN THIS EXACT FORMAT:
{
  "findings": {
    "issues": ["List of issues found, or empty array"],
    "suggestions": ["List of actionable suggestions, or empty array"],
    "references": ["References to existing code/patterns, or empty array"],
    "risks": ["Identified risks, or empty array"]
  },
  "priority": "${hook.priority}",
  "confidence": 0.85
}

IMPORTANT:
- Provide ADVICE and RESEARCH only
- NO code generation or implementation
- Be specific and actionable
- Reference existing patterns when relevant
- Consider advice from previous hooks
`;

    return prompt;
  }

  /**
   * Call agent script using real LLM
   * @param {string} agentName - Name of agent
   * @param {string} prompt - Prompt text
   * @returns {string} Agent output
   */
  async callAgentScript(agentName, prompt) {
    console.log(`   📡 Calling ${agentName} agent...`);
    return await this.callRealLLM(agentName, prompt);
  }

  /**
   * Call real LLM agent (either bash script or proper agent)
   * @param {string} agentName - Name of agent
   * @param {string} prompt - Prompt text
   * @returns {string} LLM output
   */
  async callRealLLM(agentName, prompt) {
    const scriptOrAgent = this.getLLMScript(agentName);

    console.log(`   🤖 Using real LLM for ${agentName}...`);

    // Use proper agent for Codex instead of bash script
    if (scriptOrAgent === 'codex-reviewer') {
      const { CodexReviewer } = require('./agents/codex-reviewer');
      const reviewer = new CodexReviewer({
        timeout: 1200000, // 20 minutes for deep analysis
        saveResponses: true,
      });

      const result = await reviewer.review(prompt);

      if (!result.success) {
        throw new Error(`Codex review failed: ${result.error}`);
      }

      return result.response;
    }

    // Fall back to bash scripts for other LLMs (legacy support)
    const { spawn } = require('child_process');
    const scriptPath = path.join(__dirname, '../scripts', scriptOrAgent);

    return new Promise((resolve, reject) => {
      const child = spawn('bash', [scriptPath], {
        timeout: 1200000,
        maxBuffer: 10 * 1024 * 1024,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn LLM script: ${error.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`LLM script exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      // Write prompt to stdin
      child.stdin.write(prompt);
      child.stdin.end();
    });
  }

  /**
   * Get LLM script for agent
   * Maps agent names to appropriate LLM scripts based on task requirements
   * Optimized routing using best model for each type of analysis
   * @param {string} agentName - Name of agent
   * @returns {string} Script filename
   */
  getLLMScript(agentName) {
    const llmMapping = {
      // Deep thinking for requirements analysis - Claude Opus best reasoning
      'brief-writer': 'ask-claude-opus.sh',

      // UI/UX expertise - Gemini Flash excels here, fast and cheap
      'ui-advisor': 'ask-gemini.sh',

      // Testing strategy - GPT-4o good reasoning, we have access
      'test-advisor': 'ask-gpt.sh',

      // Security analysis - GPT-5 Codex via proper agent
      'security-advisor': 'codex-reviewer',

      // Performance optimization - GPT-4o for performance reasoning
      'performance-advisor': 'ask-gpt.sh',

      // Regression risks - GPT-5 Codex via proper agent
      'regression-advisor': 'codex-reviewer',
    };

    return llmMapping[agentName] || 'ask-gemini.sh';
  }


  /**
   * Parse advice from sub-agent response
   * Handles various formats: plain JSON, markdown code blocks, etc.
   * @param {string} output - Raw agent output
   * @returns {Object} Parsed advice
   */
  parseAdvice(output) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(output);
      return parsed;
    } catch (error) {
      // Try to extract JSON from markdown code block
      const markdownMatch = output.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        try {
          return JSON.parse(markdownMatch[1]);
        } catch (e) {
          // Continue to next attempt
        }
      }

      // Try to find any JSON object in the text
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('Could not parse advice as JSON');
        }
      }

      throw new Error('No valid JSON found in agent output');
    }
  }

  /**
   * Validate advice format from sub-agent
   * @param {Object} advice - Advice object
   * @returns {Object} Validation result
   */
  validateAdviceFormat(advice) {
    if (!advice || typeof advice !== 'object') {
      return { valid: false, error: 'Advice must be an object' };
    }

    if (!advice.findings || typeof advice.findings !== 'object') {
      return { valid: false, error: 'Must include findings object' };
    }

    const requiredFields = ['issues', 'suggestions', 'references', 'risks'];
    for (const field of requiredFields) {
      if (!Array.isArray(advice.findings[field])) {
        return {
          valid: false,
          error: `findings.${field} must be an array`
        };
      }
    }

    if (!advice.priority || !PRIORITY_LEVELS[advice.priority]) {
      return {
        valid: false,
        error: 'Must include valid priority (critical/important/optional)'
      };
    }

    if (typeof advice.confidence !== 'number' || advice.confidence < 0 || advice.confidence > 1) {
      return {
        valid: false,
        error: 'confidence must be a number between 0 and 1'
      };
    }

    return { valid: true };
  }

  /**
   * Check if advice is satisfactory
   * @param {Object} advice - Advice object
   * @param {Object} hook - Hook configuration
   * @returns {boolean} Whether advice is satisfactory
   */
  isAdviceSatisfactory(advice, hook) {
    // For critical hooks, require substantive findings
    if (hook.priority === 'critical') {
      const totalFindings =
        advice.findings.issues.length +
        advice.findings.suggestions.length +
        advice.findings.risks.length;

      // If confidence is very low, might want revision
      if (advice.confidence < 0.5) {
        return false;
      }

      // Critical hooks should provide some findings
      // (unless truly nothing to report, indicated by high confidence)
      if (totalFindings === 0 && advice.confidence < 0.9) {
        return false;
      }
    }

    return true;
  }

  /**
   * Orchestrator reviews all accumulated advice against project context
   * @returns {Object} Validation result
   */
  async orchestratorReview() {
    console.log('   🔍 Validating all advice against project context...');

    // Aggregate all advice
    const allIssues = this.context.advice.flatMap(a => a.findings.issues);
    const allSuggestions = this.context.advice.flatMap(a => a.findings.suggestions);
    const allRisks = this.context.advice.flatMap(a => a.findings.risks);

    // Check for conflicts between agents
    const conflicts = this.detectConflicts(this.context.advice);

    if (conflicts.length > 0 && this.options.enableHumanInTheLoop) {
      console.log(`   ⚠️  Detected ${conflicts.length} conflicts between agents`);
      const resolution = await this.humanInTheLoop(conflicts);
      this.context.decisions.push({
        type: 'conflict-resolution',
        conflicts,
        resolution,
        timestamp: new Date(),
      });
    }

    // Validate advice is implementable
    const implementable = this.validateImplementability(this.context.advice);

    // Check if critical issues need resolution
    const criticalIssues = this.context.advice
      .filter(a => a.priority === 'critical')
      .flatMap(a => a.findings.issues);

    const hasBlockingIssues = criticalIssues.length > 0;

    if (hasBlockingIssues) {
      console.log(`   ⚠️  Found ${criticalIssues.length} critical issues`);

      // Could trigger feedback loop here if needed
      const needsRevision = await this.feedbackLoop(criticalIssues);

      if (needsRevision) {
        return {
          approved: false,
          requiresRevision: true,
          criticalIssues,
          allIssues,
          conflicts,
        };
      }
    }

    const approved = !hasBlockingIssues && implementable && conflicts.length === 0;

    console.log(`   ${approved ? '✅ Approved' : '❌ Not approved'}`);

    return {
      approved,
      criticalIssues,
      allIssues,
      allSuggestions,
      allRisks,
      conflicts,
      implementable,
      summary: this.generateValidationSummary(),
    };
  }

  /**
   * Detect conflicts between advice from different agents
   * @param {Array} adviceList - List of advice from all agents
   * @returns {Array} List of detected conflicts
   */
  detectConflicts(adviceList) {
    const conflicts = [];

    // Look for contradictory suggestions
    for (let i = 0; i < adviceList.length; i++) {
      for (let j = i + 1; j < adviceList.length; j++) {
        const advice1 = adviceList[i];
        const advice2 = adviceList[j];

        // Simple keyword-based conflict detection
        // In production, would use more sophisticated NLP
        const suggestions1 = advice1.findings.suggestions.join(' ').toLowerCase();
        const suggestions2 = advice2.findings.suggestions.join(' ').toLowerCase();

        // Look for opposing keywords
        if (
          (suggestions1.includes('use') && suggestions2.includes("don't use")) ||
          (suggestions1.includes('add') && suggestions2.includes('remove')) ||
          (suggestions1.includes('synchronous') && suggestions2.includes('asynchronous'))
        ) {
          conflicts.push({
            agent1: advice1.agent,
            agent2: advice2.agent,
            advice1: advice1.findings.suggestions,
            advice2: advice2.findings.suggestions,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Validate that advice is implementable
   * @param {Array} adviceList - List of advice from all agents
   * @returns {boolean} Whether advice is implementable
   */
  validateImplementability(adviceList) {
    // Check if suggestions are actionable
    for (const advice of adviceList) {
      for (const suggestion of advice.findings.suggestions) {
        // Too vague?
        if (suggestion.length < 10) {
          console.log(`   ⚠️  Vague suggestion: "${suggestion}"`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Generate validation summary
   * @returns {string} Summary text
   */
  generateValidationSummary() {
    const totalAdvice = this.context.advice.length;
    const criticalAdvice = this.context.advice.filter(a => a.priority === 'critical').length;
    const totalIssues = this.context.advice.reduce(
      (sum, a) => sum + a.findings.issues.length,
      0
    );
    const totalSuggestions = this.context.advice.reduce(
      (sum, a) => sum + a.findings.suggestions.length,
      0
    );

    return `Reviewed ${totalAdvice} pieces of advice (${criticalAdvice} critical). Found ${totalIssues} issues and ${totalSuggestions} suggestions.`;
  }

  /**
   * Feedback loop - send issues back to specific agents for revision
   * @param {Array} issues - List of critical issues
   * @returns {boolean} Whether revision is needed
   */
  async feedbackLoop(issues) {
    console.log('\n🔄 Feedback Loop: Addressing Critical Issues');

    // For now, just log issues
    // In production, would send back to specific agents
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });

    // Could re-run specific hooks here with feedback
    // For now, return false (no revision needed in this implementation)
    return false;
  }

  /**
   * Human-in-the-loop - present conflicts to user for decision
   * @param {Array} conflicts - List of conflicts
   * @returns {Object} User's resolution
   */
  async humanInTheLoop(conflicts) {
    console.log('\n👤 Human Decision Required: Conflicting Advice\n');

    const decisions = [];

    for (const conflict of conflicts) {
      console.log(`Conflict between ${conflict.agent1} and ${conflict.agent2}:`);
      console.log(`\nOption A (${conflict.agent1}):`);
      conflict.advice1.forEach(a => console.log(`  - ${a}`));
      console.log(`\nOption B (${conflict.agent2}):`);
      conflict.advice2.forEach(a => console.log(`  - ${a}`));
      console.log('');

      // In production, would prompt user for choice
      // For now, auto-select first option
      const decision = 'A';
      console.log(`Decision: Option ${decision}\n`);

      decisions.push({
        conflict,
        choice: decision,
        chosenAgent: decision === 'A' ? conflict.agent1 : conflict.agent2,
      });
    }

    return decisions;
  }

  /**
   * Get execution history
   * @returns {Array} History of all executions
   */
  getHistory() {
    return this.executionHistory;
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const total = this.executionHistory.length;
    const approved = this.executionHistory.filter(h => h.validation.approved).length;
    const avgDuration =
      this.executionHistory.reduce((sum, h) => sum + h.duration, 0) / total || 0;
    const avgAdvice =
      this.executionHistory.reduce((sum, h) => sum + h.finalContext.advice.length, 0) / total || 0;

    return {
      totalExecutions: total,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      averageDuration: Math.round(avgDuration),
      averageAdviceCount: avgAdvice.toFixed(1),
      history: this.executionHistory,
    };
  }

  /**
   * Reset context (for testing)
   */
  reset() {
    this.context = {
      brief: null,
      advice: [],
      projectContext: null,
      decisions: [],
      revisions: [],
    };
  }
}

module.exports = HookSystem;
module.exports.PRIORITY_LEVELS = PRIORITY_LEVELS;
