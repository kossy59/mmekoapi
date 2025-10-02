// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const messagedb = require("../../Creators/message")

const MsgNotify = async(req,res)=>{

     const date = req.body.date

      //let data = await connectdatabase();
     

     try{
        
         //let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.equal([sdk.Query.equal("date",[date])])])
         let Chats = await messagedb.findOne({date:date}).exec()

         if(!Chats){
            return res.status(200).json({"ok":true,"message":`no notification empty`})
         }

         Chats.notify = false;
         Chats.save()

         // for (let i = 0; i < Chats.length; i++){
         //    await data.databar.updateDocument(data.dataid,data.msgCol,Chats.documents[i].$id,{notify:true})
         // }

         return res.status(200).json({"ok":true,"message":`update successfully`})
     }catch(err){
        return 
     }

    }

    module.exports = MsgNotify;