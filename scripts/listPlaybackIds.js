/**
 * Script to check and list posts with playbackIds
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../Creators/post');

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.DB || process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko');
        console.log('Connected!');

        const posts = await Post.find({
            playbackId: { $exists: true, $ne: null, $ne: '' }
        }).select('_id playbackId postfilelink');

        console.log('\nPosts with playbackId:', posts.length);

        for (const post of posts) {
            console.log(`\nPost: ${post._id}`);
            console.log(`  playbackId: ${post.playbackId}`);
            console.log(`  postfilelink: ${post.postfilelink ? 'yes' : 'no'}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

main();
