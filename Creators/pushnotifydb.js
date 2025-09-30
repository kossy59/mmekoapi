const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     subinfo:{
        type:Object,
        required : false,
    },

  
})

module.exports = mongoose.creator('Subinfo',markertdata);