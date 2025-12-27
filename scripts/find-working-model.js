const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API;

async function testGeminiAPI() {
    console.log("🔑 Testing with API key:", apiKey?.substring(0, 10) + "...");
    console.log("\n" + "=".repeat(60) + "\n");

    // Test 1: List models from v1beta
    try {
        console.log("📋 Fetching models from v1beta API...");
        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        console.log(`✅ Found ${response.data.models?.length || 0} models:\n`);

        const textModels = response.data.models?.filter(m =>
            m.supportedGenerationMethods?.includes('generateContent')
        ) || [];

        console.log("📝 Models that support text generation (generateContent):");
        textModels.forEach(model => {
            console.log(`  ✓ ${model.name}`);
            console.log(`    Display: ${model.displayName}`);
            console.log(`    Methods: ${model.supportedGenerationMethods?.join(', ')}`);
            console.log("");
        });

        // Test with the first available model
        if (textModels.length > 0) {
            const testModel = textModels[0].name;
            console.log(`\n🧪 Testing generation with: ${testModel}\n`);

            const testResponse = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/${testModel}:generateContent?key=${apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: "Say hello in one word"
                        }]
                    }]
                }
            );

            const result = testResponse.data.candidates[0].content.parts[0].text;
            console.log(`✅ SUCCESS! Response: "${result}"`);
            console.log(`\n🎯 USE THIS MODEL: ${testModel}`);
        } else {
            console.log("❌ No models support generateContent");
        }

    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
    }
}

testGeminiAPI();
