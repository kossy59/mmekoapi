/**
 * Find and remove specific playbackId from database
 */

require('dotenv').config();
const mongoose = require('mongoose');

const PLAYBACK_ID = 'ikN02XAYGpWCEiK4sb22YLdQDtqKOMcQ4Wv1a8yTZ8Mw';

async function findAndRemove() {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        // Use generic schema to avoid field restrictions
        const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }), 'posts');

        // Find the specific post
        console.log(`🔍 Searching for playbackId: ${PLAYBACK_ID}\n`);

        const post = await Post.findOne({ playbackId: PLAYBACK_ID });

        if (post) {
            console.log('✅ Found post:');
            console.log(`   Post ID: ${post._id}`);
            console.log(`   PlaybackID: ${post.playbackId}`);
            console.log(`   AssetID: ${post.assetId || 'none'}`);
            console.log(`   Video URL: ${post.postfilelink}\n`);

            // Remove the playbackId
            await Post.updateOne(
                { _id: post._id },
                { $unset: { playbackId: 1, assetId: 1 } }
            );

            console.log('✅ Removed playbackId and assetId from post\n');

            // Verify
            const updated = await Post.findById(post._id);
            console.log('📊 Verification:');
            console.log(`   PlaybackID exists: ${!!updated.playbackId}`);
            console.log(`   AssetID exists: ${!!updated.assetId}`);

        } else {
            console.log('❌ No post found with that playbackId');
            console.log('\n🔍 Checking all posts with ANY playbackId...\n');

            const allWithPlayback = await Post.find({
                playbackId: { $exists: true, $ne: null, $ne: '' }
            }).select('_id playbackId').limit(10);

            console.log(`Found ${allWithPlayback.length} posts with playbackIds:`);
            allWithPlayback.forEach(p => {
                console.log(`   ${p._id}: ${p.playbackId}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n📡 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

findAndRemove();
