const Mux = require('@mux/mux-node');
const postdb = require('../../Creators/post');

// Initialize Mux client
let muxClient = null;

try {
    if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
        muxClient = new Mux({
            tokenId: process.env.MUX_TOKEN_ID,
            tokenSecret: process.env.MUX_TOKEN_SECRET,
        });
    }
} catch (error) {
    console.error('❌ Error initializing Mux:', error.message);
}

/**
 * Check Mux asset status and update playbackId when ready
 * This runs periodically to poll for asset readiness
 */
const checkAndUpdateMuxAssets = async () => {
    if (!muxClient) {
        return;
    }

    try {
        // Find all posts with assetId but no playbackId (still processing)
        const processingPosts = await postdb.find({
            assetId: { $exists: true, $ne: null, $ne: '' },
            $or: [
                { playbackId: { $exists: false } },
                { playbackId: null },
                { playbackId: '' }
            ]
        }).limit(50); // Limit to avoid overloading

        if (processingPosts.length === 0) {
            return;
        }

        console.log(`🔍 Checking ${processingPosts.length} processing Mux assets...`);

        for (const post of processingPosts) {
            try {
                // Get asset status from Mux
                const asset = await muxClient.video.assets.retrieve(post.assetId);

                if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
                    // Asset is ready! Update the post with playbackId
                    await postdb.findByIdAndUpdate(
                        post._id,
                        { playbackId: asset.playback_ids[0].id },
                        { new: true }
                    );

                    console.log(`✅ Updated post ${post._id} with playbackId: ${asset.playback_ids[0].id}`);
                } else if (asset.status === 'errored') {
                    // Asset failed, remove the assetId
                    await postdb.findByIdAndUpdate(
                        post._id,
                        { $unset: { assetId: 1 } },
                        { new: true }
                    );

                    console.warn(`⚠️ Asset ${post.assetId} failed, removed from post ${post._id}`);
                }
                // If status is still 'preparing', do nothing and check again later

            } catch (error) {
                console.error(`Error checking asset ${post.assetId}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error in checkAndUpdateMuxAssets:', error.message);
    }
};

module.exports = checkAndUpdateMuxAssets;
