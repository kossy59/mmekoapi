const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     modelid:{
        type:String,
        required : true
    },

     posttime:{
        type:String,
        required : true
    },

    content:{
        type:String,
        required : false
    },

    
})

module.exports = mongoose.model('Review',markertdata);