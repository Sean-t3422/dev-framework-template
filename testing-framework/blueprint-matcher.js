/**
 * @fileoverview Blueprint Matching and Enforcement System
 * Matches features to existing blueprints and enforces proven patterns
 */

const fs = require('fs').promises;
const path = require('path');

class BlueprintMatcher {
  constructor(options = {}) {
    this.options = {
      blueprintDir: path.join(process.cwd(), 'blueprints'),
      enforceMatching: true,
      similarityThreshold: 0.7,
      ...options
    };

    this.blueprintCache = new Map();
    this.matchHistory = [];
  }

  /**
   * Find matching blueprint for a feature
   * @param {Object} brief - Feature brief
   * @param {Object} context - Project context
   * @returns {Object} Matching blueprint or null
   */
  async findMatchingBlueprint(brief, context) {
    console.log('\n🔍 Searching for matching blueprints...');

    // Load all available blueprints
    const blueprints = await this.loadAllBlueprints();

    if (blueprints.length === 0) {
      console.log('   ℹ️  No blueprints found');
      return null;
    }

    // Score each blueprint against the brief
    const scores = [];
    for (const blueprint of blueprints) {
      const score = await this.scoreBlueprint(blueprint, brief);
      scores.push({ blueprint, score });
    }

    // Sort by score and get best match
    scores.sort((a, b) => b.score - a.score);
    const bestMatch = scores[0];

    if (bestMatch.score >= this.options.similarityThreshold) {
      console.log(`   ✅ Found matching blueprint: ${bestMatch.blueprint.name} (${(bestMatch.score * 100).toFixed(0)}% match)`);

      // Track match for analytics
      this.matchHistory.push({
        brief: brief.title || brief.description,
        blueprint: bestMatch.blueprint.name,
        score: bestMatch.score,
        timestamp: new Date()
      });

      return bestMatch.blueprint;
    }

    console.log(`   ℹ️  No blueprint matched above ${this.options.similarityThreshold * 100}% threshold`);
    return null;
  }

