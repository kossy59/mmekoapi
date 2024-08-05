const mongoose = require('mongoose');
require('dotenv').config();

const connectDb = async()=>{
    try{
         await mongoose.connect(process.env.DB,{
            autoIndex:true
        })
    }catch(err){
        console.error(err)
    }
}

module.exports = connectDb;