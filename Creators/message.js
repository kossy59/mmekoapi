const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

    client: {
        type: Boolean,
        required: false
    },

    fromid: {
        type: String,
        required: true
    },

    notify: {
        type: Boolean,
        required: true,
        default: true
    },

    content: {
        type: String,
        required: true
    },

    favourite: {
        type: Boolean,
        required: true,
        default: false
    },

    date: {
        type: String,
        required: true
    },

    toid: {
        type: String,
        required: true
    },
    coin: {
        type: Boolean,
        required: false
    },

    // Add support for file attachments
    files: [{
        type: String,
        required: false
    }],

    fileCount: {
        type: Number,
        required: false,
        default: 0
    },

    // Pay Per View Fields
    isPPV: {
        type: Boolean,
        default: false
    },
    ppvPrice: {
        type: Number,
        default: 0
    },
    unlockedBy: [{
        type: String, // User IDs who unlocked this message
        default: []
    }],



})

module.exports = mongoose.model('Message', markertdata);