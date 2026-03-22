const CreatorRitual = require('../models/CreatorRitual');
const { uploadToStorj } = require('../utiils/storjUpload');

async function markExpiredRituals() {
    try {
        await CreatorRitual.updateMany(
            { expiresAt: { $lt: new Date() }, isExpired: false },
            { $set: { isExpired: true } }
        );
    } catch (err) {
        console.error('[CreatorRitual] markExpiredRituals error:', err.message);
    }
}

// Accepts: multipart/form-data
//   - userId        (string)
//   - title         (string, max 60 chars)
//   - song          (string, optional — library id or filename)
//   - panel_1_image … panel_15_image  (file fields)
//   - panel_1_subtitle … panel_15_subtitle (string fields)
const uploadRitual = async (req, res) => {
    try {
        const userId = req.body.userId || req.body.userid || '';
        const { title, song } = req.body;

        if (!userId || !userId.trim()) {
            console.error('[CreatorRitual] Missing userId. Body keys:', Object.keys(req.body));
            return res.status(400).json({ ok: false, message: 'userId is required — make sure you are logged in' });
        }
        if (!title || !title.trim()) {
            return res.status(400).json({ ok: false, message: 'title is required' });
        }

        const files = req.files || {};
        const missingPanels = [];
        for (let i = 1; i <= 15; i++) {
            if (!files[`panel_${i}_image`] || !files[`panel_${i}_image`][0]) {
                missingPanels.push(i);
            }
        }
        if (missingPanels.length > 0) {
            return res.status(400).json({
                ok: false,
                message: `Missing images for panels: ${missingPanels.join(', ')}`
            });
        }

        console.log(`📸 [CreatorRitual] Uploading 15 panel images for user ${userId}...`);
        const timestamp = Date.now();

        const uploadPromises = [];
        for (let i = 1; i <= 15; i++) {
            const file = files[`panel_${i}_image`][0];
            const filename = `creator-rituals/${userId}/${timestamp}-panel-${i}.${file.originalname.split('.').pop() || 'jpg'}`;
            uploadPromises.push(
                uploadToStorj(file.buffer, filename, file.mimetype)
                    .then(url => ({ panel_number: i, imageUrl: url }))
            );
        }

        const uploadedPanels = await Promise.all(uploadPromises);
        console.log(`✅ [CreatorRitual] All 15 images uploaded`);

        const panels = uploadedPanels
            .sort((a, b) => a.panel_number - b.panel_number)
            .map(({ panel_number, imageUrl }) => ({
                panel_number,
                imageUrl,
                subtitle: (req.body[`panel_${panel_number}_subtitle`] || '').trim()
            }));

        let songUrl = song || null;
        if (files['audioFile'] && files['audioFile'][0]) {
            const audioFile = files['audioFile'][0];
            const audioFilename = `creator-rituals/${userId}/${timestamp}-audio.${audioFile.originalname.split('.').pop() || 'mp3'}`;
            songUrl = await uploadToStorj(audioFile.buffer, audioFilename, audioFile.mimetype);
            console.log(`🎵 [CreatorRitual] Audio uploaded: ${songUrl}`);
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

        const ritual = new CreatorRitual({
            userId,
            title: title.trim(),
            panels,
            coverImage: panels[0].imageUrl,
            song: songUrl,
            createdAt: now,
            expiresAt,
            isExpired: false
        });

        const saved = await ritual.save();
        console.log(`✅ [CreatorRitual] Saved ritual ${saved._id} for user ${userId}`);

        return res.status(201).json({
            ok: true,
            message: 'Ritual published successfully!',
            ritual: saved
        });

    } catch (err) {
        console.error('[CreatorRitual] uploadRitual error:', err);
        return res.status(500).json({ ok: false, message: err.message || 'Failed to publish ritual' });
    }
};

const getUserRituals = async (req, res) => {
    try {
        await markExpiredRituals();
        const { userId } = req.params;

        const rituals = await CreatorRitual.find({ userId, isExpired: false })
            .sort({ createdAt: -1 })
            .select('_id title coverImage panels likes views comments createdAt expiresAt song');

        return res.status(200).json({ ok: true, rituals });
    } catch (err) {
        console.error('[CreatorRitual] getUserRituals error:', err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const getArchivedRituals = async (req, res) => {
    try {
        await markExpiredRituals();
        const { userId } = req.params;

        const rituals = await CreatorRitual.find({ userId, isExpired: true })
            .sort({ createdAt: -1 })
            .select('_id title coverImage panels likes views comments createdAt expiresAt song');

        return res.status(200).json({ ok: true, rituals });
    } catch (err) {
        console.error('[CreatorRitual] getArchivedRituals error:', err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const getRitualById = async (req, res) => {
    try {
        await markExpiredRituals();
        const ritual = await CreatorRitual.findById(req.params.id);

        if (!ritual) {
            return res.status(404).json({ ok: false, message: 'Ritual not found' });
        }

        // Increment views
        ritual.views += 1;
        await ritual.save();

        return res.status(200).json({ ok: true, ritual });
    } catch (err) {
        console.error('[CreatorRitual] getRitualById error:', err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const likeRitual = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ ok: false, message: 'userId required' });

        const ritual = await CreatorRitual.findById(req.params.id);
        if (!ritual) return res.status(404).json({ ok: false, message: 'Ritual not found' });

        const alreadyLiked = ritual.likedBy.indexOf(userId);
        if (alreadyLiked > -1) {
            ritual.likedBy.splice(alreadyLiked, 1);
            ritual.likes = Math.max(0, ritual.likes - 1);
        } else {
            ritual.likedBy.push(userId);
            ritual.likes += 1;
        }

        await ritual.save();

        return res.status(200).json({
            ok: true,
            liked: alreadyLiked === -1,
            likes: ritual.likes
        });
    } catch (err) {
        console.error('[CreatorRitual] likeRitual error:', err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const addComment = async (req, res) => {
    try {
        const { userId, username, text } = req.body;
        if (!userId || !username || !text) {
            return res.status(400).json({ ok: false, message: 'userId, username, and text are required' });
        }

        const ritual = await CreatorRitual.findById(req.params.id);
        if (!ritual) return res.status(404).json({ ok: false, message: 'Ritual not found' });

        const comment = { userId, username, text, createdAt: new Date() };
        ritual.comments.push(comment);
        await ritual.save();

        return res.status(200).json({
            ok: true,
            comment,
            totalComments: ritual.comments.length
        });
    } catch (err) {
        console.error('[CreatorRitual] addComment error:', err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const getFeed = async (req, res) => {
    try {
        await markExpiredRituals();

        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip  = (page - 1) * limit;

        const rituals = await CreatorRitual.find({ isExpired: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('_id userId title coverImage panels likes views comments createdAt expiresAt song');

        const total = await CreatorRitual.countDocuments({ isExpired: false });

        return res.status(200).json({
            ok: true,
            rituals,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        console.error('[CreatorRitual] getFeed error:', err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

const deleteRitual = async (req, res) => {
    try {
        const { userId } = req.body;
        const ritual = await CreatorRitual.findById(req.params.id);

        if (!ritual) return res.status(404).json({ ok: false, message: 'Ritual not found' });
        if (ritual.userId !== userId) {
            return res.status(403).json({ ok: false, message: 'Not authorised' });
        }

        await CreatorRitual.findByIdAndDelete(req.params.id);
        return res.status(200).json({ ok: true, message: 'Ritual deleted' });
    } catch (err) {
        console.error('[CreatorRitual] deleteRitual error:', err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

module.exports = {
    uploadRitual,
    getUserRituals,
    getArchivedRituals,
    getRitualById,
    likeRitual,
    addComment,
    getFeed,
    deleteRitual
};