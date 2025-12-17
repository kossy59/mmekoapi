const postdb = require("../../Creators/post");

const updatePlaybackId = async (req, res) => {
    try {
        const { postId, playbackId, assetId } = req.body;

        if (!postId || !playbackId) {
            return res.status(400).json({ ok: false, message: "Missing required fields" });
        }

        const post = await postdb.findByIdAndUpdate(
            postId,
            {
                playbackId: playbackId,
                assetId: assetId
            },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ ok: false, message: "Post not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "Playback ID updated successfully",
            post
        });

    } catch (error) {
        console.error("Error updating playback ID:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = updatePlaybackId;
