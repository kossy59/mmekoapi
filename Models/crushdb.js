const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     modelid:{
        type:String,
        required : true
    },

     userid:{
        type:String,
        required : true
    },


})

module.exports = mongoose.model('Crush',markertdata);