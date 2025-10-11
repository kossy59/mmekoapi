const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     creator_portfolio_id:{
        type:String,
        required : true
    },

     userid:{
        type:String,
        required : true
    },


})

module.exports = mongoose.model('Crush',markertdata);