const mongoose = require('mongoose');

const anyaPageSessionSchema = new mongoose.Schema({
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

    // Session start timestamp
    sessionStart: {
        type: Date,
        required: true,
        default: Date.now
    },

    // Session end timestamp
    sessionEnd: {
        type: Date,
        default: null
    },

    // Last activity timestamp (updated by heartbeats)
    lastActivity: {
        type: Date,
        required: true,
        default: Date.now
    },

    // Calculated duration in seconds
    duration: {
        type: Number,
        default: 0
    },

    // Whether session is still active
    isActive: {
        type: Boolean,
        default: true
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
    }
}, {
    timestamps: true
});

// Index for faster queries
anyaPageSessionSchema.index({ visitorId: 1, sessionStart: -1 });
anyaPageSessionSchema.index({ userId: 1, sessionStart: -1 });
anyaPageSessionSchema.index({ pageType: 1, sessionStart: -1 });
anyaPageSessionSchema.index({ isActive: 1, lastActivity: -1 });

// Virtual to calculate duration if session is still active
anyaPageSessionSchema.virtual('currentDuration').get(function () {
    if (this.isActive) {
        return Math.floor((new Date() - this.sessionStart) / 1000);
    }
    return this.duration;
});

module.exports = mongoose.model('AnyaPageSession', anyaPageSessionSchema);