  /**
   * Load all available blueprints
   */
  async loadAllBlueprints() {
    const blueprints = [];

    try {
      const files = await fs.readdir(this.options.blueprintDir);
      const blueprintFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.json'));

      for (const file of blueprintFiles) {
        const blueprint = await this.loadBlueprint(file);
        if (blueprint) {
          blueprints.push(blueprint);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Error loading blueprints: ${error.message}`);
    }

    return blueprints;
  }

  /**
   * Load a single blueprint
   */
  async loadBlueprint(filename) {
    // Check cache first
    if (this.blueprintCache.has(filename)) {
      return this.blueprintCache.get(filename);
    }

    const filepath = path.join(this.options.blueprintDir, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      let blueprint;

      if (filename.endsWith('.json')) {
        blueprint = JSON.parse(content);
      } else {
        // Parse markdown blueprint
        blueprint = this.parseBlueprintMarkdown(content, filename);
      }

      blueprint.filename = filename;
      blueprint.name = blueprint.name || filename.replace(/\.(md|json)$/, '');

      // Cache for future use
      this.blueprintCache.set(filename, blueprint);

      return blueprint;
    } catch (error) {
      console.log(`   ⚠️  Error loading blueprint ${filename}: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse markdown blueprint into structured format
   */
  parseBlueprintMarkdown(content, filename) {
    const blueprint = {
      name: '',
      type: '',
      description: '',
      patterns: [],
      components: [],
      dependencies: [],
      testStrategy: '',
      securityMeasures: [],
      keywords: []
    };

    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      // Parse title
      if (line.startsWith('# ')) {
        blueprint.name = line.replace('# ', '').trim();
      }
      // Parse sections
      else if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim().toLowerCase();
      }
      // Parse content based on section
      else if (line.trim()) {
        switch (currentSection) {
          case 'description':
          case 'overview':
            blueprint.description += line + ' ';
            break;

          case 'type':
          case 'feature type':
            blueprint.type = line.trim();
            break;

          case 'patterns':
          case 'design patterns':
            if (line.startsWith('- ') || line.startsWith('* ')) {
              blueprint.patterns.push(line.substring(2).trim());
            }
            break;

          case 'components':
          case 'reusable components':
            if (line.startsWith('- ') || line.startsWith('* ')) {
              blueprint.components.push(line.substring(2).trim());
            }
            break;

          case 'dependencies':
          case 'required dependencies':
            if (line.startsWith('- ') || line.startsWith('* ')) {
              blueprint.dependencies.push(line.substring(2).trim());
            }
            break;

          case 'test strategy':
          case 'testing':
            blueprint.testStrategy += line + ' ';
            break;

          case 'security':
          case 'security measures':
            if (line.startsWith('- ') || line.startsWith('* ')) {
              blueprint.securityMeasures.push(line.substring(2).trim());
            }
            break;

          case 'keywords':
          case 'tags':
            blueprint.keywords = line.split(',').map(k => k.trim());
            break;
        }
      }
    }

    // Extract keywords from content if not explicitly defined
    if (blueprint.keywords.length === 0) {
      blueprint.keywords = this.extractKeywords(content);
    }

    return blueprint;
  }

  /**
   * Extract keywords from blueprint content
   */
  extractKeywords(content) {
    const keywords = [];
    const importantTerms = [
      'authentication', 'auth', 'login', 'signup',
      'payment', 'stripe', 'billing', 'subscription',
      'crud', 'create', 'read', 'update', 'delete',
      'dashboard', 'admin', 'analytics', 'charts',
      'form', 'validation', 'input', 'submit',
      'api', 'rest', 'graphql', 'endpoint',
      'database', 'migration', 'schema', 'table',
      'email', 'notification', 'messaging', 'chat',
      'upload', 'file', 'image', 'media',
      'search', 'filter', 'sort', 'pagination'
    ];

    for (const term of importantTerms) {
      if (content.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    }

    return keywords;
  }

  /**
   * Score a blueprint against a brief
   */
  async scoreBlueprint(blueprint, brief) {
    let score = 0;
    let factors = 0;

    // 1. Type matching (high weight)
    if (blueprint.type && brief.type) {
      if (blueprint.type.toLowerCase() === brief.type.toLowerCase()) {
        score += 0.3;
      }
      factors += 0.3;
    }

    // 2. Keyword matching
    const briefText = `${brief.title || ''} ${brief.description || ''} ${(brief.requirements || []).join(' ')}`.toLowerCase();

    if (blueprint.keywords && blueprint.keywords.length > 0) {
      const matchingKeywords = blueprint.keywords.filter(keyword =>
        briefText.includes(keyword.toLowerCase())
      );
      const keywordScore = matchingKeywords.length / blueprint.keywords.length;
      score += keywordScore * 0.2;
      factors += 0.2;
    }

    // 3. Description similarity
    if (blueprint.description && brief.description) {
      const similarity = this.calculateTextSimilarity(
        blueprint.description.toLowerCase(),
        brief.description.toLowerCase()
      );
      score += similarity * 0.2;
      factors += 0.2;
    }

    // 4. Requirements matching
    if (blueprint.patterns && brief.requirements) {
      const patternMatches = blueprint.patterns.filter(pattern => {
        return brief.requirements.some(req =>
          req.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(req.toLowerCase())
        );
      });
      if (blueprint.patterns.length > 0) {
        const patternScore = patternMatches.length / blueprint.patterns.length;
        score += patternScore * 0.15;
      }
      factors += 0.15;
    }

    // 5. Component relevance
    if (blueprint.components && blueprint.components.length > 0) {
      const componentMatches = blueprint.components.filter(component =>
        briefText.includes(component.toLowerCase())
      );
      const componentScore = componentMatches.length / blueprint.components.length;
      score += componentScore * 0.15;
      factors += 0.15;
    }

    // Normalize score
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));

    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Enforce blueprint patterns in implementation
   */
  async enforceBlueprint(blueprint, implementation) {
    const enforcement = {
      violations: [],
      suggestions: [],
      requiredComponents: [],
      missingPatterns: []
    };

    // Check for required patterns
    for (const pattern of blueprint.patterns || []) {
      if (!implementation.includes(pattern)) {
        enforcement.missingPatterns.push(pattern);
      }
    }

    // Check for required components
    for (const component of blueprint.components || []) {
      enforcement.requiredComponents.push({
        name: component,
        status: implementation.includes(component) ? 'present' : 'missing'
      });
    }

    // Check security measures
    for (const measure of blueprint.securityMeasures || []) {
      if (!implementation.includes(measure)) {
        enforcement.violations.push({
          type: 'security',
          description: `Missing security measure: ${measure}`,
          severity: 'high'
        });
      }
    }

    // Generate suggestions
    if (enforcement.missingPatterns.length > 0) {
      enforcement.suggestions.push(
        `Implement missing patterns: ${enforcement.missingPatterns.join(', ')}`
      );
    }

    const missingComponents = enforcement.requiredComponents
      .filter(c => c.status === 'missing')
      .map(c => c.name);

    if (missingComponents.length > 0) {
      enforcement.suggestions.push(
        `Add required components: ${missingComponents.join(', ')}`
      );
    }

    return enforcement;
  }

  /**
   * Generate new blueprint from successful implementation
   */
  async generateBlueprint(feature, implementation, testResults) {
    const blueprint = {
      name: feature.title || feature.name,
      type: feature.type || 'general',
      description: feature.description || '',
      patterns: [],
      components: [],
      dependencies: [],
      testStrategy: '',
      securityMeasures: [],
      keywords: [],
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'auto-generated',
        testCoverage: testResults.coverage || 0,
        complexity: feature.complexity || 'moderate'
      }
    };

    // Extract patterns from implementation
    blueprint.patterns = this.extractPatternsFromCode(implementation);

    // Extract components
    blueprint.components = this.extractComponentsFromCode(implementation);

    // Extract dependencies from package.json mentions
    blueprint.dependencies = this.extractDependencies(implementation);

    // Set test strategy based on results
    blueprint.testStrategy = `Coverage: ${testResults.coverage}%, ` +
      `Types: ${testResults.testTypes?.join(', ') || 'unit, integration'}`;

    // Extract security measures
    blueprint.securityMeasures = this.extractSecurityMeasures(implementation);

    // Generate keywords
    blueprint.keywords = this.extractKeywords(
      `${blueprint.name} ${blueprint.description} ${blueprint.patterns.join(' ')}`
    );

    // Save blueprint
    const filename = `${feature.name || 'feature'}-${Date.now()}.json`;
    const filepath = path.join(this.options.blueprintDir, 'generated', filename);

    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(blueprint, null, 2));
      console.log(`   ✅ Generated new blueprint: ${filename}`);
    } catch (error) {
      console.log(`   ⚠️  Failed to save blueprint: ${error.message}`);
    }

