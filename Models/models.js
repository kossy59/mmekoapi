const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     verify:{
        type:String,
        required : true
    },

     drink:{
        type:String,
        required : true
    },

    name:{
        type:String,
        required : true
    },

     age:{
        type:String,
        required : true
    },

     location:{
        type:String,
        required : true
    },

     price:{
        type:String,
        required : true
    },

      duration:{
        type:String,
        required : true
    },

    bodytype:{
        type:String,
        required : true
    },

      smoke:{
        type:String,
        required : true
    },

      interestedin:{
        type:String,
        required : true
    },

     height:{
        type:String,
        required : true
    },

      weight:{
        type:String,
        required : true
    },

     description:{
        type:String,
        required : true
    },

     gender:{
        type:String,
        required : true
    },

      timeava:{
        type:String,
        required : true
    },

    daysava:{
        type:String,
        required : true
    },

     photolink:{
        type:String,
        required : true
    },

    hosttype:{
        type:String,
        required : true
    },

    document:{
        type:String,
        required : true
    },

    
})

module.exports = mongoose.model('Model',markertdata);