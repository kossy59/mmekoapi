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

  
})

module.exports = mongoose.creator('Follower',markertdata);