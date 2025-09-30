const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     sharedid:{
        type:String,
        required : false
    },

     postid:{
        type:String,
        required : true
    },


   
  
  
})

module.exports = mongoose.creator('Like',markertdata);