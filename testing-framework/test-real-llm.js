/**
 * @fileoverview Test Real LLM Integration
 * Tests hook system with real LLM calls (Gemini Flash)
 * Run this to verify real LLM integration works before full deployment
 */

const HookSystem = require('./hook-system');

async function testRealLLM() {
  console.log('\n🧪 Testing Real LLM Integration\n');

  // Create hook system with real LLMs enabled
  const hookSystem = new HookSystem({
    useRealLLMs: true,
    maxFeedbackIterations: 1, // Limit iterations to save API calls
  });

  // Test with ui-advisor (uses Gemini Flash - fast and cheap)
  console.log('📝 Testing ui-advisor hook with real Gemini Flash...\n');

  const hook = {
    name: 'ui-requirements',
    agent: 'ui-advisor',
    priority: 'critical',
    description: 'Identify UI/UX requirements and patterns'
  };

  // Set up context with a real UI feature
  hookSystem.context = {
    brief: {
      title: 'User Dashboard',
      description: 'Create a dashboard page showing user statistics, recent activity, and quick actions',
      requirements: [
        'Display user profile summary',
        'Show recent activity timeline',
        'Quick action buttons for common tasks',
        'Responsive design for mobile and desktop'
      ]
    },
    advice: [],
    projectContext: {
      techStack: 'Next.js, React, Tailwind CSS',
      existingDesign: 'Uses Tailwind with custom color palette'
    },
    decisions: [],
    revisions: []
  };

  try {
    console.log('Calling Gemini Flash...');
    console.log('(This may take 10-30 seconds)\n');

    const startTime = Date.now();
    const result = await hookSystem.executeHook(hook);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ SUCCESS! LLM call completed in ${duration}s\n`);

    // Validate response format
    const validation = hookSystem.validateAdviceFormat(result);

    if (validation.valid) {
      console.log('✅ Response format is valid\n');

      console.log('📊 Response Summary:');
      console.log(`   Priority: ${result.priority}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`   Issues found: ${result.findings.issues.length}`);
      console.log(`   Suggestions: ${result.findings.suggestions.length}`);
      console.log(`   References: ${result.findings.references.length}`);
      console.log(`   Risks: ${result.findings.risks.length}`);

      console.log('\n📋 Findings:');
      if (result.findings.issues.length > 0) {
        console.log('\n   Issues:');
        result.findings.issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      }

      if (result.findings.suggestions.length > 0) {
        console.log('\n   Suggestions:');
        result.findings.suggestions.forEach((sugg, i) => {
          console.log(`   ${i + 1}. ${sugg}`);
        });
      }

      if (result.findings.risks.length > 0) {
        console.log('\n   Risks:');
        result.findings.risks.forEach((risk, i) => {
          console.log(`   ${i + 1}. ${risk}`);
        });
      }

      console.log('\n✅ Real LLM integration test PASSED!');
      console.log('\nNext steps:');
      console.log('1. Review the advice quality above');
      console.log('2. If quality is good, enable for all hooks');
      console.log('3. Run full test suite with real LLMs');
    } else {
      console.log(`❌ Response format invalid: ${validation.error}`);
      console.log('\nRaw response:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run test
testRealLLM().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
