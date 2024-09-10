const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const getnotify = async(req,res)=>{

     const date = req.body.date

      console.log("inside message notificaton "+date)
      let data = await connectdatabase();
     

     try{
        
         let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.equal([sdk.Query.equal("date",[date])])])

         if(!Chats.documents[0]){
            return res.status(200).json({"ok":true,"message":`no notification empty`})
         }

         for (let i = 0; i < Chats.documents.length; i++){
            await data.databar.updateDocument(data.dataid,data.msgCol,Chats.documents[i].$id,{notify:true})
         }

         return res.status(200).json({"ok":true,"message":`update successfully`})
     }catch(err){
        return 
     }

    }

    module.exports = getnotify;