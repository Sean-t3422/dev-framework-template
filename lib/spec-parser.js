/**
 * @fileoverview Spec Parser - Semantic extraction from markdown specs
 *
 * Provides structured parsing of specification documents to extract
 * actual requirements instead of applying generic templates.
 */

class SpecParser {
  constructor() {
    this.spec = null;
    this.sections = new Map();
  }

  /**
   * Parse a spec document and extract structured data
   * @param {string} content - The spec markdown content
   * @returns {Object} Parsed spec data
   */
  parse(content) {
    this.spec = content;
    this.buildSectionMap();

    return {
      database: this.extractDatabaseSchema(),
      rpcFunctions: this.extractRPCFunctions(),
      rlsPolicies: this.extractRLSPolicies(),
      services: this.extractServices(),
      api: this.extractAPIEndpoints(),
      ui: this.extractUIComponents(),
      security: this.extractSecurityRequirements(),
      performance: this.extractPerformanceOptimizations()
    };
  }

  buildSectionMap() {
    const lines = this.spec.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#')) {
        if (currentSection) {
          this.sections.set(currentSection, currentContent.join('\n'));
        }

        const heading = line.replace(/^#+\s*/, '').trim();
        currentSection = heading;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      this.sections.set(currentSection, currentContent.join('\n'));
    }
  }

  extractDatabaseSchema() {
    const schema = {
      tables: [],
      indexes: [],
      functions: [],
      alterations: []
    };

    const sqlBlockRegex = /```sql([\s\S]*?)```/g;
    let match;

    while ((match = sqlBlockRegex.exec(this.spec)) !== null) {
      const sqlContent = match[1];

      const tableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
      const tableMatches = [...sqlContent.matchAll(tableRegex)];

      for (const tableMatch of tableMatches) {
        const tableName = tableMatch[1];
        const tableBody = tableMatch[2];

        schema.tables.push({
          name: tableName.toLowerCase(),
          columns: this.parseTableColumns(tableBody),
          constraints: this.parseTableConstraints(tableBody),
          sql: tableMatch[0]
        });
      }

      const alterRegex = /ALTER\s+TABLE\s+(\w+)\s+(.*?);/gi;
      const alterMatches = [...sqlContent.matchAll(alterRegex)];

      for (const alterMatch of alterMatches) {
        schema.alterations.push({
          table: alterMatch[1].toLowerCase(),
          alteration: alterMatch[2],
          sql: alterMatch[0]
        });
      }

      const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\((.*?)\)/gi;
      const indexMatches = [...sqlContent.matchAll(indexRegex)];

      for (const indexMatch of indexMatches) {
        schema.indexes.push({
          name: indexMatch[1].toLowerCase(),
          table: indexMatch[2].toLowerCase(),
          columns: indexMatch[3].split(',').map(c => c.trim()),
          unique: indexMatch[0].toLowerCase().includes('unique'),
          sql: indexMatch[0]
        });
      }

      const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\s*\((.*?)\)([\s\S]*?)(?:LANGUAGE|AS\s+\$\$)/gi;
      const functionMatches = [...sqlContent.matchAll(functionRegex)];

      for (const funcMatch of functionMatches) {
        const startIdx = sqlContent.indexOf(funcMatch[0]);
        let endIdx = sqlContent.indexOf('$$;', startIdx);
        if (endIdx === -1) endIdx = sqlContent.indexOf('$func$;', startIdx);
        if (endIdx === -1) endIdx = sqlContent.length;

        const fullFunction = sqlContent.substring(startIdx, endIdx + 3);

        schema.functions.push({
          name: funcMatch[1].toLowerCase(),
          parameters: this.parseFunctionParameters(funcMatch[2]),
          returnType: this.extractReturnType(fullFunction),
          securityDefiner: fullFunction.includes('SECURITY DEFINER'),
          language: this.extractLanguage(fullFunction),
          sql: fullFunction
        });
      }
    }

    return schema;
  }

