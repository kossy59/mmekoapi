const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     blocked_userid:{
        type:String,
        required : true
    },


})

module.exports = mongoose.creator('Blocked',markertdata);