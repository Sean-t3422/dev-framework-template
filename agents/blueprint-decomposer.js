#!/usr/bin/env node
/**
 * @fileoverview Blueprint Decomposer Agent
 *
 * Reads detailed specs from spec-writer and decomposes them into prescriptive blueprints.
 * Each blueprint is a 5-10 minute task with exact specifications.
 *
 * CRITICAL: Blueprints must be PRESCRIPTIVE (no creativity allowed):
 * - Exact table names
 * - Exact column names
 * - Exact function names
 * - Exact file paths
 * - Exact migration numbers
 */

const fs = require('fs').promises;
const path = require('path');
const { MigrationHelper } = require('../lib/migration-helper');
const { SpecParser } = require('../lib/spec-parser');

class BlueprintDecomposer {
  constructor() {
    this.blueprintIdCounter = 1;
    this.migrationHelper = null;

    // Evidence requirements by blueprint type
    this.evidenceRequirements = {
      database: {
        required: [
          { type: 'output', description: 'Migration applied successfully' },
          { type: 'test', description: 'Database tests passing' },
          { type: 'metric', description: 'Query performance <100ms (EXPLAIN output)' }
        ],
        optional: [
          { type: 'screenshot', description: 'Supabase dashboard showing table' }
        ]
      },
      api: {
        required: [
          { type: 'test', description: 'API endpoint tests passing' },
          { type: 'metric', description: 'Response time <200ms' },
          { type: 'output', description: 'Auth validation working' }
        ],
        optional: [
          { type: 'output', description: 'API documentation updated' }
        ]
      },
      service: {
        required: [
          { type: 'test', description: 'Service unit tests passing' },
          { type: 'output', description: 'TypeScript types correct' }
        ],
        optional: [
          { type: 'metric', description: 'Performance benchmarks' }
        ]
      },
      'ui-component': {
        required: [
          { type: 'screenshot', description: 'Component rendering (default state)' },
          { type: 'screenshot', description: 'Loading state' },
          { type: 'screenshot', description: 'Error state' },
          { type: 'screenshot', description: 'Mobile responsive (375px width)' },
          { type: 'test', description: 'Component tests passing' }
        ],
        optional: [
          { type: 'screenshot', description: 'Empty state' },
          { type: 'output', description: 'Accessibility audit (axe-core)' }
        ]
      },
      'ui-page': {
        required: [
          { type: 'screenshot', description: 'Page rendering with data' },
          { type: 'screenshot', description: 'Page empty state' },
          { type: 'screenshot', description: 'Mobile responsive (375px width)' },
          { type: 'test', description: 'Page tests passing' },
          { type: 'output', description: 'Route accessible and protected correctly' }
        ],
        optional: [
          { type: 'screenshot', description: 'Tablet view (768px)' },
          { type: 'output', description: 'SEO metadata present' }
        ]
      }
    };
  }

  /**
   * Get evidence requirements for a blueprint type
   */
  getEvidenceRequirements(blueprintType) {
    return this.evidenceRequirements[blueprintType] || this.evidenceRequirements.api;
  }

  /**
   * Check if a feature is user-facing (requires UI)
   */
  isUserFacingFeature(spec) {
    const specContent = spec.content || spec;
    const specLower = specContent.toLowerCase();

    // Features that typically need UI
    const uiIndicators = [
      'user can', 'users can', 'user will', 'users will',
      'display', 'show', 'view', 'page', 'form', 'button',
      'dashboard', 'modal', 'dialog', 'interface', 'screen',
      'click', 'submit', 'select', 'input', 'upload'
    ];

    // Features that are backend-only
    const backendOnlyIndicators = [
      'cron job', 'background task', 'migration only',
      'database cleanup', 'data migration', 'api only',
      'webhook handler', 'internal service'
    ];

    const hasUIIndicators = uiIndicators.some(indicator => specLower.includes(indicator));
    const isBackendOnly = backendOnlyIndicators.some(indicator => specLower.includes(indicator));

    return hasUIIndicators && !isBackendOnly;
  }

