import OpenAI from "openai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenAIResponses() {
    try {
        const client = new OpenAI({
            apiKey: process.env.VITE_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true
        });

        console.log("Starting OpenAI responses API test...");

        const response = await client.responses.create({
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
        });

        console.log("Response received:");
        console.log(response.output_text);

        // Save test results
        const testResults = {
            timestamp: new Date().toISOString(),
            testName: "OpenAI Responses API Test",
            input: {
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
            },
            output: response.output_text,
            success: true
        };

        // Save test results to a file
        const fs = require('fs');
        const path = require('path');
        const testResultsPath = path.join(__dirname, 'test_results', 'openai_responses_test.json');
        
        // Ensure directory exists
        if (!fs.existsSync(path.dirname(testResultsPath))) {
            fs.mkdirSync(path.dirname(testResultsPath), { recursive: true });
        }
        
        fs.writeFileSync(testResultsPath, JSON.stringify(testResults, null, 2));
        console.log(`Test results saved to ${testResultsPath}`);

    } catch (error) {
        console.error("Error in OpenAI responses API test:", error);
        throw error;
    }
}

// Run the test
testOpenAIResponses().catch(console.error); 