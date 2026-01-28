/**
 * Test script to verify duplicate story prevention
 * This will attempt to generate the same story multiple times simultaneously
 * Expected result: Only 1 story should be created, others should be blocked
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the controller
const { generateAndSaveStories } = require('./Controller/AiStoryController');

async function testDuplicatePrevention() {
    try {
        console.log('🧪 Starting duplicate story prevention test...\n');

        // Connect to database
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ Connected to database\n');

        // Get count before test
        const Story = require('./models/Story');
        const beforeCount = await Story.countDocuments();
        console.log(`📊 Stories in DB before test: ${beforeCount}\n`);

        // Attempt to generate 3 stories simultaneously
        console.log('🚀 Launching 3 simultaneous generation requests...\n');

        const results = await Promise.allSettled([
            generateDailyStory(),
            generateDailyStory(),
            generateDailyStory()
        ]);

        console.log('\n📋 Results:');
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`  Request ${index + 1}: ✅ Success (Story ID: ${result.value._id})`);
            } else {
                console.log(`  Request ${index + 1}: ❌ Blocked (${result.reason.message})`);
            }
        });

        // Get count after test
        const afterCount = await Story.countDocuments();
        console.log(`\n📊 Stories in DB after test: ${afterCount}`);

        const newStories = afterCount - beforeCount;
        console.log(`\n🎯 New stories created: ${newStories}`);

        if (newStories === 1) {
            console.log('\n✅ TEST PASSED: Only 1 story was created (duplicates prevented)');
        } else {
            console.log(`\n❌ TEST FAILED: ${newStories} stories were created (expected 1)`);
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('\n❌ Test error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Import the function we need
async function generateDailyStory() {
    const { generateDailyStory: genFunc } = require('./Controller/AiStoryController');
    return genFunc();
}

// Run test
testDuplicatePrevention();
