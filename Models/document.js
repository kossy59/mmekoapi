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
    resident_address:{
        type:String,
        required : true
    },
    document_type:{
        type:String,
        required : true
    },
    photolinkid:{
        type:String,
        required : true
    },
    userphotolink:{
        type:String,
        required : true
    },
    id_expiredate:{
        type:String,
        required : true
    },
    expireable:{
        type:Boolean,
        required : true
    },


})

module.exports = mongoose.model('Document',markertdata);