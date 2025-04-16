import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function testGeminiAPI() {
  console.log('🚀 Starting Gemini API tests...');
  
  try {
    // Test 1: Simple text response
    console.log('\n📝 Test 1: Simple text response');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-preview-03-25' });
    const result = await model.generateContent('What is the capital of France?');
    const response = await result.response;
    console.log('Response:', response.text());

    // Test 2: Image analysis
    console.log('\n🖼️ Test 2: Image analysis');
    const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-preview-03-25' });
    
    // Read image file
    const imagePath = path.join(__dirname, '../public/demo_data/MINARCTIG EVO 200MLP POWER SOURCE.png');
    const imageData = fs.readFileSync(imagePath);
    const imageBase64 = imageData.toString('base64');

    const imageResult = await imageModel.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/png'
        }
      },
      'Describe this image in detail.'
    ]);
    
    const imageResponse = await imageResult.response;
    console.log('Image Analysis Response:', imageResponse.text());

    // Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [
        {
          name: 'Simple text response',
          input: 'What is the capital of France?',
          output: response.text(),
          success: true
        },
        {
          name: 'Image analysis',
          input: 'Describe this image in detail.',
          output: imageResponse.text(),
          success: true
        }
      ]
    };

    // Save results to JSON file
    const resultsPath = path.join(__dirname, 'test_results/gemini_api_test.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));

    // Generate markdown report
    const markdownReport = generateMarkdownReport(testResults);
    const reportPath = path.join(__dirname, 'test_results/gemini_api_test.md');
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
  return `# Gemini API Test Results

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
testGeminiAPI().catch(console.error); 