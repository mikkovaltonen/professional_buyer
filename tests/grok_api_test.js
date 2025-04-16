import OpenAI from "openai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

// Load environment variables
dotenv.config();

async function runGrokTests() {
    if (!process.env.GROK_API_KEY) {
        throw new Error("The GROK_API_KEY environment variable is missing or empty");
    }

    const client = new OpenAI({
        apiKey: process.env.GROK_API_KEY,
        baseURL: "https://api.x.ai/v1",
        dangerouslyAllowBrowser: true
    });

    const testResults = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    // Demo 1: Simple text response
    try {
        console.log("\nRunning Demo 1: Simple text response");
        const response1 = await client.chat.completions.create({
            model: "grok-3-beta",
            messages: [
                { role: "user", content: "What is the capital of France?" }
            ]
        });

        testResults.tests.push({
            name: "Demo 1: Simple text response",
            input: "What is the capital of France?",
            output: response1.choices[0].message.content,
            success: true
        });
        console.log("Response:", response1.choices[0].message.content);
    } catch (error) {
        testResults.tests.push({
            name: "Demo 1: Simple text response",
            error: error.message,
            success: false
        });
        console.error("Error in Demo 1:", error);
    }

    // Demo 2: Multimodal response with image
    try {
        console.log("\nRunning Demo 2: Multimodal response with image");
        const response2 = await client.chat.completions.create({
            model: "grok-2-vision-latest",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: "https://science.nasa.gov/wp-content/uploads/2023/09/web-first-images-release.png",
                                detail: "high"
                            }
                        },
                        {
                            type: "text",
                            text: "What's in this image?"
                        }
                    ]
                }
            ]
        });

        testResults.tests.push({
            name: "Demo 2: Multimodal response with image",
            input: "Image analysis of basketball game",
            output: response2.choices[0].message.content,
            success: true
        });
        console.log("Response:", response2.choices[0].message.content);
    } catch (error) {
        testResults.tests.push({
            name: "Demo 2: Multimodal response with image",
            error: error.message,
            success: false
        });
        console.error("Error in Demo 2:", error);
    }

    // Demo 3: Response with reasoning
    try {
        console.log("\nRunning Demo 3: Response with reasoning");
        const response3 = await client.chat.completions.create({
            model: "grok-3-beta",
            messages: [
                { 
                    role: "user", 
                    content: "If a train leaves station A at 60 mph and another leaves station B at 40 mph, and they are 300 miles apart, how long until they meet? Please show your reasoning step by step."
                }
            ]
        });

        testResults.tests.push({
            name: "Demo 3: Response with reasoning",
            input: "Train meeting time calculation",
            output: response3.choices[0].message.content,
            success: true
        });
        console.log("Response:", response3.choices[0].message.content);
    } catch (error) {
        testResults.tests.push({
            name: "Demo 3: Response with reasoning",
            error: error.message,
            success: false
        });
        console.error("Error in Demo 3:", error);
    }

    // Save test results
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testResultsPath = join(__dirname, 'test_results', 'grok_api_test.json');
    
    // Ensure directory exists
    if (!existsSync(dirname(testResultsPath))) {
        mkdirSync(dirname(testResultsPath), { recursive: true });
    }
    
    writeFileSync(testResultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to ${testResultsPath}`);

    // Generate markdown report
    const markdownReport = generateMarkdownReport(testResults);
    const reportPath = join(__dirname, 'test_results', 'grok_api_test.md');
    writeFileSync(reportPath, markdownReport);
    console.log(`Markdown report saved to ${reportPath}`);
}

function generateMarkdownReport(testResults) {
    let report = `# Grok 3 API Test Report\n\n`;
    report += `**Test Date:** ${testResults.timestamp}\n\n`;
    report += `## Test Results Summary\n\n`;

    const totalTests = testResults.tests.length;
    const successfulTests = testResults.tests.filter(test => test.success).length;
    const failedTests = totalTests - successfulTests;

    report += `- Total Tests: ${totalTests}\n`;
    report += `- Successful: ${successfulTests}\n`;
    report += `- Failed: ${failedTests}\n\n`;

    report += `## Detailed Test Results\n\n`;

    testResults.tests.forEach((test, index) => {
        report += `### Test ${index + 1}: ${test.name}\n\n`;
        report += `- **Status:** ${test.success ? '✅ Success' : '❌ Failed'}\n`;
        if (test.success) {
            report += `- **Input:** ${test.input}\n`;
            report += `- **Output:** ${test.output}\n`;
        } else {
            report += `- **Error:** ${test.error}\n`;
        }
        report += '\n';
    });

    report += `## API Compatibility Assessment\n\n`;
    report += `Based on the test results, the Grok 3 API ${successfulTests === totalTests ? 'is' : 'is not'} fully compatible with the OpenAI SDK structure.\n\n`;
    
    if (failedTests > 0) {
        report += `### Issues Identified:\n\n`;
        testResults.tests
            .filter(test => !test.success)
            .forEach(test => {
                report += `- ${test.name}: ${test.error}\n`;
            });
    }

    return report;
}

// Run the tests
runGrokTests().catch(console.error); 