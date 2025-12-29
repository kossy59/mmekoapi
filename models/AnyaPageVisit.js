const mongoose = require('mongoose');

const anyaPageVisitSchema = new mongoose.Schema({
    // Page type: 'main' for /anya or 'story' for /anya/[id]
    pageType: {
        type: String,
        enum: ['main', 'story'],
        required: true
    },

    // Story ID (only for story pages)
    storyId: {
        type: String,
        default: null
    },

    // User who visited (if logged in)
    userId: {
        type: String,
        default: null
    },

    // Session/visitor tracking
    visitorId: {
        type: String,
        required: true  // Generated on frontend
    },

    // IP address for analytics
    ipAddress: {
        type: String,
        default: null
    },

    // User agent for device tracking
    userAgent: {
        type: String,
        default: null
    },

    // Referrer URL
    referrer: {
        type: String,
        default: null
    },

    // Visit timestamp
    visitedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
anyaPageVisitSchema.index({ pageType: 1, visitedAt: -1 });
anyaPageVisitSchema.index({ storyId: 1, visitedAt: -1 });
anyaPageVisitSchema.index({ userId: 1, visitedAt: -1 });
anyaPageVisitSchema.index({ visitorId: 1, visitedAt: -1 });

module.exports = mongoose.model('AnyaPageVisit', anyaPageVisitSchema);
