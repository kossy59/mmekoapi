/**
 * Direct MongoDB cleanup - removes ALL playbackIds from all posts
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../Creators/post');

async function cleanupAll() {
    try {
        const mongoUri = process.env.DB || process.env.MONGODB_URI || process.env.MONGO_URI;
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected\n');

        // First, let's see what we have
        const postsWithPlayback = await Post.find({
            $or: [
                { playbackId: { $exists: true, $ne: null, $ne: '' } },
                { assetId: { $exists: true, $ne: null, $ne: '' } }
            ]
        }).select('_id playbackId assetId postfilelink').limit(20);

        console.log(`📊 Found ${postsWithPlayback.length} posts with Mux data:\n`);

        postsWithPlayback.forEach((post, i) => {
            console.log(`${i + 1}. Post ID: ${post._id}`);
            if (post.playbackId) console.log(`   PlaybackID: ${post.playbackId}`);
            if (post.assetId) console.log(`   AssetID: ${post.assetId}`);
            console.log(`   Video: ${post.postfilelink || 'none'}\n`);
        });

        // Now remove all playback IDs
        console.log('🧹 Removing all playbackIds and assetIds...\n');

        const result = await Post.updateMany(
            {
                $or: [
                    { playbackId: { $exists: true } },
                    { assetId: { $exists: true } }
                ]
            },
            {
                $unset: { playbackId: '', assetId: '' }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} posts\n`);

        // Verify cleanup
        const remaining = await Post.countDocuments({
            $or: [
                { playbackId: { $exists: true, $ne: null, $ne: '' } },
                { assetId: { $exists: true, $ne: null, $ne: '' } }
            ]
        });

        console.log(`📊 Verification: ${remaining} posts still have Mux data`);

        if (remaining === 0) {
            console.log('\n🎉 Success! All playbackIds removed from database.');
            console.log('   Refresh your browser to see videos using original source.');
        }

        await mongoose.disconnect();
        console.log('\n📡 Disconnected');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

cleanupAll();
