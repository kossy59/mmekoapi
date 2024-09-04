const {connectdatabase} = require('../config/connectDB')
const sdk = require("node-appwrite");

const Livechats = async(newdata)=>{

     let data = await connectdatabase();

     try{

          let id = await data.databar.createDocument(data.dataid,data.msgCol,sdk.ID.unique(),newdata)
          //console.log(id.$id)
          console.log( "inside new message "+newdata)
     }catch(err){

        console.log(err.message)
        return
     }

}

module.exports = Livechats;