const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API;

if (!apiKey) {
    console.error("❌ GEMINI_API key is missing in .env file");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // There isn't a direct listModels method on the client instance in some versions, 
        // but we can try to generate with a known model to test access.
        // actually older versions had it, newer might not exposed easily via the wrapper?
        // Let's try to just run a simple generation with 'gemini-pro' and see the specific error or success.

        console.log("Testing Gemini API...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Hello world";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("✅ Success! Response:", response.text());
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.response) {
            console.error("Details:", JSON.stringify(error.response, null, 2));
        }
    }
}

listModels();
