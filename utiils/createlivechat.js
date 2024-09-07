const {connectdatabase} = require('../config/connectDB')
const sdk = require("node-appwrite");

const Livechats = async(newdata)=>{

     let data = await connectdatabase();

     try{

          let Chats = await data.databar.listDocuments(data.dataid,data.msgCol);

          console.log("Message length 1st "+Chats.documents.length)
          await data.databar.createDocument(data.dataid,data.msgCol,sdk.ID.unique(),newdata)
          //console.log(id.$id)
          console.log("Message length 2nd "+Chats.documents.length)
         console.log( "inside new message "+newdata.toid)

         
        

         let listchat = Chats.documents.filter(value =>{
          return value.toid === newdata.toid
         })

         console.log(listchat)
     }catch(err){

        console.log(err.message)
        return
     }

}

module.exports = Livechats;