const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     firstname:{
        type:String,
        required : true
    },
    lastname:{
        type:String,
        required : true
    },
    email:{
        type:String,
        required : true
    },
    dob:{
        type:String,
        required : true
    },
    country:{
        type:String,
        required : true
    },
    city:{
        type:String,
        required : true
    },
    address:{
        type:String,
        required : true
    },
    documentType:{
        type:String,
        required : true
    },
    idPhoto:{
        type:String,
        required : true
    },
    holdingIdPhoto:{
        type:String,
        required : true
    },
    verify:{
        type:Boolean,
        required : false,
        default:false
    },
    idexpire:{
        type:String,
        required : true,
       
    },


})

module.exports = mongoose.model('Document',markertdata);