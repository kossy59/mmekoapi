/**
 * Script to clear broken/invalid Mux playbackIds from posts
 * 
 * Usage: node scripts/clearBrokenPlaybackIds.js
 * 
 * This script checks each post with a playbackId and verifies if the Mux asset
 * is still valid. If not, it clears the playbackId so the video will use the
 * fallback player instead.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Use the existing Post model from the project
const Post = require('../Creators/post');

async function checkMuxAsset(playbackId) {
    try {
        // Try to get the asset info from Mux
        // If the asset is invalid, this will throw an error
        const response = await fetch(`https://stream.mux.com/${playbackId}.m3u8?redundant_streams=true`, {
            method: 'HEAD'
        });

        // 412 means "Precondition Failed" - asset not ready or doesn't exist
        if (response.status === 412) {
            return false;
        }

        // 200 or other success means the asset is valid
        return response.ok;
    } catch (error) {
        console.error(`Error checking playbackId ${playbackId}:`, error.message);
        return false;
    }
}

async function main() {
    try {
        // Connect to MongoDB - use DB as primary (same as main app)
        const mongoUri = process.env.DB || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mmeko';
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all posts with playbackIds
        const postsWithPlaybackId = await Post.find({
            playbackId: { $exists: true, $ne: null, $ne: '' }
        });

        console.log(`\n📊 Found ${postsWithPlaybackId.length} posts with playbackIds\n`);

        let validCount = 0;
        let invalidCount = 0;

        for (const post of postsWithPlaybackId) {
            console.log(`Checking post ${post._id} with playbackId: ${post.playbackId}`);

            const isValid = await checkMuxAsset(post.playbackId);

            if (isValid) {
                console.log(`  ✅ Valid`);
                validCount++;
            } else {
                console.log(`  ❌ Invalid - clearing playbackId`);
                invalidCount++;

                // Clear the broken playbackId
                await Post.updateOne(
                    { _id: post._id },
                    { $unset: { playbackId: 1, assetId: 1 } }
                );
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('\n📊 Summary:');
        console.log(`  Valid playbackIds: ${validCount}`);
        console.log(`  Invalid playbackIds cleared: ${invalidCount}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

main();
