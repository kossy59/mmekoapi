const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const holdingIdPhotofile = Schema({
    holdingIdPhotofilelink: { type: String, required: false },
    holdingIdPhotofilepublicid: { type: String, required: false },
})

const idPhotofile = Schema({
    idPhotofilelink: { type: String, required: false },
    idPhotofilepublicid: { type: String, required: false },
})

const markertdata = new Schema({
    userid:       { type: String,  required: true },
    firstname:    { type: String,  required: false },  
    lastname:     { type: String,  required: false }, 
    email:        { type: String,  required: false },  
    dob:          { type: String,  required: false },  
    country:      { type: String,  required: false },  
    city:         { type: String,  required: false },  
    address:      { type: String,  required: false },  
    documentType: { type: String,  required: false }, 
    idexpire:     { type: String,  required: false },  
    verify:       { type: Boolean, required: false, default: false },
    fan_submission: { type: Boolean, required: false, default: false }, 
    status:       { type: String,  required: false, default: "pending" }, 

    holdingIdPhotofile: holdingIdPhotofile,
    idPhotofile: idPhotofile,

    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Creators_Application', markertdata);