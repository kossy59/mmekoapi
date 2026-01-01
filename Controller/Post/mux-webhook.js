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
    console.error('Error initializing Mux for webhook:', error.message);
}

/**
 * Webhook handler for Mux asset status updates
 * Called by Mux when video processing is complete
 */
const muxWebhook = async (req, res) => {
    try {
        const event = req.body;

        console.log('📬 Mux webhook received:', event.type);

        // Handle video.asset.ready event
        if (event.type === 'video.asset.ready') {
            const assetId = event.data?.id;
            const playbackIds = event.data?.playback_ids || [];

            if (!assetId) {
                console.error('No asset ID in webhook payload');
                return res.status(400).json({ ok: false, message: 'Missing asset ID' });
            }

            console.log(`✅ Asset ${assetId} is ready`);
            console.log(`   Playback IDs:`, playbackIds.map(p => p.id));

            // Find post by asset ID and update with playback ID
            const playbackId = playbackIds[0]?.id;
            if (playbackId) {
                const post = await postdb.findOneAndUpdate(
                    { assetId: assetId },
                    { playbackId: playbackId },
                    { new: true }
                );

                if (post) {
                    console.log(`✅ Updated post ${post._id} with playback ID: ${playbackId}`);
                } else {
                    console.warn(`⚠️ No post found with assetId: ${assetId}`);
                }
            }
        }

        // Handle video.asset.errored event
        if (event.type === 'video.asset.errored') {
            const assetId = event.data?.id;
            const errors = event.data?.errors || [];

            console.error(`❌ Asset ${assetId} processing failed:`, errors);

            // Clear the asset ID from the post so it falls back to original video
            await postdb.findOneAndUpdate(
                { assetId: assetId },
                { $unset: { assetId: 1 } },
                { new: true }
            );

            console.log(`🔄 Cleared asset ID for failed processing, post will use original video`);
        }

        // Always return 200 to acknowledge receipt
        return res.status(200).json({ ok: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('Error processing Mux webhook:', error);
        // Still return 200 to avoid Mux retrying
        return res.status(200).json({ ok: false, message: error.message });
    }
};

module.exports = muxWebhook;
