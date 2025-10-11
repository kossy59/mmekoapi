const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const markertdata = new Scheme({

     userid:{
        type:String,
        required : true
    },

     creator_portfolio_id:{
        type:String,
        required : true
    },

     posttime:{
        type:String,
        required : true
    },

    content:{
        type:String,
        required : true
    },

    
})

module.exports = mongoose.model('Review',markertdata);