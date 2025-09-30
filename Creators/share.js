const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     postid:{
        type:String,
        required : true
    },

     content:{
        type:String,
        required : false
    },

    sharetime:{
        type:String,
        required : false
    },

    
})

module.exports = mongoose.creator('Share',markertdata);