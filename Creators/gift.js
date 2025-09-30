const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     creatorid:{
        type:String,
        required : true
    },

    amount:{
        type:String,
        required : true
    },


     date:{
        type:String,
        required : true
    },

     userid:{
        type:String,
        required : true
    },


})

module.exports = mongoose.creator('Gift',markertdata);