import OpenAI from "openai";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testOpenAI() {
    try {
        const client = new OpenAI({
            apiKey: process.env.VITE_OPENAI_API_KEY,
        });

        console.log("Testing OpenAI API connection...");

        const response = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                {
                    role: "user",
                    content: "Write a one-sentence bedtime story about a unicorn."
                }
            ]
        });

        console.log("\n=== Simple Prompt Test ===");
        console.log(response.choices[0].message.content);
        console.log("\nModel used:", response.model);

        console.log("\nAPI test completed successfully! ✅");
    } catch (error) {
        console.error("\n❌ Error testing OpenAI API:");
        if (error instanceof Error) {
            console.error("Error message:", error.message);
        } else {
            console.error("Unknown error:", error);
        }
        process.exit(1);
    }
}

// Run the test
testOpenAI(); 