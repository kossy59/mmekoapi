const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

      detials:{
        type:String,
        required : false
    },

     spent:{
        type:String,
        required : false
    },

     income:{
        type:String,
        required : false
    },

    date:{
        type:String,
        required : false
    },


  
})

module.exports = mongoose.model('Balancehistory',markertdata);