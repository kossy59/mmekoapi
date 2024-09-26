const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     modelid:{
        type:String,
        required : true
    },

     type:{
        type:String,
        required : false
    },

     time:{
        type:String,
        required : false
    },

     place:{
        type:String,
        required : true
    },

    userid:{
        type:String,
        required : true
    },

     status:{
        type:String,
        require:false,
        default:"pending"
    },

     date:{
        type:String,
        required : false
    },

   
  
  
})

module.exports = mongoose.model('Booking',markertdata);