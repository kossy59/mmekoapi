const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const Replicate = require("replicate");
const Story = require('../models/Story');
const { uploadToStorj } = require('../utiils/storjUpload');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Set your app's official launch date here (YYYY-MM-DD format)
const LAUNCH_DATE = new Date('2025-01-01T00:00:00Z');

// Mutex lock to prevent race conditions during story generation
// Stores date strings (YYYY-MM-DD) of stories currently being generated
const generationLocks = new Set();

// Story configuration mapping (50-day cycle)
const STORY_CONFIGS = {
    1: { type: "Underdog vs System", emotion: "Anger", perspective: "First person" },
    2: { type: "Hidden Truth", emotion: "Hope", perspective: "Second person" },
    3: { type: "Personal Loss", emotion: "Grief", perspective: "Third person" },
    4: { type: "Moral Choice", emotion: "Relief", perspective: "Observer" },
    5: { type: "Builder's Sacrifice", emotion: "Quiet Confidence", perspective: "Confessional" },

    6: { type: "Public Humiliation", emotion: "Shame", perspective: "First person" },
    7: { type: "Secret Kept Too Long", emotion: "Regret", perspective: "Second person" },
    8: { type: "Sudden Responsibility", emotion: "Pressure", perspective: "Third person" },
    9: { type: "Choosing Self Respect", emotion: "Resolve", perspective: "Observer" },
    10: { type: "Walking Away", emotion: "Calm", perspective: "Confessional" },

    11: { type: "Being Misjudged", emotion: "Frustration", perspective: "First person" },
    12: { type: "Truth Finally Said", emotion: "Release", perspective: "Second person" },
    13: { type: "Life Before vs After", emotion: "Sad Acceptance", perspective: "Third person" },
    14: { type: "Loyalty Tested", emotion: "Inner Conflict", perspective: "Observer" },
    15: { type: "Silent Persistence", emotion: "Steady Confidence", perspective: "Confessional" },

    16: { type: "Missed Timing", emotion: "Bittersweet", perspective: "First person" },
    17: { type: "Realizing the Lie", emotion: "Disbelief", perspective: "Second person" },
    18: { type: "Letting Go Slowly", emotion: "Emotional Exhaustion", perspective: "Third person" },
    19: { type: "Standing Alone", emotion: "Strength", perspective: "Observer" },
    20: { type: "Building Without Applause", emotion: "Quiet Pride", perspective: "Confessional" },

    21: { type: "Childhood Memory", emotion: "Nostalgia", perspective: "First person" },
    22: { type: "Hidden Envy", emotion: "Jealousy", perspective: "Second person" },
    23: { type: "Sudden Illness", emotion: "Fear", perspective: "Third person" },
    24: { type: "Witnessing Injustice", emotion: "Anger", perspective: "Observer" },
    25: { type: "Quiet Aging", emotion: "Acceptance", perspective: "Confessional" },

    26: { type: "Public Rejection", emotion: "Hurt", perspective: "First person" },
    27: { type: "Secret Crush", emotion: "Vulnerability", perspective: "Second person" },
    28: { type: "Heavy Debt", emotion: "Anxiety", perspective: "Third person" },
    29: { type: "Watching Collapse", emotion: "Helplessness", perspective: "Observer" },
    30: { type: "Daily Survival", emotion: "Resilience", perspective: "Confessional" },

    31: { type: "Misplaced Trust", emotion: "Betrayal", perspective: "First person" },
    32: { type: "Confession Shared", emotion: "Relief", perspective: "Second person" },
    33: { type: "Before War", emotion: "Dread", perspective: "Third person" },
    34: { type: "Community Fracture", emotion: "Conflict", perspective: "Observer" },
    35: { type: "Hidden Effort", emotion: "Determination", perspective: "Confessional" },

    36: { type: "Missed Signal", emotion: "Confusion", perspective: "First person" },
    37: { type: "Realizing Distance", emotion: "Isolation", perspective: "Second person" },
    38: { type: "Slow Healing", emotion: "Weariness", perspective: "Third person" },
    39: { type: "Witnessing Courage", emotion: "Admiration", perspective: "Observer" },
    40: { type: "Work Forgotten", emotion: "Resentment", perspective: "Confessional" },

    41: { type: "Sudden Fame", emotion: "Overwhelm", perspective: "First person" },
    42: { type: "Hidden Addiction", emotion: "Shame", perspective: "Second person" },
    43: { type: "Sudden Accident", emotion: "Shock", perspective: "Third person" },
    44: { type: "Witnessing Forgiveness", emotion: "Relief", perspective: "Observer" },
    45: { type: "Builder's Legacy", emotion: "Pride", perspective: "Confessional" },

    46: { type: "Public Silence", emotion: "Alienation", perspective: "First person" },
    47: { type: "Secret Burden", emotion: "Guilt", perspective: "Second person" },
    48: { type: "Sudden Leadership", emotion: "Pressure", perspective: "Third person" },
    49: { type: "Watching Betrayal", emotion: "Disbelief", perspective: "Observer" },
    50: { type: "Quiet Ending", emotion: "Closure", perspective: "Confessional" }
};

