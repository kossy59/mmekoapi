const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const holdingIdPhotofile = Schema({
    holdingIdPhotofilelink: {
        type: String,
        required: false,
    },

    holdingIdPhotofilepublicid: {
        type: String,
        required: false
    },
})

const idPhotofile = Schema({
    idPhotofilelink: {
        type: String,
        required: false
    },

    idPhotofilepublicid: {
        type: String,
        required: false
    },
})

const markertdata = new Schema({

    userid: {
        type: String,
        required: true
    },

    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        required: true
    },
    verify: {
        type: Boolean,
        required: false,
        default: false
    },
    idexpire: {
        type: String,
        required: true,
    },

    holdingIdPhotofile: holdingIdPhotofile,
    idPhotofile: idPhotofile,
})

module.exports = mongoose.model('Document', markertdata);
