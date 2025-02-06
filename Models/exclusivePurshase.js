const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

    userid:{
        type:String,
        required : true
    },
    exclusiveid:{
        type:String,
        required : true
    },
    price:{
        type:String,
        required : true
    },
    paid:{
        type:Boolean,
        required : true,
        default:false
    },
    exclusivelink:{
        type:String,
        required : true
    },
    exclusivename:{
        type:String,
        required : true,
       
    },


})

module.exports = mongoose.model('Exclusivebuy',markertdata);