// Helper: Calculate day index based on days since launch
function getDayIndex() {
    const now = new Date();
    const daysSinceLaunch = Math.floor((now - LAUNCH_DATE) / (1000 * 60 * 60 * 24));
    return (daysSinceLaunch % 50) + 1;
}

// Helper: Get story config for today
function getTodayStoryConfig() {
    const dayIndex = getDayIndex();
    return {
        dayIndex,
        ...STORY_CONFIGS[dayIndex]
    };
}

// Automatic daily story generation (called by cron job)
const generateDailyStory = async () => {
    // Create lock key based on today's date
    const today = new Date();
    const lockKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
        console.log("🌅 Starting automatic daily story generation...");
        console.log(`🕒 Current time: ${new Date().toISOString()}`);

        // Check if generation is already in progress for today
        if (generationLocks.has(lockKey)) {
            console.log("⚠️  Story generation already in progress for today. Skipping duplicate request.");
            throw new Error("Story generation already in progress for today");
        }

        // Acquire lock
        generationLocks.add(lockKey);
        console.log(`🔒 Acquired generation lock for ${lockKey}`);

        const config = getTodayStoryConfig();
        console.log(`📅 Day Index: ${config.dayIndex} | Type: ${config.type} | Emotion: ${config.emotion}`);

        // Check if today's story already exists
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingStory = await Story.findOne({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        if (existingStory) {
            console.log("✅ Today's story already exists. Skipping generation.");
            generationLocks.delete(lockKey); // Release lock
            return existingStory;
        }

        // Generate story with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Determine if today is a special ritual day
        const dayOfWeek = new Date().getDay(); // 0 = Sunday, 5 = Friday
        const isHeavyRitual = dayOfWeek === 0; // Sunday
        const isNoTitleRitual = dayOfWeek === 5; // Friday
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = days[dayOfWeek];

        const prompt = `
You are a story engine creating short-form, addictive social rituals.

TODAY'S STORY SLOT:
Story Number: ${config.dayIndex}
Current Day: ${currentDayName}

STORY SLOT MAPPING (STRICT — DO NOT MIX):

1 → Underdog vs System | Anger | First person  
2 → Hidden Truth | Hope | Second person  
3 → Personal Loss | Grief | Third person  
4 → Moral Choice | Relief | Observer  
5 → Builder’s Sacrifice | Quiet Confidence | Confessional  

6 → Public Humiliation | Shame | First person  
7 → Secret Kept Too Long | Regret | Second person  
8 → Sudden Responsibility | Pressure | Third person  
9 → Choosing Self Respect | Resolve | Observer  
10 → Walking Away | Calm | Confessional  

11 → Being Misjudged | Frustration | First person  
12 → Truth Finally Said | Release | Second person  
13 → Life Before vs After | Sad Acceptance | Third person  
14 → Loyalty Tested | Inner Conflict | Observer  
15 → Silent Persistence | Steady Confidence | Confessional  

16 → Missed Timing | Bittersweet | First person  
17 → Realizing the Lie | Disbelief | Second person  
18 → Letting Go Slowly | Emotional Exhaustion | Third person  
19 → Standing Alone | Strength | Observer  
20 → Building Without Applause | Quiet Pride | Confessional  

21 → Childhood Memory | Nostalgia | First person  
22 → Hidden Envy | Jealousy | Second person  
23 → Sudden Illness | Fear | Third person  
24 → Witnessing Injustice | Anger | Observer  
25 → Quiet Aging | Acceptance | Confessional  

26 → Public Rejection | Hurt | First person  
27 → Secret Crush | Vulnerability | Second person  
28 → Heavy Debt | Anxiety | Third person  
29 → Watching Collapse | Helplessness | Observer  
30 → Daily Survival | Resilience | Confessional  

31 → Misplaced Trust | Betrayal | First person  
32 → Confession Shared | Relief | Second person  
33 → Before War | Dread | Third person  
34 → Community Fracture | Conflict | Observer  
35 → Hidden Effort | Determination | Confessional  

36 → Missed Signal | Confusion | First person  
37 → Realizing Distance | Isolation | Second person  
38 → Slow Healing | Weariness | Third person  
39 → Witnessing Courage | Admiration | Observer  
40 → Work Forgotten | Resentment | Confessional  

41 → Sudden Fame | Overwhelm | First person  
42 → Hidden Addiction | Shame | Second person  
43 → Sudden Accident | Shock | Third person  
44 → Witnessing Forgiveness | Relief | Observer  
45 → Builder’s Legacy | Pride | Confessional  

46 → Public Silence | Alienation | First person  
47 → Secret Burden | Guilt | Second person  
48 → Sudden Leadership | Pressure | Third person  
49 → Watching Betrayal | Disbelief | Observer  
50 → Quiet Ending | Closure | Confessional  

HEAVY RITUAL → Every Sunday | Emotionally Heavy | Cold tone | 15 panels | Each panel max 4 words  
NO TITLE RITUAL → Every Friday | Emotionally Heavy | Cold tone | 15 panels | Each panel max 4 words | No title

TASK:
Generate ONE complete storyline for today’s slot only.

REQUIREMENTS:
- Title: EXACTLY 4 words (except NO TITLE RITUAL, which has no title)
- EXACTLY 15 panels
- Each panel is ONE short sentence
- Normal slots: max 12 words per panel
- Heavy Ritual: max 4 words per panel
- No Title Ritual: max 4 words per panel
- Panels must be sequential and cinematic
- Emotional core must match today’s slot
- Perspective must match today’s slot

LANGUAGE CONSTRAINTS (MANDATORY):
- Use simple, everyday English
- Write like speaking to someone tired and emotional
- No big words or poetic language
- No metaphors that need thinking
- Short, clear sentences
- Understandable by a 12-year-old
- Emotional clarity over beauty
- Cold tone = detached, blunt sentences, no comfort words

GLOBAL RULES:
- Do NOT reuse characters, events, or endings from previous days
- Do NOT echo earlier stories in structure or outcome
- No repeated phrases
- No brand names
- No explicit sexual language
- No motivational clichés
- No calls to action

OUTPUT FORMAT (STRICT JSON):

{
  "storynumber": ${config.dayIndex},
  "title": "",   // leave empty for NO TITLE RITUAL
  "emotional_core": "${config.emotion}",
  "panels": [
    { "panel_number": 1, "text": "" },
    { "panel_number": 2, "text": "" },
    { "panel_number": 3, "text": "" },
    { "panel_number": 4, "text": "" },
    { "panel_number": 5, "text": "" },
    { "panel_number": 6, "text": "" },
    { "panel_number": 7, "text": "" },
    { "panel_number": 8, "text": "" },
    { "panel_number": 9, "text": "" },
    { "panel_number": 10, "text": "" },
    { "panel_number": 11, "text": "" },
    { "panel_number": 12, "text": "" },
    { "panel_number": 13, "text": "" },
    { "panel_number": 14, "text": "" },
    { "panel_number": 15, "text": "" }
  ]
}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const storyData = JSON.parse(cleanText);

        // Normalize story_number key (handle both storynumber and story_number)
        if (storyData.storynumber && !storyData.story_number) {
            storyData.story_number = storyData.storynumber;
        }

        console.log(`✅ Generated story: ${storyData.title || 'No Title Ritual'} (${storyData.panels.length} panels)`);

        // Handle No Title Rituals: use placeholder if title is empty
        const finalTitle = storyData.title && storyData.title.trim() !== ''
            ? storyData.title
            : 'Untitled Ritual';

        // CRITICAL: Generate cover image FIRST before saving to database
        console.log(`📸 Generating cover image before saving story...`);
        const coverPanel = storyData.panels[0];
        const tempStoryId = `temp-${Date.now()}`; // Temporary ID for image filename

        const coverImageUrl = await generateAndUploadImage(
            coverPanel.text,
            storyData.emotional_core,
            `story-${tempStoryId}-cover`
        );

        if (!coverImageUrl) {
            const error = new Error('❌ CRITICAL: Cover image generation failed. Story will NOT be saved to database.');
            console.error(error.message);
            throw error; // Stop everything - don't save the story
        }

        console.log(`✅ Cover image generated successfully! Proceeding to save story...`);

        // Calculate lifecycle dates
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days
        const deletesAt = new Date(now);
        deletesAt.setDate(deletesAt.getDate() + 60); // Deletes in 60 days

        // Create temporary story object (NOT saved to database yet)
        const tempStory = {
            story_number: storyData.story_number,
            title: storyData.title,
            emotional_core: storyData.emotional_core,
            panels: storyData.panels.map((p, index) => ({
                panel_number: p.panel_number,
                text: p.text,
                imageUrl: index === 0 ? coverImageUrl : null // First panel already has image
            })),
            coverImage: coverImageUrl, // Set the cover image
            launchDate: now,
            expiresAt: expiresAt,
            deletesAt: deletesAt,
            isExpired: false
        };

        console.log(`🎨 Starting image generation for all ${tempStory.panels.length} panels (synchronous)...`);
        console.log(`⚠️  This will take approximately 2-3 minutes. Story will NOT be saved if any image fails.`);

        // Generate ALL images synchronously BEFORE saving to database
        // If ANY image fails, this will throw an error and story won't be saved
        const storyWithImages = await generateImagesForStory(tempStory);

        // Only save to database if ALL images were generated successfully
        console.log(`💾 All images generated successfully! Saving story to database...`);
        const story = new Story(storyWithImages);
        const savedStory = await story.save();
        console.log(`✅ Story saved with all images: ${storyData.story_number}: ${storyData.title}`);

        // Release lock after successful save
        generationLocks.delete(lockKey);
        console.log(`🔓 Released generation lock for ${lockKey}`);

        return savedStory;

    } catch (error) {
        console.error("❌ DETAILED ERROR in generateDailyStory:", error);
        // Release lock on error
        generationLocks.delete(lockKey);
        console.log(`🔓 Released generation lock for ${lockKey} (error occurred)`);
        throw error;
    }
};

// Manual trigger endpoint (for testing or manual generation)
const generateAndSaveStories = async (req, res) => {
    try {
        console.log("🎬 Manual story generation triggered...");

        const story = await generateDailyStory();

        res.status(200).json({
            success: true,
            message: "Story and all images generated successfully!",
            story
        });

    } catch (error) {
        console.error("DETAILED ERROR:", error);
        res.status(500).json({
            error: "Failed to generate story",
            details: error.message
        });
    }
};

// Synchronous function to generate ALL images for a single story
// Throws error if ANY image generation fails
async function generateImagesForStory(storyData) {
    console.log(`🎨 Generating images for story: ${storyData.title} (${storyData.panels.length} panels)`);

    try {
        // Generate temporary ID for filename (since story not saved yet)
        const tempId = `temp-${Date.now()}`;

        // Generate cover image (first panel) - MUST succeed
        const coverPanel = storyData.panels[0];
        console.log(`  📸 Generating cover image for panel 1...`);
        const coverImageUrl = await generateAndUploadImage(
            coverPanel.text,
            storyData.emotional_core,
            `story-${tempId}-cover`
        );

        storyData.coverImage = coverImageUrl;
        storyData.panels[0].imageUrl = coverImageUrl;
        console.log(`  ✅ Cover image generated`);
        console.log(`  ⏳ Cooling down for 10 seconds before next panel...`);
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Generate images for remaining panels - ALL must succeed
        for (let i = 1; i < storyData.panels.length; i++) {
            const panel = storyData.panels[i];
            console.log(`  📸 Generating image for panel ${panel.panel_number}...`);

            const imageUrl = await generateAndUploadImage(
                panel.text,
                storyData.emotional_core,
                `story-${tempId}-panel-${panel.panel_number}`
            );

            storyData.panels[i].imageUrl = imageUrl;
            console.log(`  ✅ Panel ${panel.panel_number} image generated`);

            // Delay between panel generations (skip delay for last panel)
            if (i < storyData.panels.length - 1) {
                console.log(`  ⏳ Cooling down for 10 seconds before next panel...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        console.log(`🎉 All ${storyData.panels.length} images generated successfully!`);
        return storyData;

    } catch (error) {
        console.error(`❌ CRITICAL: Image generation failed for story ${storyData.title}:`, error.message);
        throw new Error(`Image generation failed: ${error.message}`);
    }
}

// Helper function to generate image with Kandinsky-2.2 (Replicate) and upload to Storj
async function generateAndUploadImage(panelText, emotionalCore, filename, retryCount = 0) {
    const MAX_RETRIES = 3;

    try {
        console.log(`  🎨 Generating AI image with Kandinsky-2.2 via Replicate SDK...`);

        if (!process.env.REPLICATE_API_TOKEN) {
            console.error(`  ❌ REPLICATE_API_TOKEN not found in environment variables`);
            throw new Error("Missing REPLICATE_API_TOKEN");
        }

        // Create the enhanced prompt for Kandinsky-2.2
        const prompt = `Cinematic illustrated scene: ${panelText}. 
        
Style: painterly digital art, soft film grain, natural lighting, shallow depth of field, emotionally expressive, muted cinematic tones reflecting ${emotionalCore}. 

Realistic and grounded, masterpiece quality, 8k, highly detailed, no text, no logos, no watermarks.`;

        try {
            console.log(`  🚀 Starting Kandinsky-2.2 generation...`);

            // Use Replicate SDK - much simpler than manual API calls!
            const output = await replicate.run(
                "ai-forever/kandinsky-2.2:ad9d7879fbffa2874e1d909d1d37d9bc682889cc65b31f7bb00d2362619f194a",
                {
                    input: {
                        prompt: prompt,
                        width: 768,
                        height: 1024, // 9:16 portrait aspect ratio
                        num_inference_steps: 50
                    }
                }
            );

            // Replicate returns a ReadableStream for Kandinsky-2.2
            console.log(`  🔍 DEBUG: Full output:`, JSON.stringify(output, null, 2));
            const imageStream = output[0];
            console.log(`  🔍 DEBUG: Type of output[0]:`, typeof imageStream);
            console.log(`  🔍 DEBUG: Value of output[0]:`, imageStream);

            if (!imageStream) {
                throw new Error("No image stream returned from Kandinsky-2.2");
            }

            console.log(`  ✅ Image generated successfully!`);

            // Kandinsky-2.2 returns a ReadableStream - we need to convert it to a buffer
            console.log(`  📥 Reading image stream...`);

            // Convert ReadableStream to Buffer
            const chunks = [];
            const reader = imageStream.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }

                const imageBuffer = Buffer.concat(chunks);
                console.log(`  ✅ Stream read complete. Image size: ${imageBuffer.length} bytes`);

                // Upload to Storj
                console.log(`  ☁️  Uploading to Storj...`);
                const storjUrl = await uploadToStorj(
                    imageBuffer,
                    `stories/${filename}.png`,
                    'image/png'
                );
                console.log(`  ✅ Uploaded to Storj: ${storjUrl.substring(0, 60)}...`);

                return storjUrl;
            } finally {
                reader.releaseLock();
            }

        } catch (kandinskryError) {
            // Check if it's a rate limit or temporary error worth retrying
            if (retryCount < MAX_RETRIES && (
                kandinskryError.message?.includes('rate limit') ||
                kandinskryError.message?.includes('timeout') ||
                kandinskryError.response?.status >= 500
            )) {
                const waitSeconds = 5 + (retryCount * 5); // 5s, 10s, 15s
                console.log(`  ⏳ Retryable error. Waiting ${waitSeconds}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
                await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));

                // Retry
                return await generateAndUploadImage(panelText, emotionalCore, filename, retryCount + 1);
            }

            console.error(`  ❌ Kandinsky-2.2 error: ${kandinskryError.message}`);
            if (kandinskryError.response) {
                console.error(`  📋 Status: ${kandinskryError.response.status}`);
                console.error(`  📋 Response:`, kandinskryError.response.data);
            }

            // No fallback - throw the error so we can see what went wrong
            throw kandinskryError;
        }

    } catch (error) {
        console.error(`  ❌ Error generating image for ${filename}:`, error.message);
        console.error(`  ❌ Full error:`, error);
        // Throw error instead of returning null to fail fast
        throw new Error(`Failed to generate image for ${filename}: ${error.message}`);
    }
}

// Mark expired stories (called by cron job)
const markExpiredStories = async () => {
    try {
        const now = new Date();
        const result = await Story.updateMany(
            {
                expiresAt: { $lt: now },
                isExpired: false
            },
            {
                $set: { isExpired: true }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`⏰ Marked ${result.modifiedCount} stories as expired`);
        }
    } catch (error) {
        console.error("❌ Error marking expired stories:", error);
    }
};

// Delete old stories (called by cron job)
const deleteOldStories = async () => {
    try {
        const now = new Date();
        const storiesToDelete = await Story.find({
            deletesAt: { $lt: now }
        });

        if (storiesToDelete.length === 0) {
            console.log("✅ No stories to delete");
            return;
        }

        console.log(`🗑️  Deleting ${storiesToDelete.length} old stories...`);

        // TODO: Delete associated images from Storj here
        // You may want to add a function to delete images based on story IDs

        await Story.deleteMany({
            deletesAt: { $lt: now }
        });

        console.log(`✅ Deleted ${storiesToDelete.length} stories permanently`);
    } catch (error) {
        console.error("❌ Error deleting old stories:", error);
    }
};

// Get all stories (with lifecycle status)
const getAllStories = async (req, res) => {
    try {
        const stories = await Story.find({})
            .sort({ createdAt: -1 })
            .select('_id story_number title emotional_core panels coverImage views likes createdAt expiresAt isExpired');

        // Add lifecycle status to each story
        const now = new Date();
        const storiesWithStatus = stories.map(story => {
            const storyObj = story.toObject();

            // Handle old stories without lifecycle fields
            if (!storyObj.expiresAt) {
                return {
                    ...storyObj,
                    status: 'active',
                    daysRemaining: null // Old story, no expiry
                };
            }

            const isExpired = story.isExpired;
            const daysRemaining = isExpired ? 0 : Math.ceil((story.expiresAt - now) / (1000 * 60 * 60 * 24));

            return {
                ...storyObj,
                status: isExpired ? 'expired' : 'active',
                daysRemaining
            };
        });

        res.status(200).json({ stories: storiesWithStatus });
    } catch (error) {
        console.error("Error fetching stories:", error);
        res.status(500).json({ error: "Failed to fetch stories" });
    }
};

// Get single story by ID (with lifecycle check)
const getStoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Check if story is expired (only for stories with lifecycle fields)
        if (story.isExpired && story.expiresAt) {
            return res.status(403).json({
                error: "This Ritual has passed, You missed it",
                isExpired: true
            });
        }

        // Increment view count
        story.views += 1;
        await story.save();

        const now = new Date();
        const storyObj = story.toObject();

        // Handle old stories without lifecycle fields
        let storyWithStatus;
        if (!storyObj.expiresAt) {
            storyWithStatus = {
                ...storyObj,
                status: 'active',
                daysRemaining: null // Old story, no expiry
            };
        } else {
            storyWithStatus = {
                ...storyObj,
                status: 'active',
                daysRemaining: Math.ceil((story.expiresAt - now) / (1000 * 60 * 60 * 24))
            };
        }

        res.status(200).json({ story: storyWithStatus });
    } catch (error) {
        console.error("Error fetching story:", error);
        res.status(500).json({ error: "Failed to fetch story" });
    }
};

// Delete a single story by ID
const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Import AnyaPageVisit model for deleting related visits
        const AnyaPageVisit = require('../models/AnyaPageVisit');

        // Delete all page visit records related to this story
        await AnyaPageVisit.deleteMany({ storyId: id });
        console.log(`✅ Deleted page visit records for story ${id}`);

        // TODO: Delete associated images from Storj here
        // You may want to add logic to remove images based on story ID

        // Delete the story document (this automatically deletes embedded likes, comments, and views)
        await Story.findByIdAndDelete(id);
        console.log(`✅ Deleted story ${id}: ${story.title}`);

        res.status(200).json({
            ok: true,
            message: "Story and all related data deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting story:", error);
        res.status(500).json({
            ok: false,
            error: "Failed to delete story"
        });
    }
};

// Delete all stories (for testing)
const deleteAllStories = async (req, res) => {
    try {
        await Story.deleteMany({});
        res.status(200).json({ message: "All stories deleted" });
    } catch (error) {
        console.error("Error deleting stories:", error);
        res.status(500).json({ error: "Failed to delete stories" });
    }
};

// Like/Unlike a story
const likeStory = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Check if story is expired
        if (story.isExpired) {
            return res.status(403).json({
                error: "This Ritual has passed, You missed it",
                isExpired: true
            });
        }

        // Check if user already liked
        const likedIndex = story.likedBy.indexOf(userId);

        if (likedIndex > -1) {
            // Unlike
            story.likedBy.splice(likedIndex, 1);
            story.likes = Math.max(0, story.likes - 1);
        } else {
            // Like
            story.likedBy.push(userId);
            story.likes += 1;
        }

        await story.save();

        res.status(200).json({
            success: true,
            liked: likedIndex === -1,
            likes: story.likes,
            likedBy: story.likedBy
        });
    } catch (error) {
        console.error("Error liking story:", error);
        res.status(500).json({ error: "Failed to like story" });
    }
};

// Add comment to a story
const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, username, text } = req.body;

        if (!userId || !username || !text) {
            return res.status(400).json({ error: "userId, username, and text are required" });
        }

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Check if story is expired
        if (story.isExpired) {
            return res.status(403).json({
                error: "This Ritual has passed, You missed it",
                isExpired: true
            });
        }

        const comment = {
            userId,
            username,
            text,
            createdAt: new Date()
        };

        story.comments.push(comment);
        await story.save();

        res.status(200).json({
            success: true,
            comment,
            totalComments: story.comments.length
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

// Get next story
const getNextStory = async (req, res) => {
    try {
        const { id } = req.params;

        const currentStory = await Story.findById(id);

        if (!currentStory) {
            return res.status(404).json({ error: "Current story not found" });
        }

        // Find the next story by story_number (ascending)
        // Ensure it's not the same story/ID
        const nextStory = await Story.findOne({
            story_number: { $gt: currentStory.story_number },
            _id: { $ne: currentStory._id }
        }).sort({ story_number: 1 }); // Get the immediate next one

        // If no next story found by number (maybe end of cycle), try to find the very first story (loop back) 
        // OR handle based on requirements. For now, we will return null if no newer story exists.
        // Or we could check for created later date.

        // Simpler approach: Just find the story created immediately after this one
        /*
        const nextStory = await Story.findOne({
            createdAt: { $gt: currentStory.createdAt }
        }).sort({ createdAt: 1 });
        */

        if (!nextStory) {
            // Loop back to the very first story if no next story exists
            const firstStory = await Story.findOne({}).sort({ story_number: 1 });
            if (firstStory && firstStory._id.toString() !== currentStory._id.toString()) {
                return res.status(200).json({ nextStory: firstStory });
            }
            return res.status(200).json({ nextStory: null, message: "No next story available" });
        }

        // Check if next story is expired? (Usually next story is newer, so less likely to be expired unless user is viewing very old story)
        // But let's check standard logic
        if (nextStory.isExpired && nextStory.expiresAt) {
            // If expired, maybe we shouldn't recommend it? Or warn?
            // For now, let's return it but maybe UI handles it.
            // Or maybe we skip expired stories?
            // Let's return it for now.
        }

        res.status(200).json({ nextStory });

    } catch (error) {
        console.error("Error getting next story:", error);
        res.status(500).json({ error: "Failed to get next story" });
    }
};


module.exports = {
    generateAndSaveStories,
    generateDailyStory,
    markExpiredStories,
    deleteOldStories,
    getAllStories,
    getStoryById,
    getNextStory,
    deleteStory,
    deleteAllStories,
    likeStory,
    addComment
};
