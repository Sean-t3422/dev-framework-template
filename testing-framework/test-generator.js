/**
 * @fileoverview Test Generator for Dev Framework Testing System
 * Creates test scaffolds BEFORE implementation (TDD approach)
 * Integrated with Next.js, Supabase, and Tailwind patterns
 */

const fs = require('fs').promises;
const path = require('path');
const ComplexityAnalyzer = require('./complexity-analyzer');

/**
 * Test templates optimized for Next.js + Supabase stack
 */
const TEST_TEMPLATES = {
  integration: {
    component: `import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from '{{componentPath}}';

describe('{{componentName}} Integration Tests', () => {
  describe('Rendering', () => {
    it('should render without errors', () => {
      render(<{{componentName}} />);
      expect(screen.getByTestId('{{testId}}')).toBeInTheDocument();
    });

    it('should display correct initial state', () => {
      render(<{{componentName}} />);
      // TODO: Verify initial state
      expect(true).toBe(false); // FAILING - Implement this test
    });
  });

  describe('User Interactions', () => {
    it('should handle {{primaryAction}}', async () => {
      const user = userEvent.setup();
      render(<{{componentName}} />);

      // TODO: Test user interaction
      const button = screen.getByRole('button', { name: /{{actionLabel}}/i });
      await user.click(button);

      expect(true).toBe(false); // FAILING - Implement this test
    });
  });

  describe('Requirements', () => {
    {{#each requirements}}
    it('{{this}}', async () => {
      // TODO: Implement requirement test
      expect(true).toBe(false); // FAILING - Implement this test
    });
    {{/each}}
  });
});`,

    api: `import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import handler from '{{apiPath}}';

// Mock Supabase
jest.mock('@supabase/supabase-js');

describe('{{apiName}} API Tests', () => {
  let supabaseMock;

  beforeEach(() => {
    supabaseMock = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    createClient.mockReturnValue(supabaseMock);
  });

  describe('{{method}} {{endpoint}}', () => {
    it('should return 200 for valid request', async () => {
      const { req, res } = createMocks({
        method: '{{method}}',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          // TODO: Add valid request body
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(true).toBe(false); // FAILING - Validate response
    });

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: '{{method}}',
        body: {}, // Missing required fields
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(true).toBe(false); // FAILING - Implement validation test
    });

    it('should enforce RLS policies', async () => {
      // TODO: Test Row Level Security
      expect(true).toBe(false); // FAILING - Implement RLS test
    });
  });

  describe('Requirements', () => {
    {{#each requirements}}
    it('{{this}}', async () => {
      // TODO: Implement requirement test
      expect(true).toBe(false); // FAILING - Implement this test
    });
    {{/each}}
  });
});`,
  },

  unit: {
    function: `import { {{functionName}} } from '{{functionPath}}';

describe('{{functionName}}', () => {
  describe('Happy Path', () => {
    it('should process valid input correctly', () => {
      const input = {{sampleInput}};
      const expected = {{expectedOutput}};

      const result = {{functionName}}(input);

      expect(result).toEqual(expected);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = {{functionName}}({{emptyInput}});
      expect(true).toBe(false); // FAILING - Implement empty input handling
    });

    it('should handle invalid input', () => {
      expect(() => {{functionName}}({{invalidInput}})).toThrow();
    });

    it('should handle null/undefined', () => {
      expect(() => {{functionName}}(null)).toThrow();
      expect(() => {{functionName}}(undefined)).toThrow();
    });
  });

  describe('Business Logic', () => {
    {{#each businessRules}}
    it('{{this}}', () => {
      // TODO: Implement business rule test
      expect(true).toBe(false); // FAILING - Implement this test
    });
    {{/each}}
  });
});`,

    hook: `import { renderHook, act, waitFor } from '@testing-library/react';
import { {{hookName}} } from '{{hookPath}}';

describe('{{hookName}}', () => {
  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => {{hookName}}());

      // TODO: Verify initial state
      expect(true).toBe(false); // FAILING - Implement this test
    });
  });

  describe('State Management', () => {
    it('should update state correctly', async () => {
      const { result } = renderHook(() => {{hookName}}());

      act(() => {
        // TODO: Trigger state change
      });

      await waitFor(() => {
        expect(true).toBe(false); // FAILING - Verify state update
      });
    });
  });

  describe('Side Effects', () => {
    it('should handle async operations', async () => {
      // TODO: Test async behavior
      expect(true).toBe(false); // FAILING - Implement async test
    });
  });
});`,
  },

  e2e: {
    playwright: `import { test, expect } from '@playwright/test';

test.describe('{{featureName}} E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{pagePath}}');
  });

  test('should complete user workflow successfully', async ({ page }) => {
    // Step 1: {{step1}}
    await page.click('[data-testid="{{step1Element}}"]');

    // Step 2: {{step2}}
    await page.fill('[data-testid="{{step2Element}}"]', '{{sampleText}}');

    // Step 3: {{step3}}
    await page.click('[data-testid="submit-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // TODO: Complete workflow verification
    expect(true).toBe(false); // FAILING - Implement complete workflow test
  });

  test('should handle authentication flow', async ({ page }) => {
    // TODO: Test auth flow
    expect(true).toBe(false); // FAILING - Implement auth test
  });

  test('should enforce RLS policies', async ({ page }) => {
    // TODO: Test that users can only see their data
    expect(true).toBe(false); // FAILING - Implement RLS test
  });

  test.describe('Requirements', () => {
    {{#each requirements}}
    test('{{this}}', async ({ page }) => {
      // TODO: Implement requirement test
      expect(true).toBe(false); // FAILING - Implement this test
    });
    {{/each}}
  });
});`,
  },

  security: {
    rls: `import { createClient } from '@supabase/supabase-js';

describe('RLS Security Tests for {{tableName}}', () => {
  let supabase;
  let testUser1;
  let testUser2;

  beforeAll(async () => {
    // Setup test environment
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // TODO: Create test users
    expect(true).toBe(false); // FAILING - Setup test users
  });

  describe('Row Level Security', () => {
    it('should prevent users from accessing other users data', async () => {
      // TODO: Test RLS isolation
      expect(true).toBe(false); // FAILING - Implement RLS isolation test
    });

    it('should enforce co-op boundaries', async () => {
      // TODO: Test multi-tenant isolation
      expect(true).toBe(false); // FAILING - Implement multi-tenant test
    });

    it('should respect role-based permissions', async () => {
      // TODO: Test role permissions
      expect(true).toBe(false); // FAILING - Implement permission test
    });
  });

  describe('Authentication Requirements', () => {
    it('should reject unauthenticated requests', async () => {
      // TODO: Test auth requirement
      expect(true).toBe(false); // FAILING - Implement auth test
    });
  });
});`,

    auth: `import { createClient } from '@supabase/supabase-js';

describe('Authentication Security Tests', () => {
  let supabase;

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  });

  describe('Sign Up Security', () => {
    it('should enforce password strength requirements', async () => {
      // TODO: Test weak passwords are rejected
      expect(true).toBe(false); // FAILING - Implement password strength test
    });

    it('should prevent email enumeration', async () => {
      // TODO: Test same error for existing/non-existing emails
      expect(true).toBe(false); // FAILING - Implement enumeration test
    });
  });

  describe('Sign In Security', () => {
    it('should implement rate limiting', async () => {
      // TODO: Test rate limiting after multiple failed attempts
      expect(true).toBe(false); // FAILING - Implement rate limit test
    });
  });

  describe('Session Management', () => {
    it('should expire sessions appropriately', async () => {
      // TODO: Test session expiration
      expect(true).toBe(false); // FAILING - Implement session test
    });
  });
});`,
  },
};

