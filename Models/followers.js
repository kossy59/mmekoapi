const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     followerid:{
        type:String,
        required : false
    },

     new_follower:{
        type:Boolean,
        required : false
    },


   
  
  
})

module.exports = mongoose.model('Follower',markertdata);