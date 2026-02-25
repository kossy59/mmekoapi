const mongoose = require('mongoose');

/**
 * Single-document model for the current 30-day episodic Ritual series.
 * Used by AiStoryController to drive daily episode generation and updated
 * after each episode (day_number, timeline). Admin can edit via API/dashboard.
 */
const seriesConfigSchema = new mongoose.Schema({
    // Fixed id so we always have exactly one active config
    _id: {
        type: String,
        default: 'current'
    },
    series_info: {
        series_title: { type: String, default: 'Almost Lovers' },
        day_number: { type: Number, default: 1 },
        completed: { type: Boolean, default: false },
        premise: { type: String, default: '' }
    },
    characters: {
        main: {
            name: String,
            role: String,
            traits: [String],
            fears: [String],
            desires: [String],
            secret: String
        },
        counterpart: {
            name: String,
            role: String,
            traits: [String],
            fears: [String],
            desires: [String],
            secret: String
        }
    },
    relationship_state: {
        closeness: { type: Number, default: 70 },
        tension: { type: Number, default: 20 },
        honesty: { type: Number, default: 40 },
        days_since_contact: { type: Number, default: 0 }
    },
    timeline: {
        type: Array,
        default: []
        // Items: { day: Number, summary?: string } or similar
    },
    hidden_future_events: {
        type: Array,
        default: []
        // Items: { day: Number, event: String }
    },
    daily_slots: {
        type: Array,
        default: []
        // Items: { day_number, objective, emotion, perspective, flexible }
    }
}, {
    timestamps: true,
    strict: false // allow extra keys if we extend the JSON later
});

module.exports = mongoose.model('SeriesConfig', seriesConfigSchema);