  parseTableColumns(tableBody) {
    const columns = [];
    const lines = tableBody.split(',').map(l => l.trim());

    for (const line of lines) {
      if (line.toLowerCase().includes('constraint') ||
          line.toLowerCase().includes('primary key') ||
          line.toLowerCase().includes('foreign key') ||
          line.toLowerCase().includes('check') ||
          line.toLowerCase().includes('unique')) {
        continue;
      }

      const colMatch = line.match(/^(\w+)\s+([A-Z]+(?:\s+[A-Z]+)*(?:\([^)]+\))?)(.*)/i);
      if (colMatch) {
        const [, name, type, modifiers] = colMatch;
        columns.push({
          name: name.toLowerCase(),
          type: type.trim().toUpperCase(),
          nullable: !modifiers.toLowerCase().includes('not null'),
          defaultValue: this.extractDefault(modifiers),
          primaryKey: modifiers.toLowerCase().includes('primary key'),
          references: this.extractReferences(modifiers)
        });
      }
    }

    return columns;
  }

  parseTableConstraints(tableBody) {
    const constraints = [];
    const lines = tableBody.split(',').map(l => l.trim());

    for (const line of lines) {
      if (line.toLowerCase().includes('constraint')) {
        const nameMatch = line.match(/constraint\s+(\w+)/i);
        const name = nameMatch ? nameMatch[1] : 'unnamed';

        constraints.push({
          name: name.toLowerCase(),
          type: this.getConstraintType(line),
          definition: line
        });
      }
    }

    return constraints;
  }

  extractRPCFunctions() {
    const functions = [];

    const rpcPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\s*\((.*?)\)([\s\S]*?)(\$\$|\$func\$);/gi;
    const matches = [...this.spec.matchAll(rpcPattern)];

    for (const match of matches) {
      const funcName = match[1];
      const params = match[2];
      const body = match[3];

      const isSecurityDefiner = body.includes('SECURITY DEFINER');
      const validatesAdmin = body.includes('is_platform_admin') ||
                            body.includes('platform_admin_grants');
      const returnType = this.extractReturnType(body);

      let validationLogic = null;
      const validationMatch = body.match(/IF\s+NOT\s+EXISTS\s*\(([\s\S]*?)\)\s*THEN/i);
      if (validationMatch) {
        validationLogic = validationMatch[1].trim();
      }

      functions.push({
        name: funcName.toLowerCase(),
        type: 'rpc',
        parameters: this.parseFunctionParameters(params),
        returnType,
        securityDefiner: isSecurityDefiner,
        validatesAdmin,
        validationLogic,
        fullDefinition: match[0]
      });
    }

    return functions;
  }

  extractRLSPolicies() {
    const policies = [];

    const policyPattern = /CREATE\s+POLICY\s+"?(\w+)"?\s+ON\s+(\w+)\s+FOR\s+(\w+)\s+(?:TO\s+(\w+)\s+)?(?:USING\s*\(([\s\S]*?)\))?(?:\s+WITH\s+CHECK\s*\(([\s\S]*?)\))?;/gi;
    const matches = [...this.spec.matchAll(policyPattern)];

    for (const match of matches) {
      const [full, name, table, operation, role, usingClause, checkClause] = match;

      policies.push({
        name: name.toLowerCase(),
        table: table.toLowerCase(),
        operation: operation.toUpperCase(),
        role: role || 'authenticated',
        using: usingClause ? usingClause.trim() : null,
        withCheck: checkClause ? checkClause.trim() : null,
        sql: full
      });
    }

    const rlsEnablePattern = /ALTER\s+TABLE\s+(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
    const rlsMatches = [...this.spec.matchAll(rlsEnablePattern)];

    for (const match of rlsMatches) {
      const tableName = match[1].toLowerCase();
      const existingPolicy = policies.find(p => p.table === tableName);
      if (!existingPolicy) {
        policies.push({
          table: tableName,
          rlsEnabled: true,
          policies: []
        });
      }
    }

    return policies;
  }

  extractServices() {
    const services = [];

    const tsBlockRegex = /```(?:typescript|javascript|ts|js)([\s\S]*?)```/g;
    let match;

    while ((match = tsBlockRegex.exec(this.spec)) !== null) {
      const code = match[1];

      const funcPattern = /export\s+(?:async\s+)?function\s+(\w+)\s*\((.*?)\)(?:\s*:\s*([^{]+))?\s*{/g;
      const funcMatches = [...code.matchAll(funcPattern)];

      for (const funcMatch of funcMatches) {
        const [, name, params, returnType] = funcMatch;

        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(name)) {
          continue;
        }

        services.push({
          name,
          parameters: this.parseTypeScriptParameters(params),
          returnType: returnType ? returnType.trim() : 'unknown',
          async: funcMatch[0].includes('async'),
          implementation: this.extractFunctionBody(code, funcMatch.index)
        });
      }
    }

    return services;
  }

  extractAPIEndpoints() {
    const endpoints = [];

    const patterns = [
      /\*\*(GET|POST|PUT|DELETE|PATCH)\s+`?([/\w-{}]+)`?\*\*/gi,
      /Endpoint:\s*(GET|POST|PUT|DELETE|PATCH)\s+`?([/\w-{}]+)`?/gi,
      /route:\s*['"`]([/\w-{}]+)['"`]/gi
    ];

    for (const pattern of patterns) {
      const matches = [...this.spec.matchAll(pattern)];

      for (const match of matches) {
        const method = match[1] || 'GET';
        const route = match[2] || match[1];

        if (!endpoints.find(e => e.route === route && e.method === method)) {
          endpoints.push({
            method: typeof method === 'string' ? method.toUpperCase() : 'GET',
            route,
            requestType: this.findInterfaceForEndpoint(route, 'Request'),
            responseType: this.findInterfaceForEndpoint(route, 'Response')
          });
        }
      }
    }

    return endpoints;
  }

  extractUIComponents() {
    const components = [];

    const filesSection = this.sections.get('Files to Create') ||
                        this.sections.get('UI Components') ||
                        this.sections.get('Components');

    if (filesSection) {
      const filePattern = /(?:File:|Path:)?\s*`?([/\w-]+\.(?:tsx|jsx|ts|js))`?/g;
      const matches = [...filesSection.matchAll(filePattern)];

      for (const match of matches) {
        const filePath = match[1];
        const fileName = filePath.split('/').pop().replace(/\.(tsx|jsx|ts|js)$/, '');

        if (/^[A-Z]/.test(fileName)) {
          components.push({
            name: fileName,
            path: filePath,
            type: this.inferComponentType(fileName)
          });
        }
      }
    }

    const componentPattern = /(?:export\s+)?(?:function|const)\s+([A-Z][a-zA-Z]+(?:Component|Form|Modal|Page|Card|Button|List|Table|View))/g;
    const compMatches = [...this.spec.matchAll(componentPattern)];

    for (const match of compMatches) {
      const name = match[1];
      if (!components.find(c => c.name === name)) {
        components.push({
          name,
          path: `src/components/${name}.tsx`,
          type: this.inferComponentType(name)
        });
      }
    }

    return components;
  }

  extractSecurityRequirements() {
    const requirements = {
      authentication: [],
      authorization: [],
      dataProtection: [],
      auditTrail: [],
      gdpr: []
    };

    const securitySections = ['Security', 'Critical Issue', 'Security Fix', 'Authorization'];

    for (const sectionName of securitySections) {
      const content = this.findSectionContent(sectionName);
      if (!content) continue;

      if (content.includes('SECURITY DEFINER')) {
        requirements.authorization.push({
          type: 'security_definer_functions',
          description: 'Use SECURITY DEFINER functions for elevated permissions'
        });
      }

      if (content.includes('is_platform_admin')) {
        requirements.authorization.push({
          type: 'platform_admin_check',
          description: 'Validate platform admin status at database level'
        });
      }

      if (content.includes('audit') || content.includes('activity_log')) {
        requirements.auditTrail.push({
          type: 'activity_logging',
          description: 'Track user activities for audit purposes'
        });
      }

      if (content.includes('GDPR') || content.includes('data protection')) {
        requirements.gdpr.push({
          type: 'data_protection',
          description: 'Implement GDPR-compliant data handling'
        });
      }
    }

    return requirements;
  }

  extractPerformanceOptimizations() {
    const optimizations = {
      indexes: [],
      caching: [],
      materialized: [],
      queryOptimizations: []
    };

    const schema = this.extractDatabaseSchema();
    optimizations.indexes = schema.indexes;

    if (this.spec.includes('cache') || this.spec.includes('TTL')) {
      const cachePattern = /cache.*?(?:TTL|time|duration).*?(\d+)\s*(min|sec|hour)/gi;
      const matches = [...this.spec.matchAll(cachePattern)];

      for (const match of matches) {
        optimizations.caching.push({
          duration: parseInt(match[1]),
          unit: match[2],
          description: match[0]
        });
      }
    }

    const matViewPattern = /CREATE\s+MATERIALIZED\s+VIEW\s+(\w+)/gi;
    const matViewMatches = [...this.spec.matchAll(matViewPattern)];

    for (const match of matViewMatches) {
      optimizations.materialized.push({
        name: match[1].toLowerCase(),
        sql: match[0]
      });
    }

    return optimizations;
  }

  // Helper methods

  extractDefault(modifiers) {
    const defaultMatch = modifiers.match(/DEFAULT\s+(.+?)(?:\s|$)/i);
    return defaultMatch ? defaultMatch[1] : null;
  }

  extractReferences(modifiers) {
    const refMatch = modifiers.match(/REFERENCES\s+(\w+)(?:\((\w+)\))?/i);
    return refMatch ? {
      table: refMatch[1].toLowerCase(),
      column: refMatch[2] ? refMatch[2].toLowerCase() : 'id'
    } : null;
  }

  getConstraintType(line) {
    if (line.toLowerCase().includes('primary key')) return 'PRIMARY KEY';
    if (line.toLowerCase().includes('foreign key')) return 'FOREIGN KEY';
    if (line.toLowerCase().includes('unique')) return 'UNIQUE';
    if (line.toLowerCase().includes('check')) return 'CHECK';
    return 'UNKNOWN';
  }

  extractReturnType(functionBody) {
    const returnMatch = functionBody.match(/RETURNS\s+([A-Z]+(?:\s+[A-Z]+)*)/i);
    return returnMatch ? returnMatch[1].trim() : 'VOID';
  }

  extractLanguage(functionBody) {
    const langMatch = functionBody.match(/LANGUAGE\s+(\w+)/i);
    return langMatch ? langMatch[1].toLowerCase() : 'sql';
  }

  parseFunctionParameters(params) {
    if (!params.trim()) return [];

    const parameters = [];
    const parts = params.split(',').map(p => p.trim());

    for (const part of parts) {
      const paramMatch = part.match(/(\w+)\s+([A-Z]+(?:\s+[A-Z]+)*)/i);
      if (paramMatch) {
        parameters.push({
          name: paramMatch[1].toLowerCase(),
          type: paramMatch[2].toUpperCase()
        });
      }
    }

    return parameters;
  }

  parseTypeScriptParameters(params) {
    if (!params.trim()) return [];

    const parameters = [];
    const parts = params.split(',').map(p => p.trim());

    for (const part of parts) {
      const paramMatch = part.match(/(\w+)(?:\?)?:\s*(.+)/);
      if (paramMatch) {
        parameters.push({
          name: paramMatch[1],
          type: paramMatch[2].trim(),
          optional: part.includes('?')
        });
      }
    }

    return parameters;
  }

  extractFunctionBody(code, startIndex) {
    let braceCount = 0;
    let inBody = false;
    let bodyStart = -1;
    let bodyEnd = -1;

    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        if (!inBody) {
          inBody = true;
          bodyStart = i + 1;
        }
        braceCount++;
      } else if (code[i] === '}') {
        braceCount--;
        if (braceCount === 0 && inBody) {
          bodyEnd = i;
          break;
        }
      }
    }

    return bodyStart > -1 && bodyEnd > -1 ?
           code.substring(bodyStart, bodyEnd).trim() :
           null;
  }

  findInterfaceForEndpoint(route, suffix) {
    const parts = route.split('/').filter(p => p && !p.includes('{'));
    const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + suffix;

    const interfacePattern = new RegExp(`interface\\s+${name}\\s*{`, 'i');
    return this.spec.match(interfacePattern) ? name : null;
  }

  inferComponentType(name) {
    if (name.includes('Page')) return 'page';
    if (name.includes('Form')) return 'form';
    if (name.includes('Modal')) return 'modal';
    if (name.includes('Card')) return 'card';
    if (name.includes('List') || name.includes('Table')) return 'list';
    if (name.includes('Button')) return 'button';
    return 'component';
  }

  findSectionContent(sectionNamePattern) {
    for (const [name, content] of this.sections) {
      if (name.toLowerCase().includes(sectionNamePattern.toLowerCase())) {
        return content;
      }
    }
    return null;
  }
}

module.exports = { SpecParser };
