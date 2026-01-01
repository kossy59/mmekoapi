/**
 * Simple script to list all posts that have playbackId or assetId
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function listPlaybackIds() {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }), 'posts');

        const posts = await Post.find({
            $or: [
                { playbackId: { $exists: true } },
                { assetId: { $exists: true } }
            ]
        }).select('_id playbackId assetId postfilelink').limit(20);

        console.log(`Found ${posts.length} posts with Mux data:\n`);

        posts.forEach((post, i) => {
            console.log(`${i + 1}. Post ID: ${post._id}`);
            console.log(`   PlaybackID: ${post.playbackId || 'none'}`);
            console.log(`   AssetID: ${post.assetId || 'none'}`);
            console.log(`   Video: ${post.postfilelink || 'none'}\n`);
        });

        await mongoose.disconnect();
        console.log('Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listPlaybackIds();
