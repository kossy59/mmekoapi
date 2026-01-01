/**
 * Script to forcefully clear ALL Mux playbackIds from posts
 * This is a one-time cleanup to remove all existing playbackIds
 * New uploads will create fresh Mux assets automatically
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../Creators/post');

async function clearAllPlaybackIds() {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find ALL posts with playbackId (even if assetId doesn't exist)
        const result = await Post.updateMany(
            {
                $or: [
                    { playbackId: { $exists: true, $ne: null, $ne: '' } },
                    { assetId: { $exists: true, $ne: null, $ne: '' } }
                ]
            },
            {
                $unset: { playbackId: 1, assetId: 1 }
            }
        );

        console.log(`✅ Cleared ${result.modifiedCount} posts with Mux data\n`);

        // Verify - count remaining posts with playbackId
        const remaining = await Post.countDocuments({
            $or: [
                { playbackId: { $exists: true, $ne: null, $ne: '' } },
                { assetId: { $exists: true, $ne: null, $ne: '' } }
            ]
        });

        console.log(`📊 Verification:`);
        console.log(`   Posts still with Mux data: ${remaining}`);

        if (remaining > 0) {
            console.log(`\n⚠️ Warning: ${remaining} posts still have Mux data. Manual investigation needed.`);
        } else {
            console.log(`\n🎉 Success! All playbackIds cleared. Videos will use original source.`);
        }

        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

clearAllPlaybackIds();
