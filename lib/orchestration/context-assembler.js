/**
 * @fileoverview Context Assembler
 *
 * Assembles context packages for sub-agents with schema slicing to reduce token usage by 90-95%.
 * Only includes relevant tables, conventions, and dependencies for each blueprint.
 */

const fs = require('fs').promises;
const path = require('path');

class ContextAssembler {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.fullSchema = null;
    this.conventions = null;
  }

  /**
   * Load full schema and conventions (once per session)
   */
  async initialize() {
    console.log('[Context] Loading project schema and conventions...');

    // Load schema from Supabase or local cache
    this.fullSchema = await this.loadFullSchema();

    // Load conventions from .claude directory
    this.conventions = await this.loadConventions();

    console.log(`[Context] Loaded ${this.fullSchema.tables.length} tables, ${this.fullSchema.functions?.length || 0} functions`);
  }

  /**
   * Assemble context package for a specific blueprint
   */
  async assembleContextForBlueprint(blueprint, completedDependencies = []) {
    console.log(`[Context] Assembling context for ${blueprint.name}...`);

    // 1. Identify required tables
    const requiredTables = this.identifyRequiredTables(blueprint);
    console.log(`  → Required tables: ${requiredTables.length}/${this.fullSchema.tables.length}`);

    // 2. Build schema slice
    const schemaSlice = this.buildSchemaSlice(requiredTables);

    // 3. Slice conventions
    const conventionSlice = this.sliceConventions(blueprint);

    // 4. Gather dependency context
    const dependencyContext = this.gatherDependencyContext(
      blueprint,
      completedDependencies
    );

    // 5. Estimate token savings
    const metrics = this.estimateTokenSavings(schemaSlice);
    console.log(`  → Context size: ~${metrics.sliceTokens} tokens (${metrics.reductionPercentage}% reduction)`);

    return {
      core: {
        projectName: await this.getProjectName(),
        framework: 'Next.js 14 + Supabase',
        conventions: conventionSlice
      },
      schema: schemaSlice,
      featureContext: {
        overview: blueprint.description,
        goals: [blueprint.name],
        userStories: []
      },
      blueprint: {
        id: blueprint.id,
        name: blueprint.name,
        description: blueprint.description,
        dependencies: dependencyContext,
        specifications: blueprint.specifications || {},
        resources: blueprint.resources
      },
      metrics
    };
  }

  /**
   * Identify tables needed for a blueprint
   */
  identifyRequiredTables(blueprint) {
    const required = new Set();

    // 1. Direct table access from blueprint resources
    if (blueprint.resources.tables) {
      blueprint.resources.tables.forEach(t => required.add(t));
    }

    // 2. Tables from migrations (parse migration file names or content)
    if (blueprint.resources.migrations) {
      blueprint.resources.migrations.forEach(m => {
        // Extract table names from migration file names
        // e.g., "145_add_notification_urgency.sql" -> "notification"
        const tableName = this.extractTableFromMigration(m);
        if (tableName) required.add(tableName);
      });
    }

    // 3. Tables from foreign key relationships (1 level deep)
    const directTables = Array.from(required);
    for (const table of directTables) {
      const related = this.findRelatedTables(table, 1);
      related.forEach(t => required.add(t));
    }

    return Array.from(required);
  }

  /**
   * Extract table name from migration file name
   */
  extractTableFromMigration(migrationName) {
    // Try to extract table name from migration file name
    // Examples:
    // "145_add_notification_urgency.sql" -> "notifications"
    // "146_create_notification_log.sql" -> "notification_log"

    const parts = migrationName.split('_');
    if (parts.length < 2) return null;

    // Look for "create", "alter", "add" keywords
    for (let i = 0; i < parts.length; i++) {
      if (['create', 'alter', 'add', 'modify'].includes(parts[i])) {
        // Next word(s) might be the table name
        if (i + 1 < parts.length) {
          return parts[i + 1].replace('.sql', '');
        }
      }
    }

    return null;
  }

  /**
   * Find related tables via foreign keys (up to N levels)
   */
  findRelatedTables(tableName, depth) {
    if (depth === 0 || !this.fullSchema) return [];

    const table = this.fullSchema.tables.find(t => t.name === tableName);
    if (!table) return [];

    const related = new Set();

    // Check foreign keys in this table
    if (table.columns) {
      for (const column of table.columns) {
        if (column.foreignKey) {
          related.add(column.foreignKey.table);

          // Recurse for deeper relationships
          if (depth > 1) {
            const deeper = this.findRelatedTables(column.foreignKey.table, depth - 1);
            deeper.forEach(t => related.add(t));
          }
        }
      }
    }

    // Check inverse relationships (tables that reference this one)
    for (const otherTable of this.fullSchema.tables) {
      if (otherTable.columns) {
        for (const col of otherTable.columns) {
          if (col.foreignKey?.table === tableName) {
            related.add(otherTable.name);
          }
        }
      }
    }

    return Array.from(related);
  }

  /**
   * Build schema slice with only required tables
   */
  buildSchemaSlice(requiredTables) {
    const slice = {
      tables: [],
      rlsPolicies: [],
      types: [],
      functions: [],
      indexes: []
    };

    if (!this.fullSchema) return slice;

    // Extract table definitions
    for (const tableName of requiredTables) {
      const table = this.fullSchema.tables.find(t => t.name === tableName);
      if (table) {
        slice.tables.push(table);
      }
    }

    // Extract RLS policies for these tables
    if (this.fullSchema.rlsPolicies) {
      slice.rlsPolicies = this.fullSchema.rlsPolicies.filter(p =>
        requiredTables.includes(p.table)
      );
    }

    // Extract relevant types (referenced by columns)
    const referencedTypes = new Set();
    for (const table of slice.tables) {
      if (table.columns) {
        for (const col of table.columns) {
          if (col.type && col.type.startsWith('enum_')) {
            referencedTypes.add(col.type);
          }
        }
      }
    }

    if (this.fullSchema.types) {
      slice.types = this.fullSchema.types.filter(t =>
        referencedTypes.has(t.name)
      );
    }

    // Extract functions that operate on these tables
    if (this.fullSchema.functions) {
      slice.functions = this.fullSchema.functions.filter(fn => {
        return requiredTables.some(table =>
          fn.definition && fn.definition.includes(table)
        );
      });
    }

    // Extract indexes for these tables
    if (this.fullSchema.indexes) {
      slice.indexes = this.fullSchema.indexes.filter(idx =>
        requiredTables.includes(idx.table)
      );
    }

    return slice;
  }

  /**
   * Slice conventions based on blueprint type
   */
  sliceConventions(blueprint) {
    const slice = {
      core: this.conventions?.core || {}
    };

    // Add database conventions if modifying schema
    if (blueprint.resources.migrations?.length > 0 ||
        blueprint.resources.tables?.length > 0) {
      slice.database = this.conventions?.database || {};
    }

    // Add API conventions if creating/modifying routes
    if (blueprint.resources.routes?.length > 0) {
      slice.api = this.conventions?.api || {};
    }

    // Add UI conventions if creating/modifying components
    if (blueprint.resources.components?.length > 0) {
      slice.ui = this.conventions?.ui || {};
    }

    // Always include testing conventions
    slice.testing = this.conventions?.testing || {};

    return slice;
  }

  /**
   * Gather context from completed dependency blueprints
   */
  gatherDependencyContext(blueprint, completedDependencies) {
    const summaries = [];

    if (!blueprint.dependsOn || blueprint.dependsOn.length === 0) {
      return summaries;
    }

    for (const depId of blueprint.dependsOn) {
      const dep = completedDependencies.find(d => d.id === depId);
      if (dep) {
        summaries.push({
          id: dep.id,
          name: dep.name,
          outputs: dep.outputs || {}
        });
      }
    }

    return summaries;
  }

  /**
   * Estimate token savings from context slicing
   */
  estimateTokenSavings(schemaSlice) {
    // Rough token estimation
    const fullTokens =
      (this.fullSchema?.tables?.length || 0) * 200 +
      (this.fullSchema?.rlsPolicies?.length || 0) * 150 +
      (this.fullSchema?.functions?.length || 0) * 300;

    const sliceTokens =
      schemaSlice.tables.length * 200 +
      schemaSlice.rlsPolicies.length * 150 +
      schemaSlice.functions.length * 300;

    return {
      fullTokens,
      sliceTokens,
      tokensSaved: fullTokens - sliceTokens,
      reductionPercentage: fullTokens > 0
        ? Math.round((1 - sliceTokens / fullTokens) * 100)
        : 0
    };
  }

  /**
   * Load full schema (from Supabase or cache)
   */
  async loadFullSchema() {
    // Try to load cached schema
    const cacheDir = path.join(this.projectPath, '.orchestration', 'cache');
    const schemaPath = path.join(cacheDir, 'schema.json');

    try {
      const schemaJson = await fs.readFile(schemaPath, 'utf8');
      return JSON.parse(schemaJson);
    } catch (err) {
      // Schema cache doesn't exist - would need to query Supabase
      console.warn('[Context] Schema cache not found, using minimal schema');

      return {
        tables: [],
        rlsPolicies: [],
        types: [],
        functions: [],
        indexes: []
      };
    }
  }

  /**
   * Load conventions from .claude directory
   */
  async loadConventions() {
    const conventionsPath = path.join(this.projectPath, '.claude', 'conventions.json');

    try {
      const conventionsJson = await fs.readFile(conventionsPath, 'utf8');
      return JSON.parse(conventionsJson);
    } catch (err) {
      // Conventions don't exist - use defaults
      return {
        core: {
          fileNaming: 'kebab-case',
          importStyle: 'esm'
        },
        database: {
          tableNaming: 'snake_case',
          columnNaming: 'snake_case'
        },
        api: {
          routePattern: '/api/[resource]/[action]'
        },
        ui: {
          componentNaming: 'PascalCase'
        },
        testing: {
          testLocation: 'tests/'
        }
      };
    }
  }

  /**
   * Get project name
   */
  async getProjectName() {
    const packagePath = path.join(this.projectPath, 'package.json');

    try {
      const packageJson = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(packageJson);
      return pkg.name || 'Unknown Project';
    } catch (err) {
      return 'Unknown Project';
    }
  }
}

module.exports = { ContextAssembler };
