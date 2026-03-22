const mongoose = require('mongoose');

const ritualPanelSchema = new mongoose.Schema({
    panel_number: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true  // Creator must upload a real image
    },
    subtitle: {
        type: String,
        default: ''
    }
});

const creatorRitualSchema = new mongoose.Schema({
    // Who posted it
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Ritual content
    title: {
        type: String,
        required: true,
        maxlength: 60
    },

    // 15 panels with images + subtitles
    panels: {
        type: [ritualPanelSchema],
        validate: {
            validator: function (panels) {
                return panels.length === 15;
            },
            message: 'A ritual must have exactly 15 panels'
        }
    },

    // Cover image = first panel's image
    coverImage: {
        type: String,
        default: null
    },

    // Optional song (library ID or uploaded file URL)
    song: {
        type: String,
        default: null
    },

    // Engagement
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    comments: [{
        userId: String,
        username: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],

    // Lifecycle — 24h live, then archived on creator profile
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
        type: Date,
        required: true
    },
    isExpired: {
        type: Boolean,
        default: false,
        index: true
    }
});

// Index for fetching active/archived rituals by user
creatorRitualSchema.index({ userId: 1, isExpired: 1 });
creatorRitualSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('CreatorRitual', creatorRitualSchema);