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

     bookingId:{
        type:String,
        required : false
    },

     callerName:{
        type:String,
        required : false
    },

     answererName:{
        type:String,
        required : false
    },

     createdAt:{
        type:Date,
        required : false,
        default : Date.now
    }
    
})

module.exports = mongoose.model('Videodb',markertdata);