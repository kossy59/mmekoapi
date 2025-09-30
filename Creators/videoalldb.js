const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     callerid:{
        type:String,
        required : false
    },

     clientid:{
        type:String,
        required : false
    },

     connected:{
        type:Boolean,
        required : false,
        default : false
    },
     waiting:{
        type:String,
        required : false
    },

  
    
})

module.exports = mongoose.creator('Videodb',markertdata);