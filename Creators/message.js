const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     client:{
        type:Boolean,
        required : false
    },

     fromid:{
        type:String,
        required : true
    },

    notify:{
        type:Boolean,
        required : true,
        default:true
    },

     content:{
        type:String,
        required : true
    },

     favourite:{
        type:Boolean,
        required : true,
        default:false
    },

     date:{
        type:String,
        required : true
    },

      toid:{
        type:String,
        required : true
    },
    coin:{
        type:Boolean,
        required : false
    },

  
  
})

module.exports = mongoose.creator('Message',markertdata);