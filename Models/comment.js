const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     content:{
        type:String,
        required : false
    },

     sharedid:{
        type:String,
        required : false
    },

     postid:{
        type:String,
        required : true
    },

    commenttime:{
        type:String,
        required : true
    },

   
  
  
})

module.exports = mongoose.model('Comment',markertdata);