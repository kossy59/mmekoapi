const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
    panel_number: {
        type: Number,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: null
    }
});

const storySchema = new mongoose.Schema({
    story_number: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    emotional_core: {
        type: String,
        required: true
    },
    panels: [panelSchema],
    coverImage: {
        type: String,
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: String, // User IDs who liked this story
        default: []
    }],
    comments: [{
        userId: String,
        username: String,
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Lifecycle fields - made optional to support old stories
    launchDate: {
        type: Date,
        required: false,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: false
    },
    deletesAt: {
        type: Date,
        required: false
    },
    isExpired: {
        type: Boolean,
        default: false
    }
});

// Add compound unique index to prevent duplicate stories for the same story number and date
// This provides database-level protection against race conditions
storySchema.index(
    { story_number: 1, launchDate: 1 },
    {
        unique: true,
        partialFilterExpression: { launchDate: { $exists: true } } // Only for stories with launchDate
    }
);

module.exports = mongoose.model('Story', storySchema);