    return blueprint;
  }

  /**
   * Extract patterns from code
   */
  extractPatternsFromCode(code) {
    const patterns = [];

    // Common patterns to detect
    const patternDetectors = [
      { pattern: 'Server Component', regex: /export\s+default\s+async\s+function/g },
      { pattern: 'Client Component', regex: /'use client'/g },
      { pattern: 'API Route', regex: /export\s+async\s+function\s+(GET|POST|PUT|DELETE)/g },
      { pattern: 'Middleware', regex: /export\s+(?:default\s+)?function\s+middleware/g },
      { pattern: 'RLS Policy', regex: /create\s+policy/gi },
      { pattern: 'Zod Validation', regex: /z\.(object|string|number|boolean)/g },
      { pattern: 'Suspense Boundary', regex: /<Suspense/g },
      { pattern: 'Error Boundary', regex: /ErrorBoundary|error\.tsx/g },
      { pattern: 'Loading State', regex: /loading\.(tsx?|jsx?)|<.*Loading/g },
      { pattern: 'Dark Mode', regex: /dark:/g }
    ];

    for (const detector of patternDetectors) {
      if (detector.regex.test(code)) {
        patterns.push(detector.pattern);
      }
    }

    return patterns;
  }

  /**
   * Extract components from code
   */
  extractComponentsFromCode(code) {
    const components = [];

    // Match React component definitions
    const componentRegex = /(?:export\s+)?(?:default\s+)?function\s+([A-Z][a-zA-Z]*)|(?:const|let)\s+([A-Z][a-zA-Z]*)\s*=\s*(?:\([^)]*\)|[^=])*=>/g;

    let match;
    while ((match = componentRegex.exec(code)) !== null) {
      const componentName = match[1] || match[2];
      if (componentName && !components.includes(componentName)) {
        components.push(componentName);
      }
    }

    return components;
  }

  /**
   * Extract dependencies
   */
  extractDependencies(code) {
    const dependencies = [];

    // Match import statements
    const importRegex = /import\s+.*?\s+from\s+['"]((?:@[^/'"]+\/)?[^/'"]+)/g;

    let match;
    const seen = new Set();

    while ((match = importRegex.exec(code)) !== null) {
      const dep = match[1];
      // Only external dependencies (not relative imports)
      if (!dep.startsWith('.') && !dep.startsWith('~') && !seen.has(dep)) {
        dependencies.push(dep);
        seen.add(dep);
      }
    }

    return dependencies;
  }

  /**
   * Extract security measures
   */
  extractSecurityMeasures(code) {
    const measures = [];

    const securityPatterns = [
      { measure: 'Authentication check', regex: /getUser|requireAuth|isAuthenticated/g },
      { measure: 'Input validation', regex: /validate|sanitize|escape|z\.(parse|safeParse)/g },
      { measure: 'CSRF protection', regex: /csrf|csrfToken/gi },
      { measure: 'Rate limiting', regex: /rateLimit|throttle/gi },
      { measure: 'SQL injection prevention', regex: /parameterized|prepared\s+statement|\.prepare/g },
      { measure: 'XSS prevention', regex: /DOMPurify|sanitizeHtml|escape/g },
      { measure: 'RLS policies', regex: /create\s+policy|using\s*\(/gi },
      { measure: 'Permission checks', regex: /hasPermission|canAccess|authorize/g }
    ];

    for (const sp of securityPatterns) {
      if (sp.regex.test(code)) {
        measures.push(sp.measure);
      }
    }

    return measures;
  }

  /**
   * Get matching statistics
   */
  getStatistics() {
    const total = this.matchHistory.length;
    const matched = this.matchHistory.filter(m => m.score >= this.options.similarityThreshold).length;

    const avgScore = total > 0
      ? this.matchHistory.reduce((sum, m) => sum + m.score, 0) / total
      : 0;

    const topBlueprints = {};
    for (const match of this.matchHistory) {
      topBlueprints[match.blueprint] = (topBlueprints[match.blueprint] || 0) + 1;
    }

    const mostUsed = Object.entries(topBlueprints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalMatches: total,
      successfulMatches: matched,
      matchRate: total > 0 ? (matched / total * 100).toFixed(1) : 0,
      averageScore: (avgScore * 100).toFixed(1),
      mostUsedBlueprints: mostUsed
    };
  }
}

module.exports = BlueprintMatcher;