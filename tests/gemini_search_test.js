import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function testGeminiSearch() {
  console.log('🚀 Starting Gemini Search Test...');
  
  try {
    // Test 1: Simple search query
    console.log('\n🔍 Test 1: Simple search query');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro-preview-03-25',
      tools: [
        { googleSearch: {} }
      ]
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'What are the latest developments in AI for supply chain management in 2024?' }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const response = await result.response;
    console.log('Response:', response.text());

    // Test 2: Search with specific product information
    console.log('\n🔍 Test 2: Search with product context');
    const productResult = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'What are the current market trends for welding equipment in Europe?' }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const productResponse = await productResult.response;
    console.log('Response:', productResponse.text());

    // Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [
        {
          name: 'Simple search query',
          input: 'What are the latest developments in AI for supply chain management in 2024?',
          output: response.text(),
          success: true
        },
        {
          name: 'Search with product context',
          input: 'What are the current market trends for welding equipment in Europe?',
          output: productResponse.text(),
          success: true
        }
      ]
    };

    // Save results to JSON file
    const resultsPath = path.join(__dirname, 'test_results/gemini_search_test.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));

    // Generate markdown report
    const markdownReport = generateMarkdownReport(testResults);
    const reportPath = path.join(__dirname, 'test_results/gemini_search_test.md');
    fs.writeFileSync(reportPath, markdownReport);

    console.log('\n✅ Tests completed successfully!');
    console.log('Results saved to:', resultsPath);
    console.log('Report saved to:', reportPath);

  } catch (error) {
    console.error('❌ Error during tests:', error);
    throw error;
  }
}

function generateMarkdownReport(results) {
  return `# Gemini Search Test Results

**Test Date:** ${results.timestamp}

## Test Results Summary
- Total Tests: ${results.tests.length}
- Successful: ${results.tests.filter(t => t.success).length}
- Failed: ${results.tests.filter(t => !t.success).length}

## Detailed Test Results
${results.tests.map(test => `
### ${test.name}
- **Input:** ${test.input}
- **Output:** ${test.output}
- **Status:** ${test.success ? '✅ Success' : '❌ Failed'}
`).join('\n')}
`;
}

// Run the tests
testGeminiSearch().catch(console.error); 