  /**
   * Decompose a feature spec into prescriptive blueprints
   */
  async decomposeSpec(spec, projectPath) {
    console.log('\n📋 [Blueprint Decomposer] Analyzing feature spec...');
    console.log(`   Feature: ${spec.name}\n`);

    // Load current migration number
    await this.loadMigrationCounter(projectPath);

    // Parse spec and extract requirements
    const requirements = await this.parseSpec(spec);

    console.log('   Requirements identified:');
    console.log(`     - Database changes: ${requirements.database.length}`);
    console.log(`     - API routes: ${requirements.api.length}`);
    console.log(`     - UI components: ${requirements.ui.length}`);
    console.log(`     - Service functions: ${requirements.services.length}\n`);

    // Generate blueprints
    const blueprints = [];

    // 1. Database migrations (always first, always sequential)
    for (const dbChange of requirements.database) {
      let bp;
      if (dbChange.operation === 'create_function') {
        bp = await this.createFunctionBlueprint(dbChange, blueprints);
      } else {
        bp = await this.createDatabaseBlueprint(dbChange, blueprints);
      }
      blueprints.push(bp);
    }

    // 2. RLS policies (after migrations) - Use ACTUAL policies from spec, not generic templates
    if (requirements.rlsPolicies && requirements.rlsPolicies.length > 0) {
      // Group policies by table
      const policiesByTable = {};
      for (const policy of requirements.rlsPolicies) {
        if (!policiesByTable[policy.table]) {
          policiesByTable[policy.table] = [];
        }
        policiesByTable[policy.table].push(policy);
      }

      // Create blueprints for each table's policies
      for (const [tableName, policies] of Object.entries(policiesByTable)) {
        const bp = await this.createRLSBlueprintFromActualPolicies(tableName, policies, blueprints);
        blueprints.push(bp);
      }
    } else {
      // Fallback: Only create generic RLS for tables that don't have specific policies
      const tablesWithPolicies = new Set(requirements.rlsPolicies?.map(p => p.table) || []);
      for (const dbChange of requirements.database) {
        if (dbChange.operation === 'create_table' && !tablesWithPolicies.has(dbChange.tableName)) {
          const bp = await this.createRLSBlueprint(dbChange.tableName, blueprints);
          blueprints.push(bp);
        }
      }
    }

    // 3. RPC Functions (after database) - These are SECURITY DEFINER functions
    for (const rpcFunc of requirements.rpcFunctions || []) {
      const bp = await this.createRPCFunctionBlueprint(rpcFunc, blueprints);
      blueprints.push(bp);
    }

    // 4. Service functions (after database)
    for (const service of requirements.services) {
      const bp = this.createServiceBlueprint(service, blueprints);
      blueprints.push(bp);
    }

    // 5. API routes (after services)
    for (const route of requirements.api) {
      const bp = this.createAPIBlueprint(route, blueprints);
      blueprints.push(bp);
    }

    // 6. UI components (after API)
    for (const component of requirements.ui) {
      const bp = this.createUIBlueprint(component, blueprints);
      blueprints.push(bp);
    }

    // 7. UI Pages (after components) - Create page blueprints for routes
    for (const page of requirements.pages || []) {
      const bp = this.createUIPageBlueprint(page, blueprints);
      blueprints.push(bp);
    }

    console.log(`   Generated ${blueprints.length} prescriptive blueprints\n`);

    // ========================================
    // VALIDATION: Ensure UI blueprints exist for user-facing features
    // ========================================
    const specContent = spec.content || (spec.path ? await fs.readFile(spec.path, 'utf8') : '');
    const isUserFacing = this.isUserFacingFeature({ content: specContent });
    const hasUIBlueprints = blueprints.some(bp =>
      bp.type === 'ui-component' || bp.type === 'ui-page'
    );

    if (isUserFacing && !hasUIBlueprints) {
      console.log('\n   ⚠️  WARNING: User-facing feature detected but NO UI blueprints generated!');
      console.log('   This likely means the spec is missing a ## UI Components section.');
      console.log('   Consider adding UI components to the spec before proceeding.\n');

      // Add a placeholder UI blueprint to flag this gap
      blueprints.push({
        id: this.getNextBlueprintId(),
        name: '⚠️ UI REQUIRED - Add UI components to spec',
        description: 'This feature appears to be user-facing but has no UI defined',
        estimatedMinutes: 0,
        dependsOn: [],
        type: 'ui-missing',
        isPlaceholder: true,
        resources: { tables: [], migrations: [], routes: [], components: [], functions: [] },
        specifications: {
          operation: 'ui_required',
          message: 'Add ## UI Components section to spec with component definitions'
        },
        evidenceRequired: this.getEvidenceRequirements('ui-component')
      });
    }

    // Add evidence requirements to all blueprints
    for (const bp of blueprints) {
      if (!bp.evidenceRequired) {
        bp.evidenceRequired = this.getEvidenceRequirements(bp.type);
      }
    }

    return blueprints;
  }

