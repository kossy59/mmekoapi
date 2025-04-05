const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     postlink:{
        type:String,
        required : false
    },

     posttime:{
        type:String,
        required : true
    },

    content:{
        type:String,
        required : false
    },

     posttype:{
        type:String,
        required : false
    },

    
})

module.exports = mongoose.model('Post',markertdata);