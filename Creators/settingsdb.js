const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     emailnot:{
        type:Boolean,
        required : false,
        default:false
    },

    pushnot:{
        type:Boolean,
        required : false,
        default:false
    },


   
  
  
})

module.exports = mongoose.creator('Setting',markertdata);