  /**
   * Parse spec file and extract requirements
   *
   * This method reads the Codex-approved spec and extracts EXACT specifications.
   * It MUST be 100% faithful to the spec - no creativity, no interpretation.
   */
  async parseSpec(spec) {
    console.log(`   → Reading spec file: ${spec.path || 'inline spec'}`);

    let specContent;

    // Read spec file if path provided
    if (spec.path && await this.fileExists(spec.path)) {
      specContent = await fs.readFile(spec.path, 'utf8');
    } else if (spec.content) {
      specContent = spec.content;
    } else {
      throw new Error('Spec must have either path or content');
    }

    // Use the new SpecParser for semantic extraction
    const parser = new SpecParser();
    const parsed = parser.parse(specContent);

    // Transform parsed data into requirements format
    const requirements = {
      database: [],
      services: parsed.services || [],
      api: parsed.api || [],
      ui: parsed.ui || [],
      rpcFunctions: parsed.rpcFunctions || [],
      rlsPolicies: parsed.rlsPolicies || [],
      security: parsed.security || {},
      performance: parsed.performance || {}
    };

    // Process database schema
    if (parsed.database) {
      // Add tables
      for (const table of parsed.database.tables) {
        requirements.database.push({
          operation: 'create_table',
          tableName: table.name,
          columns: table.columns,
          constraints: table.constraints,
          sql: table.sql
        });
      }

      // Add alterations as separate operations
      for (const alteration of parsed.database.alterations) {
        requirements.database.push({
          operation: 'alter_table',
          tableName: alteration.table,
          alteration: alteration.alteration,
          sql: alteration.sql
        });
      }

      // Add functions (especially SECURITY DEFINER ones)
      for (const func of parsed.database.functions) {
        if (func.securityDefiner || func.name.includes('get_') || func.name.includes('grant_')) {
          requirements.database.push({
            operation: 'create_function',
            functionName: func.name,
            parameters: func.parameters,
            returnType: func.returnType,
            securityDefiner: func.securityDefiner,
            language: func.language,
            sql: func.sql
          });
        }
      }
    }

    console.log(`   → Extracted requirements from spec:`);
    console.log(`     - Database changes: ${requirements.database.length}`);
    console.log(`     - RPC functions: ${requirements.rpcFunctions.length}`);
    console.log(`     - RLS policies: ${requirements.rlsPolicies.length}`);
    console.log(`     - Service functions: ${requirements.services.length}`);
    console.log(`     - API routes: ${requirements.api.length}`);
    console.log(`     - UI components: ${requirements.ui.length}`);

    return requirements;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract section from markdown by heading
   */
  extractSection(content, headingKeywords) {
    const lines = content.split('\n');
    let sectionStart = -1;
    let sectionEnd = -1;
    let sectionLevel = 0;

    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();

      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        const heading = line.replace(/^#+\s*/, '').trim();

        if (headingKeywords.some(kw => heading.includes(kw))) {
          sectionStart = i + 1;
          sectionLevel = level;
          break;
        }
      }
    }

    if (sectionStart === -1) {
      return null; // Section not found
    }

    // Find section end (next heading of same or higher level)
    for (let i = sectionStart; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        if (level <= sectionLevel) {
          sectionEnd = i;
          break;
        }
      }
    }

    if (sectionEnd === -1) {
      sectionEnd = lines.length;
    }

