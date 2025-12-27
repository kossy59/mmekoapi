require('dotenv').config();
const axios = require('axios');

async function testStoryGeneration() {
    try {
        console.log('🧪 Testing story generation...\n');

        // Test 1: Generate stories
        console.log('📝 Step 1: Generating 5 stories with 20 panels each...');
        const generateResponse = await axios.post('http://localhost:3100/api/ai-story/generate');

        console.log(`✅ Response: ${generateResponse.data.message}`);
        console.log(`📊 Generated ${generateResponse.data.stories.length} stories\n`);

        // Wait a bit for images to start generating
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Fetch all stories
        console.log('📚 Step 2: Fetching all stories...');
        const storiesResponse = await axios.get('http://localhost:3100/api/ai-story/stories');

        console.log(`✅ Found ${storiesResponse.data.stories.length} stories\n`);

        // Test 3: Check first story details
        if (storiesResponse.data.stories.length > 0) {
            const firstStory = storiesResponse.data.stories[0];
            console.log('🔍 First Story Details:');
            console.log(`   Title: ${firstStory.title}`);
            console.log(`   Emotional Core: ${firstStory.emotional_core}`);
            console.log(`   Panels: ${firstStory.panels?.length || 0}`);
            console.log(`   Cover Image: ${firstStory.coverImage ? 'Yes' : 'No'}\n`);

            // Test 4: Fetch single story
            console.log('📖 Step 3: Fetching single story details...');
            const singleStoryResponse = await axios.get(`http://localhost:3100/api/ai-story/stories/${firstStory._id}`);
            const detailedStory = singleStoryResponse.data.story;

            console.log(`✅ Story: ${detailedStory.title}`);
            console.log(`   Total Panels: ${detailedStory.panels.length}`);
            console.log(`   Panels with images: ${detailedStory.panels.filter(p => p.imageUrl).length}`);
            console.log(`   Views: ${detailedStory.views}\n`);

            // Show first 3 panels
            console.log('📄 First 3 Panels:');
            detailedStory.panels.slice(0, 3).forEach(panel => {
                console.log(`   ${panel.panel_number}. ${panel.text}`);
                console.log(`      Image: ${panel.imageUrl ? panel.imageUrl.substring(0, 50) + '...' : 'Not yet generated'}`);
            });
        }

        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testStoryGeneration();
