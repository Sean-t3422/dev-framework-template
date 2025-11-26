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

    // 2. RLS policies (after migrations)
    if (requirements.rlsPolicies && requirements.rlsPolicies.length > 0) {
      const policiesByTable = {};
      for (const policy of requirements.rlsPolicies) {
        if (!policiesByTable[policy.table]) {
          policiesByTable[policy.table] = [];
        }
        policiesByTable[policy.table].push(policy);
      }

      for (const [tableName, policies] of Object.entries(policiesByTable)) {
        const bp = await this.createRLSBlueprintFromActualPolicies(tableName, policies, blueprints);
        blueprints.push(bp);
      }
    } else {
      const tablesWithPolicies = new Set(requirements.rlsPolicies?.map(p => p.table) || []);
      for (const dbChange of requirements.database) {
        if (dbChange.operation === 'create_table' && !tablesWithPolicies.has(dbChange.tableName)) {
          const bp = await this.createRLSBlueprint(dbChange.tableName, blueprints);
          blueprints.push(bp);
        }
      }
    }

    // 3. RPC Functions (after database)
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

    console.log(`   Generated ${blueprints.length} prescriptive blueprints\n`);

    return blueprints;
  }

  /**
   * Parse spec file and extract requirements
   */
  async parseSpec(spec) {
    console.log(`   → Reading spec file: ${spec.path || 'inline spec'}`);

    let specContent;

    if (spec.path && await this.fileExists(spec.path)) {
      specContent = await fs.readFile(spec.path, 'utf8');
    } else if (spec.content) {
      specContent = spec.content;
    } else {
      throw new Error('Spec must have either path or content');
    }

    const parser = new SpecParser();
    const parsed = parser.parse(specContent);

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

    if (parsed.database) {
      for (const table of parsed.database.tables) {
        requirements.database.push({
          operation: 'create_table',
          tableName: table.name,
          columns: table.columns,
          constraints: table.constraints,
          sql: table.sql
        });
      }

      for (const alteration of parsed.database.alterations) {
        requirements.database.push({
          operation: 'alter_table',
          tableName: alteration.table,
          alteration: alteration.alteration,
          sql: alteration.sql
        });
      }

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

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createDatabaseBlueprint(dbChange, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    const dependencies = [];
    const previousMigration = existingBlueprints
      .filter(bp => bp.resources.migrations.length > 0)
      .slice(-1)[0];

    if (previousMigration) {
      dependencies.push(previousMigration.id);
    }

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
        sql: dbChange.sql,
        migrationNumber,
        fileName: `${migrationNumber}_${fileSuffix}.sql`,
        filePath: `supabase/migrations/${migrationNumber}_${fileSuffix}.sql`
      }
    };
  }

  async createRLSBlueprint(tableName, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    const tableMigration = existingBlueprints.find(bp =>
      bp.resources.tables.includes(tableName) &&
      bp.specifications?.operation === 'create_table'
    );

    const dependencies = tableMigration ? [tableMigration.id] : [];

    return {
      id: blueprintId,
      name: `Add RLS policies for ${tableName}`,
      description: `RLS policies for ${tableName} table`,
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
        policies: [
          { name: `${tableName}_select_own`, operation: 'SELECT', check: 'auth.uid() = user_id' },
          { name: `${tableName}_insert_own`, operation: 'INSERT', check: 'auth.uid() = user_id' },
          { name: `${tableName}_update_own`, operation: 'UPDATE', check: 'auth.uid() = user_id' }
        ],
        migrationNumber,
        fileName: `${migrationNumber}_${tableName}_rls.sql`,
        filePath: `supabase/migrations/${migrationNumber}_${tableName}_rls.sql`
      }
    };
  }

  createServiceBlueprint(service, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const dependencies = [];
    const serviceDeps = service.dependencies || [];

    for (const table of serviceDeps) {
      const rlsBp = existingBlueprints.find(bp =>
        bp.resources.tables.includes(table) &&
        bp.specifications?.operation === 'add_rls'
      );
      if (rlsBp) dependencies.push(rlsBp.id);
    }

    return {
      id: blueprintId,
      name: `Implement ${service.name} service`,
      description: `Service function to ${service.name}`,
      estimatedMinutes: 8,
      dependsOn: dependencies,
      type: 'service',
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

  createAPIBlueprint(route, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const dependencies = [];
    const routeDeps = route.dependencies || [];

    for (const dep of routeDeps) {
      const serviceBp = existingBlueprints.find(bp =>
        bp.specifications?.functionName === dep
      );
      if (serviceBp) dependencies.push(serviceBp.id);
    }

    const routePath = `src/app${route.route}/route.ts`;

    return {
      id: blueprintId,
      name: `${route.method} ${route.route} endpoint`,
      description: `API endpoint: ${route.method} ${route.route}`,
      estimatedMinutes: 8,
      dependsOn: dependencies,
      type: 'api',
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

  createUIBlueprint(component, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const dependencies = [];
    const apiEndpoints = component.apiEndpoints || [];

    for (const endpoint of apiEndpoints) {
      const apiBp = existingBlueprints.find(bp =>
        bp.resources.routes.includes(endpoint)
      );
      if (apiBp) dependencies.push(apiBp.id);
    }

    return {
      id: blueprintId,
      name: `${component.name} component`,
      description: `UI component: ${component.name}`,
      estimatedMinutes: 10,
      dependsOn: dependencies,
      type: 'ui',
      resources: {
        tables: [],
        migrations: [],
        routes: [],
        components: [component.path],
        functions: []
      },
      specifications: {
        operation: 'create_component',
        componentName: component.name,
        filePath: component.path,
        apiEndpoints: component.apiEndpoints,
        stateManagement: 'useState',
        formValidation: 'zod'
      }
    };
  }

  async createFunctionBlueprint(func, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    const dependencies = [];
    const previousMigration = existingBlueprints
      .filter(bp => bp.resources.migrations.length > 0)
      .slice(-1)[0];

    if (previousMigration) dependencies.push(previousMigration.id);

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

  async createRLSBlueprintFromActualPolicies(tableName, policies, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    const tableMigration = existingBlueprints.find(bp =>
      bp.resources.tables?.includes(tableName) &&
      (bp.specifications?.operation === 'create_table' || bp.specifications?.tableName === tableName)
    );

    const dependencies = tableMigration ? [tableMigration.id] : [];

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

  async createRPCFunctionBlueprint(rpcFunc, existingBlueprints) {
    const blueprintId = this.getNextBlueprintId();
    const migrationNumber = await this.getNextMigrationNumber();

    const dependencies = [];
    const previousMigration = existingBlueprints
      .filter(bp => bp.resources.migrations.length > 0)
      .slice(-1)[0];

    if (previousMigration) dependencies.push(previousMigration.id);

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

  async loadMigrationCounter(projectPath) {
    this.migrationHelper = new MigrationHelper(projectPath);
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

  async getNextMigrationNumber() {
    if (!this.migrationHelper) {
      throw new Error('Migration helper not initialized');
    }
    return await this.migrationHelper.getNextMigrationNumber();
  }

  getNextBlueprintId() {
    const id = `bp-${this.blueprintIdCounter.toString().padStart(2, '0')}`;
    this.blueprintIdCounter++;
    return id;
  }
}

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