/**
 * Main test generator
 */
class TestGenerator {
  constructor() {
    this.analyzer = new ComplexityAnalyzer();
    this.testsDir = path.resolve(process.cwd(), 'tests');
  }

  /**
   * Generate tests for a feature from brief/blueprint
   * @param {Object} feature - Feature object from brief/blueprint
   * @returns {Object} Generated test information
   */
  async generateTests(feature) {
    // Analyze complexity
    const analysis = await this.analyzer.analyze(feature);

    // Determine which tests to generate
    const testTypes = this.determineTestTypes(analysis.level);

    // Extract test context from feature
    const context = this.extractContext(feature);

    // Generate test files
    const generatedTests = [];
    for (const testType of testTypes) {
      const testFile = await this.generateTestFile(testType, context, feature, analysis);
      generatedTests.push(testFile);
    }

    // Create test plan
    const testPlan = this.createTestPlan(feature, analysis, generatedTests);

    return {
      analysis,
      generatedTests,
      testPlan,
      instructions: this.getInstructions(analysis.level),
    };
  }

  /**
   * Determine which test types to generate based on complexity
   */
  determineTestTypes(level) {
    const testTypeMap = {
      trivial: [],
      simple: ['integration'],
      moderate: ['integration', 'unit'],
      complex: ['integration', 'unit', 'e2e'],
      critical: ['integration', 'unit', 'e2e', 'security'],
    };

    return testTypeMap[level] || ['integration'];
  }

