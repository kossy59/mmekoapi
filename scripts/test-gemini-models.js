const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API;
const genAI = new GoogleGenerativeAI(apiKey);

async function listAvailableModels() {
    try {
        console.log("🔍 Attempting to list available models...\n");

        // Try different model names that might work with v1beta
        const modelsToTry = [
            "gemini-1.0-pro-latest",
            "gemini-1.0-pro-001",
            "text-bison-001",
            "chat-bison-001"
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Testing model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Say hello");
                const response = await result.response;
                console.log(`✅ SUCCESS with ${modelName}!`);
                console.log(`Response: ${response.text()}\n`);
                break; // Stop on first success
            } catch (error) {
                console.log(`❌ ${modelName} failed: ${error.message}\n`);
            }
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listAvailableModels();
