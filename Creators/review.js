const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     creatorid:{
        type:String,
        required : true
    },

     posttime:{
        type:String,
        required : true
    },

    content:{
        type:String,
        required : true
    },

    
})

module.exports = mongoose.creator('Review',markertdata);