  /**
   * Extract test context from feature
   */
  extractContext(feature) {
    const context = {
      featureId: feature.id || 'feature-' + Date.now(),
      title: feature.title || 'Feature',
      description: feature.description || '',
      requirements: feature.requirements || feature.acceptanceCriteria || [],
      technicalDetails: feature.technicalDetails || {},
    };

    // Detect feature type from description
    const text = `${context.title} ${context.description}`.toLowerCase();

    if (text.includes('component') || text.includes('button') || text.includes('form')) {
      context.type = 'component';
      context.componentName = this.inferComponentName(context.title);
    } else if (text.includes('api') || text.includes('endpoint')) {
      context.type = 'api';
      context.endpoint = this.inferEndpoint(context.title);
    } else if (text.includes('hook') || text.includes('use')) {
      context.type = 'hook';
      context.hookName = this.inferHookName(context.title);
    } else {
      context.type = 'feature';
    }

    return context;
  }

  /**
   * Generate a test file
   */
  async generateTestFile(testType, context, feature, analysis) {
    const fileName = this.generateFileName(testType, context);
    const filePath = this.getFilePath(testType, fileName);
    const content = this.generateContent(testType, context, feature);

    // Create directory if needed
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write test file
    await fs.writeFile(filePath, content, 'utf8');

    return {
      type: testType,
      path: filePath,
      fileName,
      status: 'created',
      expectedToFail: true, // TDD - tests should fail initially
    };
  }

  /**
   * Generate test file name
   */
  generateFileName(testType, context) {
    const base = context.featureId.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

    const suffixes = {
      integration: '.integration.test.ts',
      unit: '.unit.test.ts',
      e2e: '.e2e.test.ts',
      security: '.security.test.ts',
    };

    return base + (suffixes[testType] || '.test.ts');
  }

  /**
   * Get test file path
   */
  getFilePath(testType, fileName) {
    const dirs = {
      integration: 'integration',
      unit: 'unit',
      e2e: 'e2e',
      security: 'security',
    };

    const dir = dirs[testType] || 'integration';
    return path.join(this.testsDir, dir, fileName);
  }

