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
    isDraft: {
        type: Boolean,
        default: true  // Start as draft during image generation
    },
    isPublished: {
        type: Boolean,
        default: false  // Only true when images are complete
    },
    imageGenerationStatus: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        default: 'pending'
    },
    imageGenerationError: {
        type: String,
        default: null
    },
    lastImageRetryAt: {
        type: Date,
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

module.exports = mongoose.model('Story', storySchema);
