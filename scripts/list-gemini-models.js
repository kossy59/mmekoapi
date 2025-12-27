const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API;

async function listModels() {
    try {
        console.log("🔍 Fetching available models from Gemini API...\n");

        // Try v1 endpoint
        try {
            const response = await axios.get(
                `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
            );

            console.log("✅ V1 API - Available models:");
            response.data.models.forEach(model => {
                console.log(`  - ${model.name} (${model.displayName})`);
                if (model.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`    ✓ Supports generateContent`);
                }
            });
        } catch (error) {
            console.log("❌ V1 API failed:", error.response?.data?.error?.message || error.message);
        }

        console.log("\n");

        // Try v1beta endpoint
        try {
            const response = await axios.get(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );

            console.log("✅ V1BETA API - Available models:");
            response.data.models.forEach(model => {
                console.log(`  - ${model.name} (${model.displayName})`);
                if (model.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`    ✓ Supports generateContent`);
                }
            });
        } catch (error) {
            console.log("❌ V1BETA API failed:", error.response?.data?.error?.message || error.message);
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
