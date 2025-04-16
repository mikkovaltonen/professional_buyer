import { initializeChat, createResponse, clearChatSession } from '../src/api/chat';

const products = [
  'MINARCTIG EVO 200MLP POWER SOURCE',
  'X3P POWER SOURCE PULSE 450 W',
  'X5 POWER SOURCE 400 PULSE WP'
];

async function testChatbotRoles() {
  console.log('🧪 Starting Chatbot Roles Test\n');
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };

  for (const product of products) {
    console.log(`\n📌 Testing product: ${product}`);
    
    try {
      // Clear previous session
      clearChatSession();
      
      // Initialize chat with product
      console.log('Initializing chat...');
      const initResponse = await initializeChat(product);
      
      if (!initResponse) {
        throw new Error('No response received from initialization');
      }

      // Test basic interaction
      console.log('Testing basic interaction...');
      const testQuestion = 'Onko ennuste optimistinen vai pessimistinen?';
      const response = await createResponse(testQuestion);

      testResults.tests.push({
        product,
        initialization: {
          success: true,
          response: initResponse
        },
        interaction: {
          success: true,
          question: testQuestion,
          response: response
        }
      });

      console.log('✅ Test passed for', product);
      console.log('Initial response:', initResponse);
      console.log('Question response:', response);

    } catch (error) {
      console.error('❌ Test failed for', product, error);
      testResults.tests.push({
        product,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }

  // Save test results
  const fs = require('fs');
  const path = require('path');
  
  // Ensure test_results directory exists
  const resultsDir = path.join(__dirname, 'test_results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Save JSON results
  const jsonPath = path.join(resultsDir, 'chatbot_roles_test.json');
  fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
  
  // Generate and save markdown report
  const markdownReport = generateMarkdownReport(testResults);
  const mdPath = path.join(resultsDir, 'chatbot_roles_test.md');
  fs.writeFileSync(mdPath, markdownReport);

  console.log(`\n📊 Test results saved to:
- JSON: ${jsonPath}
- Markdown: ${mdPath}`);
}

function generateMarkdownReport(results: any) {
  let report = `# Chatbot Roles Test Report\n\n`;
  report += `**Test Date:** ${results.timestamp}\n\n`;
  
  // Summary
  const totalTests = results.tests.length;
  const successfulTests = results.tests.filter((t: any) => !t.error).length;
  
  report += `## Test Results Summary\n\n`;
  report += `- Total Products Tested: ${totalTests}\n`;
  report += `- Successful: ${successfulTests}\n`;
  report += `- Failed: ${totalTests - successfulTests}\n\n`;

  // Detailed results
  report += `## Detailed Test Results\n\n`;
  
  for (const test of results.tests) {
    report += `### ${test.product}\n\n`;
    
    if (test.error) {
      report += `- **Status:** ❌ Failed\n`;
      report += `- **Error:** ${test.error}\n`;
    } else {
      report += `- **Status:** ✅ Success\n`;
      report += `- **Initial Response:** ${test.initialization.response}\n`;
      report += `- **Test Question:** ${test.interaction.question}\n`;
      report += `- **Response:** ${test.interaction.response}\n`;
    }
    report += '\n';
  }

  return report;
}

// Run the tests
testChatbotRoles(); 