    return lines.slice(sectionStart, sectionEnd).join('\n');
  }

  /**
   * Parse database schema from spec section
   */
  parseDatabase(section) {
    const tables = [];

    // Simple parser: look for table definitions
    // Format: ### table_name or **table_name**
    const lines = section.split('\n');
    let currentTable = null;

    for (const line of lines) {
      // Table name (heading or bold)
      if (line.match(/^###\s+`?(\w+)`?/) || line.match(/\*\*(\w+)\*\*/)) {
        if (currentTable) {
          tables.push(currentTable);
        }

        const tableName = line.match(/`(\w+)`/)?.[1] ||
                         line.match(/\*\*(\w+)\*\*/)?.[1] ||
                         line.match(/^###\s+(\w+)/)?.[1];

        currentTable = {
          operation: 'create_table',
          tableName,
          columns: []
        };
      }

      // Column definition (look for - column_name: type or | column_name | type |)
      if (currentTable) {
        const colMatch = line.match(/[-*]\s*`?(\w+)`?\s*[:|-]\s*`?(\w+)`?/) ||
                        line.match(/\|\s*`?(\w+)`?\s*\|\s*`?(\w+)`?\s*\|/);

        if (colMatch) {
          const [, name, type] = colMatch;
          currentTable.columns.push({
            name,
            type,
            primaryKey: name === 'id',
            foreignKey: type.includes('uuid') && name.endsWith('_id') ? 'profiles.id' : null
          });
        }
      }
    }

    if (currentTable) {
      tables.push(currentTable);
    }

    return tables;
  }

  /**
   * Parse services from spec section
   */
  parseServices(section) {
    const services = [];
    const lines = section.split('\n');

    for (const line of lines) {
      // Look for function names: sendEmail, sendSMS, etc.
      const funcMatch = line.match(/`?(\w+)\(\)`?/) || line.match(/function\s+(\w+)/);

      if (funcMatch) {
        const name = funcMatch[1];
        services.push({
          name,
          path: `src/lib/services/${name}.ts`,
          dependencies: [] // Will be inferred from context
        });
      }
    }

    return services;
  }

  /**
   * Parse API routes from spec section
   */
  parseAPI(section) {
    const routes = [];
    const lines = section.split('\n');

    for (const line of lines) {
      // Look for: GET /api/path, POST /api/path, etc.
      const routeMatch = line.match(/(GET|POST|PUT|DELETE|PATCH)\s+(\/\S+)/i);

      if (routeMatch) {
        const [, method, route] = routeMatch;
        routes.push({
          route,
          method: method.toUpperCase(),
          handler: route.split('/').pop() || 'handler',
          dependencies: []
        });
      }
    }

    return routes;
  }

  /**
   * Parse UI components from spec section
   */
  parseUI(section) {
    const components = [];
    const lines = section.split('\n');

    for (const line of lines) {
      // Look for component names (PascalCase)
      const compMatch = line.match(/`?([A-Z][a-zA-Z]+(?:Form|Component|Page|Modal|Card))`?/);

      if (compMatch) {
        const name = compMatch[1];
        components.push({
          name,
          path: `src/components/${name}.tsx`,
          apiEndpoints: [] // Will be inferred
        });
      }
    }

    return components;
  }

  /**
   * Extract database tables from SQL CREATE TABLE statements
   */
  extractDatabaseFromSQL(specContent) {
    const tables = [];
    const sqlBlockRegex = /```sql([\s\S]*?)```/g;
    let match;

    while ((match = sqlBlockRegex.exec(specContent)) !== null) {
      const sqlContent = match[1];

      // Look for CREATE TABLE statements
      const tableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(/gi;
      const tableMatches = [...sqlContent.matchAll(tableRegex)];

      for (const tableMatch of tableMatches) {
        const tableName = tableMatch[1];

        // Extract columns from the CREATE TABLE statement
        const columns = [];
        const columnRegex = /(\w+)\s+(UUID|TEXT|INTEGER|BOOLEAN|TIMESTAMPTZ|JSON|JSONB)/gi;
        const columnMatches = [...sqlContent.matchAll(columnRegex)];

        for (const colMatch of columnMatches) {
          const [, name, type] = colMatch;
          if (name.toLowerCase() !== 'create' && name.toLowerCase() !== 'table') {
            columns.push({
              name: name.toLowerCase(),
              type: type.toUpperCase(),
              primaryKey: name.toLowerCase() === 'id',
              foreignKey: type.toUpperCase() === 'UUID' && name.toLowerCase().endsWith('_id') ? 'profiles.id' : null
            });
          }
        }

        if (columns.length > 0) {
          tables.push({
            operation: 'create_table',
            tableName: tableName.toLowerCase(),
            columns
          });
        }
      }
    }

    return tables;
  }

  /**
   * Extract API routes from spec
   */
  extractAPIFromSpec(specContent) {
    const routes = [];

    // Look for API endpoint definitions
    const endpointRegex = /\*\*(GET|POST|PUT|DELETE|PATCH)\s+`?([\/\w-{}]+)`?\*\*/gi;
    const matches = [...specContent.matchAll(endpointRegex)];

    for (const match of matches) {
      const [, method, route] = match;
      routes.push({
        route,
        method: method.toUpperCase(),
        handler: route.split('/').pop()?.replace(/[{}[\]]/g, '') || 'handler',
        dependencies: []
      });
    }

    // Also look for route definitions in TypeScript
    const tsRouteRegex = /route:\s*['"`]([\/\w-{}]+)['"`]/gi;
    const tsMatches = [...specContent.matchAll(tsRouteRegex)];

    for (const match of tsMatches) {
      const route = match[1];
      // Check if not already added
      if (!routes.find(r => r.route === route)) {
        routes.push({
          route,
          method: 'GET', // Default to GET
          handler: route.split('/').pop()?.replace(/[{}[\]]/g, '') || 'handler',
          dependencies: []
        });
      }
    }

    return routes;
  }

  /**
   * Extract service functions from spec
   */
  extractServicesFromSpec(specContent) {
    const services = [];

    // Look for export function definitions in TypeScript
    const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    const matches = [...specContent.matchAll(funcRegex)];

    for (const match of matches) {
      const name = match[1];
      // Filter out common React/Next.js functions
      if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(name)) {
        services.push({
          name,
          path: `src/lib/services/${name}.ts`,
          dependencies: []
        });
      }
    }

    // Also look for service module paths
    const moduleRegex = /Module:\s*`([^`]+)`/g;
    const moduleMatches = [...specContent.matchAll(moduleRegex)];

    for (const match of moduleMatches) {
      const modulePath = match[1];
      // Extract function names from the module section
      const moduleSection = specContent.substring(
        specContent.indexOf(match[0]),
        specContent.indexOf('####', specContent.indexOf(match[0]) + 1)
      );

      const moduleFuncRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
      const moduleFuncMatches = [...moduleSection.matchAll(moduleFuncRegex)];

      for (const funcMatch of moduleFuncMatches) {
        const name = funcMatch[1];
        if (!services.find(s => s.name === name)) {
          services.push({
            name,
            path: modulePath,
            dependencies: []
          });
        }
      }
    }

    return services;
  }

  /**
   * Extract UI components from Files to Create section
   */
  extractUIFromFiles(specContent) {
    const components = [];

    // Look for component file paths
    const fileRegex = /src\/components\/[\w\/]+\.(tsx|jsx)/g;
    const matches = [...specContent.matchAll(fileRegex)];

    for (const match of matches) {
      const filePath = match[0];
      const fileName = filePath.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || '';

      // Extract component name (should be PascalCase)
      if (fileName && /^[A-Z]/.test(fileName)) {
        components.push({
          name: fileName,
          path: filePath,
          apiEndpoints: []
        });
      }
    }

    // Also look for React component definitions
    const componentRegex = /(?:export\s+)?(?:function|const)\s+([A-Z][a-zA-Z]+(?:Component|Form|Modal|Page|Card|Button|Wizard|Picker|Selector|Review))/g;
    const compMatches = [...specContent.matchAll(componentRegex)];

    for (const match of compMatches) {
      const name = match[1];
      if (!components.find(c => c.name === name)) {
        components.push({
          name,
          path: `src/components/${name}.tsx`,
          apiEndpoints: []
        });
      }
    }

    return components;
  }

  /**
   * Create database migration blueprint
   */
  async createDatabaseBlueprint(dbChange, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    const dependencies = [];

    // Migrations depend on previous migrations (sequential)
    const previousMigration = existingBlueprints
      .filter(bp => bp.resources.migrations.length > 0)
      .slice(-1)[0];

    if (previousMigration) {
      dependencies.push(previousMigration.id);
    }

    // Determine the operation name and file suffix
    let operationName, fileSuffix;
    if (dbChange.operation === 'alter_table') {
      operationName = `Alter ${dbChange.tableName} table`;
      fileSuffix = `alter_${dbChange.tableName}`;
    } else {
      operationName = `Create ${dbChange.tableName} table`;
      fileSuffix = `create_${dbChange.tableName}`;
    }

    return {
      id: blueprintId,
      name: operationName,
      description: `Migration: ${dbChange.operation} for ${dbChange.tableName}`,
      estimatedMinutes: 5,
      dependsOn: dependencies,
      type: 'database',
      resources: {
        tables: [dbChange.tableName],
        migrations: [`${migrationNumber}_${fileSuffix}.sql`],
        routes: [],
        components: [],
        functions: []
      },
      specifications: {
        operation: dbChange.operation,
        tableName: dbChange.tableName,
        columns: dbChange.columns,
        constraints: dbChange.constraints,
        sql: dbChange.sql,  // Use actual SQL from spec
        migrationNumber,
        fileName: `${migrationNumber}_${fileSuffix}.sql`,
        filePath: `supabase/migrations/${migrationNumber}_${fileSuffix}.sql`
      }
    };
  }

  /**
   * Create RLS policy blueprint
   */
  async createRLSBlueprint(tableName, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    // Depends on the migration that created this table
    const tableMigration = existingBlueprints.find(bp =>
      bp.resources.tables.includes(tableName) &&
      bp.specifications?.operation === 'create_table'
    );

    const dependencies = tableMigration ? [tableMigration.id] : [];

    return {
      id: blueprintId,
      name: `Add RLS policies for ${tableName}`,
      description: `RLS policies for ${tableName} table (user can only access their own data)`,
      estimatedMinutes: 5,
      dependsOn: dependencies,
      resources: {
        tables: [tableName],
        migrations: [`${migrationNumber}_${tableName}_rls.sql`],
        routes: [],
        components: [],
        functions: []
      },
      specifications: {
        operation: 'add_rls',
        tableName,
        policies: [
          {
            name: `${tableName}_select_own`,
            operation: 'SELECT',
            check: 'auth.uid() = user_id'
          },
          {
            name: `${tableName}_insert_own`,
            operation: 'INSERT',
            check: 'auth.uid() = user_id'
          },
          {
            name: `${tableName}_update_own`,
            operation: 'UPDATE',
            check: 'auth.uid() = user_id'
          }
        ],
        migrationNumber,
        fileName: `${migrationNumber}_${tableName}_rls.sql`,
        filePath: `supabase/migrations/${migrationNumber}_${tableName}_rls.sql`
      }
    };
  }

  /**
   * Create service function blueprint
   */
  createServiceBlueprint(service, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();

    // Depends on RLS policies for all dependency tables
    const dependencies = [];
    const serviceDeps = service.dependencies || [];
    for (const table of serviceDeps) {
      const rlsBp = existingBlueprints.find(bp =>
        bp.resources.tables.includes(table) &&
        bp.specifications?.operation === 'add_rls'
      );
      if (rlsBp) {
        dependencies.push(rlsBp.id);
      }
    }

    return {
      id: blueprintId,
      name: `Implement ${service.name} service`,
      description: `Service function to ${service.name}`,
      estimatedMinutes: 8,
      dependsOn: dependencies,
      resources: {
        tables: serviceDeps,
        migrations: [],
        routes: [],
        components: [],
        functions: [service.path || `src/lib/services/${service.name}.ts`]
      },
      specifications: {
        operation: 'create_service',
        functionName: service.name,
        filePath: service.path || `src/lib/services/${service.name}.ts`,
        tables: serviceDeps,
        exports: [service.name]
      }
    };
  }

  /**
   * Create API route blueprint
   */
  createAPIBlueprint(route, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();

    // Depends on service functions it uses
    const dependencies = [];
    const routeDeps = route.dependencies || [];
    for (const dep of routeDeps) {
      const serviceBp = existingBlueprints.find(bp =>
        bp.specifications?.functionName === dep
      );
      if (serviceBp) {
        dependencies.push(serviceBp.id);
      }
    }

    const routePath = `src/app${route.route}/route.ts`;

    return {
      id: blueprintId,
      name: `${route.method} ${route.route} endpoint`,
      description: `API endpoint: ${route.method} ${route.route}`,
      estimatedMinutes: 8,
      dependsOn: dependencies,
      resources: {
        tables: routeDeps.filter(d => typeof d === 'string' && !d.startsWith('send')),
        migrations: [],
        routes: [route.route],
        components: [],
        functions: [routePath]
      },
      specifications: {
        operation: 'create_api_route',
        route: route.route,
        method: route.method,
        handler: route.handler,
        filePath: routePath,
        authentication: 'required',
        csrfProtection: true
      }
    };
  }

  /**
   * Create UI component blueprint with full evidence requirements
   */
  createUIBlueprint(component, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();

    // Depends on API routes it uses
    const dependencies = [];
    const apiEndpoints = component.apiEndpoints || [];
    for (const endpoint of apiEndpoints) {
      const apiBp = existingBlueprints.find(bp =>
        bp.resources.routes.includes(endpoint)
      );
      if (apiBp) {
        dependencies.push(apiBp.id);
      }
    }

    // Determine if this is a page or component based on path
    const isPage = component.path?.includes('/app/') || component.name?.toLowerCase().includes('page');
    const blueprintType = isPage ? 'ui-page' : 'ui-component';

    return {
      id: blueprintId,
      name: `${component.name} ${isPage ? 'page' : 'component'}`,
      description: `UI ${isPage ? 'page' : 'component'}: ${component.name}`,
      estimatedMinutes: isPage ? 15 : 10,
      dependsOn: dependencies,
      type: blueprintType,
      resources: {
        tables: [],
        migrations: [],
        routes: isPage ? [component.route || component.path] : [],
        components: [component.path],
        functions: []
      },
      specifications: {
        operation: isPage ? 'create_page' : 'create_component',
        componentName: component.name,
        filePath: component.path,
        apiEndpoints: component.apiEndpoints,

        // UI States (REQUIRED for proper implementation)
        states: {
          default: { required: true, description: 'Normal display state with data' },
          loading: { required: true, description: 'Skeleton or spinner while fetching' },
          error: { required: true, description: 'Error message display' },
          empty: { required: !isPage, description: 'No data state (for lists/tables)' }
        },

        // Responsive requirements
        responsive: {
          required: true,
          breakpoints: {
            mobile: '375px',
            tablet: '768px',
            desktop: '1024px'
          },
          mobileFirst: true
        },

        // Accessibility requirements
        accessibility: {
          required: true,
          ariaLabels: true,
          keyboardNavigation: true,
          focusManagement: true,
          colorContrast: 'WCAG AA'
        },

        // Form handling (if applicable)
        formValidation: component.hasForm ? 'zod' : null,
        stateManagement: 'useState',

        // Screenshot requirements for evidence
        screenshots: {
          required: true,
          views: [
            { name: 'default', description: 'Component with sample data', required: true },
            { name: 'loading', description: 'Loading/skeleton state', required: true },
            { name: 'error', description: 'Error state display', required: true },
            { name: 'mobile', description: 'Mobile view (375px)', required: true },
            { name: 'empty', description: 'Empty/no data state', required: !isPage }
          ].filter(v => v.required)
        }
      },
      evidenceRequired: this.getEvidenceRequirements(blueprintType)
    };
  }

  /**
   * Create UI page blueprint
   */
  createUIPageBlueprint(page, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();

    // Pages depend on their child components
    const dependencies = [];
    const childComponents = page.components || [];
    for (const compName of childComponents) {
      const compBp = existingBlueprints.find(bp =>
        bp.specifications?.componentName === compName
      );
      if (compBp) {
        dependencies.push(compBp.id);
      }
    }

    return {
      id: blueprintId,
      name: `${page.name} page`,
      description: `UI page: ${page.name} at route ${page.route}`,
      estimatedMinutes: 15,
      dependsOn: dependencies,
      type: 'ui-page',
      resources: {
        tables: [],
        migrations: [],
        routes: [page.route],
        components: [page.path],
        functions: []
      },
      specifications: {
        operation: 'create_page',
        pageName: page.name,
        filePath: page.path,
        route: page.route,
        layout: page.layout || '(app)/layout.tsx',
        protected: page.protected !== false,

        // Data fetching strategy
        dataFetching: {
          type: page.dataFetchingType || 'server',
          revalidate: page.revalidate || false
        },

        // Page states
        states: {
          default: { required: true, description: 'Page with data loaded' },
          loading: { required: true, description: 'Page loading state' },
          error: { required: true, description: 'Error boundary/display' },
          empty: { required: true, description: 'No data state' }
        },

        // Responsive
        responsive: {
          required: true,
          breakpoints: { mobile: '375px', tablet: '768px', desktop: '1024px' }
        },

        // Screenshot requirements
        screenshots: {
          required: true,
          views: [
            { name: 'default', description: 'Page with data', required: true },
            { name: 'loading', description: 'Loading state', required: true },
            { name: 'empty', description: 'Empty state', required: true },
            { name: 'mobile', description: 'Mobile view', required: true }
          ]
        }
      },
      evidenceRequired: this.getEvidenceRequirements('ui-page')
    };
  }

  /**
   * Create function blueprint (for SECURITY DEFINER functions)
   */
  async createFunctionBlueprint(func, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    // Functions depend on tables they reference
    const dependencies = [];
    const previousMigration = existingBlueprints
      .filter(bp => bp.resources.migrations.length > 0)
      .slice(-1)[0];

    if (previousMigration) {
      dependencies.push(previousMigration.id);
    }

    return {
      id: blueprintId,
      name: `Create ${func.functionName} function`,
      description: `${func.securityDefiner ? 'SECURITY DEFINER ' : ''}function ${func.functionName}`,
      estimatedMinutes: 5,
      dependsOn: dependencies,
      type: 'database',
      resources: {
        tables: [],
        migrations: [`${migrationNumber}_create_function_${func.functionName}.sql`],
        routes: [],
        components: [],
        functions: []
      },
      specifications: {
        operation: 'create_function',
        functionName: func.functionName,
        parameters: func.parameters,
        returnType: func.returnType,
        securityDefiner: func.securityDefiner,
        language: func.language,
        sql: func.sql,
        migrationNumber,
        fileName: `${migrationNumber}_create_function_${func.functionName}.sql`,
        filePath: `supabase/migrations/${migrationNumber}_create_function_${func.functionName}.sql`
      }
    };
  }

  /**
   * Create RLS blueprint from actual policies in spec
   */
  async createRLSBlueprintFromActualPolicies(tableName, policies, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    // Depends on the migration that created this table
    const tableMigration = existingBlueprints.find(bp =>
      bp.resources.tables?.includes(tableName) &&
      (bp.specifications?.operation === 'create_table' || bp.specifications?.tableName === tableName)
    );

    const dependencies = tableMigration ? [tableMigration.id] : [];

    // Format policies for the blueprint
    const formattedPolicies = policies.map(policy => ({
      name: policy.name,
      operation: policy.operation,
      role: policy.role || 'authenticated',
      using: policy.using,
      withCheck: policy.withCheck,
      sql: policy.sql
    }));

    return {
      id: blueprintId,
      name: `Add RLS policies for ${tableName}`,
      description: `Row Level Security policies for ${tableName} table (from spec)`,
      estimatedMinutes: 5,
      dependsOn: dependencies,
      type: 'database',
      resources: {
        tables: [tableName],
        migrations: [`${migrationNumber}_${tableName}_rls.sql`],
        routes: [],
        components: [],
        functions: []
      },
      specifications: {
        operation: 'add_rls',
        tableName,
        policies: formattedPolicies,
        enableRLS: true,
        migrationNumber,
        fileName: `${migrationNumber}_${tableName}_rls.sql`,
        filePath: `supabase/migrations/${migrationNumber}_${tableName}_rls.sql`
      }
    };
  }

  /**
   * Create RPC function blueprint (for SECURITY DEFINER RPC functions)
   */
  async createRPCFunctionBlueprint(rpcFunc, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    // RPC functions depend on tables and previous migrations
    const dependencies = [];
    const previousMigration = existingBlueprints
      .filter(bp => bp.resources.migrations.length > 0)
      .slice(-1)[0];

    if (previousMigration) {
      dependencies.push(previousMigration.id);
    }

    return {
      id: blueprintId,
      name: `Create RPC function ${rpcFunc.name}`,
      description: `${rpcFunc.securityDefiner ? 'SECURITY DEFINER ' : ''}RPC function: ${rpcFunc.name}`,
      estimatedMinutes: 8,
      dependsOn: dependencies,
      type: 'database',
      resources: {
        tables: [],
        migrations: [`${migrationNumber}_rpc_${rpcFunc.name}.sql`],
        routes: [],
        components: [],
        functions: []
      },
      specifications: {
        operation: 'create_rpc_function',
        functionName: rpcFunc.name,
        parameters: rpcFunc.parameters,
        returnType: rpcFunc.returnType,
        securityDefiner: rpcFunc.securityDefiner,
        validatesAdmin: rpcFunc.validatesAdmin,
        validationLogic: rpcFunc.validationLogic,
        sql: rpcFunc.fullDefinition,
        migrationNumber,
        fileName: `${migrationNumber}_rpc_${rpcFunc.name}.sql`,
        filePath: `supabase/migrations/${migrationNumber}_rpc_${rpcFunc.name}.sql`
      }
    };
  }

  /**
   * Load migration helper for project
   */
  async loadMigrationCounter(projectPath) {
    this.migrationHelper = new MigrationHelper(projectPath);

    // Validate migrations directory
    const validation = await this.migrationHelper.validateMigrations();

    if (!validation.valid) {
      console.log(`   ⚠️  Migration issues detected:`);
      validation.issues.forEach(issue => console.log(`      - ${issue}`));
    }

    const latest = await this.migrationHelper.getLatestMigration();
    if (latest) {
      console.log(`   Latest migration: ${latest.filename}\n`);
    } else {
      console.log(`   No existing migrations found\n`);
    }
  }

  /**
   * Get next migration number (uses MigrationHelper for uniqueness)
   */
  async getNextMigrationNumber() {
    if (!this.migrationHelper) {
      throw new Error('Migration helper not initialized');
    }
    return await this.migrationHelper.getNextMigrationNumber();
  }

  /**
   * Get next blueprint ID
   */
  getNextBlueprintId() {
    const id = `bp-${this.blueprintIdCounter.toString().padStart(2, '0')}`;
    this.blueprintIdCounter++;
    return id;
  }
}

// CLI entry point
if (require.main === module) {
  const spec = {
    name: 'Notification System',
    path: './spec.md'
  };

  const projectPath = process.cwd();

  const decomposer = new BlueprintDecomposer();
  decomposer.decomposeSpec(spec, projectPath)
    .then(blueprints => {
      console.log(JSON.stringify(blueprints, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Decomposition failed:', err);
      process.exit(1);
    });
}

module.exports = { BlueprintDecomposer };