  /**
   * Generate test content from template
   */
  generateContent(testType, context, feature) {
    // Select appropriate template
    let template = '';

    if (testType === 'integration') {
      template = context.type === 'api'
        ? TEST_TEMPLATES.integration.api
        : TEST_TEMPLATES.integration.component;
    } else if (testType === 'unit') {
      template = context.type === 'hook'
        ? TEST_TEMPLATES.unit.hook
        : TEST_TEMPLATES.unit.function;
    } else if (testType === 'e2e') {
      template = TEST_TEMPLATES.e2e.playwright;
    } else if (testType === 'security') {
      template = TEST_TEMPLATES.security.rls;
    }

    // Replace placeholders
    return this.replacePlaceholders(template, {
      ...context,
      componentName: context.componentName || 'Component',
      componentPath: `@/components/${context.componentName || 'Component'}`,
      testId: context.featureId,
      primaryAction: 'user interaction',
      actionLabel: 'Submit',
      apiName: context.title,
      apiPath: `@/pages/api/${context.endpoint || 'endpoint'}`,
      method: 'POST',
      endpoint: context.endpoint || '/api/endpoint',
      functionName: context.functionName || 'processData',
      functionPath: '@/lib/utils',
      hookName: context.hookName || 'useFeature',
      hookPath: `@/hooks/${context.hookName || 'useFeature'}`,
      sampleInput: '{ data: "test" }',
      expectedOutput: '{ result: "success" }',
      emptyInput: 'null',
      invalidInput: 'undefined',
      featureName: feature.title,
      pagePath: '/',
      step1: 'Navigate to page',
      step1Element: 'nav-link',
      step2: 'Fill form',
      step2Element: 'input-field',
      step3: 'Submit',
      sampleText: 'Test Data',
      tableName: 'table_name',
      requirements: feature.requirements || [],
      businessRules: [],
    });
  }

  /**
   * Replace template placeholders
   */
  replacePlaceholders(template, data) {
    let result = template;

    // Simple placeholder replacement
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }

    // Handle each loops
    result = result.replace(
      /{{#each (\w+)}}([\s\S]*?){{\/each}}/g,
      (match, key, content) => {
        const items = data[key] || [];
        return items
          .map((item) => content.replace(/{{this}}/g, item))
          .join('\n    ');
      }
    );

    return result;
  }

  /**
   * Create test plan
   */
  createTestPlan(feature, analysis, generatedTests) {
    return {
      featureId: feature.id,
      title: feature.title,
      complexity: analysis.level,
      profile: analysis.profile,
      coverageTargets: analysis.profile.coverage,
      generatedTests: generatedTests.map((t) => ({
        type: t.type,
        path: t.path,
        status: t.status,
      })),
      testStrategy: analysis.profile.testStrategy,
      estimatedTime: this.estimateTime(analysis.level),
    };
  }

  /**
   * Estimate testing time
   */
  estimateTime(level) {
    const times = {
      trivial: '5 minutes',
      simple: '15-30 minutes',
      moderate: '30-60 minutes',
      complex: '1-2 hours',
      critical: '2-4 hours',
    };

    return times[level] || '1 hour';
  }

  /**
   * Get developer instructions
   */
  getInstructions(level) {
    const instructions = {
      trivial: [
        'Run existing tests to ensure no regressions',
        'No new tests required',
      ],
      simple: [
        'Run generated integration test',
        'Implement code to make test pass',
        'Focus on happy path',
      ],
      moderate: [
        'Start with failing integration tests',
        'Implement features to pass tests',
        'Add unit tests for business logic',
        'Refactor with confidence',
      ],
      complex: [
        'Follow TDD workflow strictly',
        'Implement one test at a time',
        'Write minimum code to pass',
        'Refactor when tests pass',
        'Use cross-LLM review for critical logic',
      ],
      critical: [
        'Review test plan with team',
        'Break into smaller features if possible',
        'Implement incrementally',
        'Run security and performance tests',
        'Mandatory cross-LLM review',
      ],
    };

    return instructions[level] || instructions.moderate;
  }

  // Helper methods
  inferComponentName(title) {
    const words = title.split(/\s+/);
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }

  inferEndpoint(title) {
    const words = title.toLowerCase().split(/\s+/);
    return '/api/' + words.filter((w) => w.length > 2).join('-');
  }

  inferHookName(title) {
    const words = title.toLowerCase().split(/\s+/);
    return 'use' + words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
  }
}

module.exports = TestGenerator;
