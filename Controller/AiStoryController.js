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

// Story configuration mapping (5-day cycle)
const STORY_CONFIGS = {
    1: { type: "Underdog vs System", emotion: "Anger", perspective: "First person" },
    2: { type: "Hidden Truth / Insider Revelation", emotion: "Hope", perspective: "Second person" },
    3: { type: "Transformation (Before → After)", emotion: "Betrayal", perspective: "Third person" },
    4: { type: "Moral Conflict / Choice", emotion: "Relief", perspective: "Observer" },
    5: { type: "Builder's Journey / Sacrifice", emotion: "Quiet Confidence", perspective: "Confessional" }
};

// Helper: Calculate day index based on days since launch
function getDayIndex() {
    const now = new Date();
    const daysSinceLaunch = Math.floor((now - LAUNCH_DATE) / (1000 * 60 * 60 * 24));
    return (daysSinceLaunch % 5) + 1;
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
    try {
        console.log("🌅 Starting automatic daily story generation...");

        const config = getTodayStoryConfig();
        console.log(`📅 Day Index: ${config.dayIndex} | Type: ${config.type} | Emotion: ${config.emotion}`);

        // Check if today's story already exists
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingStory = await Story.findOne({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        if (existingStory) {
            console.log("✅ Today's story already exists. Skipping generation.");
            return existingStory;
        }

        // Generate story with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are a story engine creating short-form, addictive social rituals.

        TODAY'S STORY SLOT:
        Story Number: ${config.dayIndex}

        Use the following mapping strictly:

        1 → Underdog vs System | Anger | First person  
        2 → Hidden Truth / Insider Revelation | Hope | Second person  
        3 → Transformation (Before → After) | Betrayal | Third person  
        4 → Moral Conflict / Choice | Relief | Observer  
        5 → Builder's Journey / Sacrifice | Quiet Confidence | Confessional  

        TASK:
        Generate ONE complete storyline for story slot ${config.dayIndex}.

        REQUIREMENTS:
        - Title: EXACTLY 4 words
        - EXACTLY 15 panels
        - Each panel is ONE short sentence (max 12 words)
        - Panels must be sequential and cinematic
        - Emotional core: ${config.emotion}
        - Perspective: ${config.perspective}
        - Story type: ${config.type}

        GLOBAL RULES:
        - No reused characters, plots, or endings across days
        - No repeated phrases
        - No brand names
        - No explicit sexual language
        - No motivational clichés
        - No calls to action

        OUTPUT FORMAT (STRICT JSON):
        {
          "story_number": ${config.dayIndex},
          "title": "",
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

        console.log(`✅ Generated story: ${storyData.title} (${storyData.panels.length} panels)`);

        // Calculate lifecycle dates
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days
        const deletesAt = new Date(now);
        deletesAt.setDate(deletesAt.getDate() + 60); // Deletes in 60 days

        // Save story to database
        const story = new Story({
            story_number: storyData.story_number,
            title: storyData.title,
            emotional_core: storyData.emotional_core,
            panels: storyData.panels.map(p => ({
                panel_number: p.panel_number,
                text: p.text,
                imageUrl: null
            })),
            launchDate: now,
            expiresAt: expiresAt,
            deletesAt: deletesAt,
            isExpired: false
        });

        const savedStory = await story.save();
        console.log(`💾 Saved story ${storyData.story_number}: ${storyData.title}`);

        // Generate images in background
        generateImagesForStories([savedStory]).catch(err => {
            console.error("Error generating images:", err);
        });

        return savedStory;

    } catch (error) {
        console.error("❌ DETAILED ERROR in generateDailyStory:", error);
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
            message: "Story generated and saved. Images are being generated in background.",
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

// Background function to generate images
async function generateImagesForStories(stories) {
    console.log(`🎨 Starting image generation for ${stories.length} stories...`);

    for (const story of stories) {
        console.log(`🎨 Generating images for story: ${story.title} (${story.panels.length} panels)`);

        try {
            // Generate cover image (first panel)
            const coverPanel = story.panels[0];
            console.log(`  📸 Generating cover image for panel 1...`);
            const coverImageUrl = await generateAndUploadImage(
                coverPanel.text,
                story.emotional_core,
                `story-${story._id}-cover`
            );

            if (coverImageUrl) {
                story.coverImage = coverImageUrl;
                story.panels[0].imageUrl = coverImageUrl;
                console.log(`  ✅ Cover image generated`);
                console.log(`  ⏳ Cooling down for 10 seconds before next panel...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            // Generate images for remaining panels
            for (let i = 1; i < story.panels.length; i++) {
                const panel = story.panels[i];
                console.log(`  📸 Generating image for panel ${panel.panel_number}...`);

                const imageUrl = await generateAndUploadImage(
                    panel.text,
                    story.emotional_core,
                    `story-${story._id}-panel-${panel.panel_number}`
                );

                if (imageUrl) {
                    story.panels[i].imageUrl = imageUrl;
                    console.log(`  ✅ Panel ${panel.panel_number} image generated`);
                }

                // Delay between panel generations
                console.log(`  ⏳ Cooling down for 10 seconds before next panel...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            await story.save();
            console.log(`✅ Completed all images for story: ${story.title}`);

        } catch (error) {
            console.error(`❌ Error generating images for story ${story.title}:`, error.message);
        }
    }

    console.log(`🎉 Image generation complete for all stories!`);
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
        return null;
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
        const stories = await Story.find({ isPublished: true })
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

            return {
                ...storyObj,
                status: story.isExpired ? 'expired' : 'active',
                daysRemaining: story.isExpired ? 0 : Math.ceil((story.expiresAt - now) / (1000 * 60 * 60 * 24))
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

module.exports = {
    generateAndSaveStories,
    generateDailyStory,
    markExpiredStories,
    deleteOldStories,
    getAllStories,
    getStoryById,
    deleteAllStories,
    likeStory,
    addComment
};
