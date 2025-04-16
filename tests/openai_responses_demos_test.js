import OpenAI from "openai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

// Load environment variables
dotenv.config();

async function runDemoTests() {
    const client = new OpenAI({
        apiKey: process.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
    });

    const testResults = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    // Demo 1: Simple text response
    try {
        console.log("\nRunning Demo 1: Simple text response");
        const response1 = await client.responses.create({
            model: "gpt-4.1",
            input: "What is the capital of France?",
            text: {
                format: {
                    type: "text"
                }
            }
        });

        testResults.tests.push({
            name: "Demo 1: Simple text response",
            input: "What is the capital of France?",
            output: response1.text,
            success: true
        });
        console.log("Response:", response1.text);
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
        const response2 = await client.responses.create({
            model: "gpt-4.1",
            input: [
                { role: "user", content: "What two teams are playing in this photo?" },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_image", 
                            image_url: "https://upload.wikimedia.org/wikipedia/commons/3/3b/LeBron_James_Layup_%28Cleveland_vs_Brooklyn_2018%29.jpg",
                            detail: "high"
                        }
                    ],
                },
            ],
            text: {
                format: {
                    type: "text"
                }
            }
        });

        testResults.tests.push({
            name: "Demo 2: Multimodal response with image",
            input: "Image analysis of basketball game",
            output: response2.text,
            success: true
        });
        console.log("Response:", response2.text);
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
        const response3 = await client.responses.create({
            model: "gpt-4.1",
            input: "If a train leaves station A at 60 mph and another leaves station B at 40 mph, and they are 300 miles apart, how long until they meet?",
            text: {
                format: {
                    type: "text"
                }
            },
            reasoning: {
                type: "chain_of_thought"
            }
        });

        testResults.tests.push({
            name: "Demo 3: Response with reasoning",
            input: "Train meeting time calculation",
            output: response3.text,
            success: true
        });
        console.log("Response:", response3.text);
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
    const testResultsPath = join(__dirname, 'test_results', 'openai_responses_demos_test.json');
    
    // Ensure directory exists
    if (!existsSync(dirname(testResultsPath))) {
        mkdirSync(dirname(testResultsPath), { recursive: true });
    }
    
    writeFileSync(testResultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to ${testResultsPath}`);

    // Generate markdown report
    const markdownReport = generateMarkdownReport(testResults);
    const reportPath = join(__dirname, 'test_results', 'openai_responses_demos_test.md');
    writeFileSync(reportPath, markdownReport);
    console.log(`Markdown report saved to ${reportPath}`);
}

function generateMarkdownReport(testResults) {
    let report = `# OpenAI Responses API Test Report\n\n`;
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
    report += `Based on the test results, the OpenAI Responses API ${successfulTests === totalTests ? 'is' : 'is not'} fully compatible with the current OpenAI SDK (v4.94.0).\n\n`;
    
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
runDemoTests().catch(console.error); 