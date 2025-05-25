const messagedb = require("../Models/message")

const Livechats = async(newdata)=>{

   

        //  let Chats = await data.databar.listDocuments(data.dataid,data.msgCol);

          //console.log("Message length 1st "+Chats.documents.length)
  // await data.databar.createDocument(data.dataid,data.msgCol,sdk.ID.unique(),newdata)
  // console.log(newdata)
  await messagedb.create(newdata)
  
          //console.log(id.$id)
          //console.log("Message length 2nd "+Chats.documents.length)
         //console.log( "inside new message "+newdata.toid)

         let Chats = await messagedb.find().exec()

         
        

         let listchat = Chats.filter(value =>{
          return value.toid === newdata.toid
         })

         //console.log(listchat)

}

module.exports = Livechats;