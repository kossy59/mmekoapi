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
        console.log('✅ Mux configured successfully');
    } else {
        console.warn('⚠️ Mux credentials not found. Video optimization will be disabled.');
    }
} catch (error) {
    console.error('❌ Error initializing Mux:', error.message);
}

/**
 * Create a Mux asset from a video URL
 * This is called asynchronously after video upload
 */
const createMuxAsset = async (req, res) => {
    try {
        const { postId, videoUrl } = req.body;

        if (!postId || !videoUrl) {
            return res.status(400).json({
                ok: false,
                message: 'Missing required fields: postId and videoUrl'
            });
        }

        // Check if Mux is configured
        if (!muxClient) {
            console.warn('Mux not configured, skipping asset creation');
            return res.status(200).json({
                ok: true,
                message: 'Mux not configured, video will use original source',
                useFallback: true
            });
        }

        // Find the post
        const post = await postdb.findById(postId);
        if (!post) {
            return res.status(404).json({ ok: false, message: 'Post not found' });
        }

        console.log(`🎬 Creating Mux asset for post ${postId}`);
        console.log(`   Video URL: ${videoUrl}`);

        // Create Mux asset
        const asset = await muxClient.video.assets.create({
            input: [{
                url: videoUrl
            }],
            playback_policy: ['public'],
        });

        console.log(`✅ Mux asset created: ${asset.id}`);
        console.log(`   Playback ID: ${asset.playback_ids[0].id}`);
        console.log(`   Status: ${asset.status}`);

        // Update post with Mux details (only if asset is ready)
        // Otherwise, webhook will update it when ready
        if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
            await postdb.findByIdAndUpdate(
                postId,
                {
                    playbackId: asset.playback_ids[0].id,
                    assetId: asset.id,
                },
                { new: true }
            );
            console.log(`✅ Post updated with playback ID immediately`);
        } else {
            // Store asset ID for webhook to update later
            await postdb.findByIdAndUpdate(
                postId,
                { assetId: asset.id },
                { new: true }
            );
            console.log(`⏳ Asset processing, webhook will update playback ID when ready`);
        }

        return res.status(200).json({
            ok: true,
            message: 'Mux asset creation initiated',
            assetId: asset.id,
            playbackId: asset.playback_ids?.[0]?.id || null,
            status: asset.status
        });

    } catch (error) {
        console.error('❌ Error creating Mux asset:', error);
        return res.status(500).json({
            ok: false,
            message: error.message || 'Failed to create Mux asset',
            useFallback: true // Tell frontend to use original video
        });
    }
};

module.exports = createMuxAsset;
