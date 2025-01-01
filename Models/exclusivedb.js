const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     content_type:{
        type:String,
        required : true
    },
    contentlink:{
        type:String,
        required : true
    },


})

module.exports = mongoose.model('Exclusive',markertdata);