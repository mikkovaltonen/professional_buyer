import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { createResponse } from '../src/api/chat.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const products = [
  {
    name: "Product A",
    description: "A high-end consumer electronics device",
    price: 999.99,
    category: "Electronics"
  },
  {
    name: "Product B", 
    description: "An affordable household appliance",
    price: 299.99,
    category: "Appliances"
  }
];

async function testChatbotRoles() {
  const results = {
    testDate: new Date().toISOString(),
    tests: []
  };

  for (const product of products) {
    try {
      console.log(`Testing chat for ${product.name}...`);
      
      // Initialize chat with product context
      const initMessage = `You are a sales assistant for ${product.name}. ${product.description}. It costs $${product.price}.`;
      
      const response = await createResponse({
        messages: [{ role: "system", content: initMessage }],
        model: "grok-3"
      });

      results.tests.push({
        product: product.name,
        success: true,
        initMessage,
        response: response.content
      });

    } catch (error) {
      console.error(`Error testing ${product.name}:`, error);
      results.tests.push({
        product: product.name,
        success: false,
        error: error.message
      });
    }
  }

  // Create test results directory if it doesn't exist
  const resultsDir = join(__dirname, 'test_results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir);
  }

  // Save results as JSON
  const jsonPath = join(resultsDir, 'chatbot_roles_test.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  // Generate and save markdown report
  const markdown = generateMarkdownReport(results);
  const mdPath = join(resultsDir, 'chatbot_roles_test.md');
  writeFileSync(mdPath, markdown);

  console.log(`Test results saved to ${jsonPath}`);
  console.log(`Markdown report saved to ${mdPath}`);
}

function generateMarkdownReport(results) {
  let markdown = `# Chatbot Roles Test Report\n\n`;
  markdown += `Test Date: ${results.testDate}\n\n`;
  markdown += `## Test Results\n\n`;

  for (const test of results.tests) {
    markdown += `### ${test.product}\n\n`;
    markdown += `Status: ${test.success ? '✅ Success' : '❌ Failed'}\n\n`;

    if (test.success) {
      markdown += `Initial Message:\n\`\`\`\n${test.initMessage}\n\`\`\`\n\n`;
      markdown += `Response:\n\`\`\`\n${test.response}\n\`\`\`\n\n`;
    } else {
      markdown += `Error: ${test.error}\n\n`;
    }
  }

  return markdown;
}

// Self-executing async function to run tests
(async () => {
  try {
    await testChatbotRoles();
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
})();

export { testChatbotRoles, generateMarkdownReport }; 