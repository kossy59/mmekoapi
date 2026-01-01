/**
 * Quick check: Find posts with playbackId and show their status
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../Creators/post');

async function checkPlaybackIds() {
    try {
        const mongoUri = process.env.DB || process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);

        const posts = await Post.find({
            playbackId: { $exists: true, $ne: null, $ne: '' }
        }).select('_id playbackId assetId postfilelink createdAt').sort({ createdAt: -1 }).limit(5);

        console.log(`\n📊 Found ${posts.length} posts with playbackIds:\n`);

        posts.forEach((post, i) => {
            console.log(`${i + 1}. Post: ${post._id}`);
            console.log(`   PlaybackID: ${post.playbackId}`);
            console.log(`   Created: ${post.createdAt || 'unknown'}\n`);
        });

        if (posts.length > 0) {
            console.log('⚠️ These playbackIds should NOT exist if they were uploaded recently!');
            console.log('   Run cleanup script to remove them.\n');
        } else {
            console.log('✅ No playbackIds found - system is clean!\n');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkPlaybackIds();
