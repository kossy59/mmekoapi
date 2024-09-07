const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const getnotify = async(req,res)=>{

     const userid = req.body.userid
     let data = await connectdatabase();
     

     try{
        
         let Chats = await data.databar.listDocuments(data.dataid,data.msgCol)
         let username = await data.databar.listDocuments(data.dataid,data.colid)
         let photolinks = await data.databar.listDocuments(data.dataid,data.userincol)
         let modelname = await data.databar.listDocuments(data.dataid,data.modelCol)
         
         let Listofchat = Chats.documents.filter(value=>{
            return value.toid === userid
           })

          //console.log(Listofchat+" List of notification")
          console.log(userid)
          console.log("66ce8992001432aca6b0")
         //  console.log(Chats)
          


          
           let NonreponseChat = Listofchat.filter(value =>{
             return value.notify === true
           })

           console.log(NonreponseChat)

            if(!NonreponseChat[0]){
             return []
           }

          // console.log(NonreponseChat[0].fromid)
        
           let notificationbyuser = []
         
           // file notification base on the sender
         for(let i = 0; i < NonreponseChat.length; i++){
            if(i < 1){
                let chat = {
                    userid: NonreponseChat[i].fromid,
                    content:NonreponseChat[i].content,
                    notifycount : 0,
                    toid:NonreponseChat[i].toid,
                    client:NonreponseChat[i].client
                }

                notificationbyuser.push(chat)

            }
            for(let k = 0; k < notificationbyuser.length; k++){

                if(notificationbyuser[k].userid === NonreponseChat[i].fromid){
                    notificationbyuser[k].content = NonreponseChat[i].content
                    notificationbyuser[k].notifycount ++
                }else{
                    
                     let chat = {
                            userid: NonreponseChat[i].fromid,
                            content:NonreponseChat[i].content,
                            notifycount : 1,
                            toid:NonreponseChat[i].toid,
                            client:NonreponseChat[i].client
                        }

                notificationbyuser.push(chat)
                }


            }
         }

       //  console.log(notificationbyuser)

         // all notification array
         let notify = []

         // get the sender notifcations name and photolink with it id

         // starting from userdb database as client...
         for(let i = 0; i < username.documents.length; i++){
            for(let j = 0; j < photolinks.documents.length; j++){
                for(let k = 0; k < notificationbyuser.length; k++){
                    if(notificationbyuser[k].userid === username.documents[i].$id){
                        if(username.documents[i].$id === photolinks.documents[j].useraccountId){
                            let notication = {
                                photolink: photolinks.documents[j].photoLink,
                                username: username.documents[i].firstname,
                                content: notificationbyuser[k].content,
                                messagecount: notificationbyuser[k].notifycount,
                                fromid: notificationbyuser[k].userid,
                                toid: notificationbyuser[k].toid,
                                client:notificationbyuser[k].client
                            }

                            notify.push(notication)
                        }
                    }
                }
            }
         }

         // getting user names from model as model
         for(let i = 0; i < modelname.documents.length; i++){
            for(let j = 0; j < notificationbyuser.length; j++){
                if(notificationbyuser[j].userid === modelname.documents[i].$id){

                    let photoLinks = modelname.documents[i].photolink.split(",")
                      let notication = {
                                photolink: photoLinks[0],
                                username: modelname.documents[i].name,
                                content: notificationbyuser[j].content,
                                messagecount: notificationbyuser[j].notifycount,
                                fromid: notificationbyuser[j].userid,
                                toid: notificationbyuser[j].toid
                            }

                            notify.push(notication)

                }
            }
         }

       // console.log(notify)

          return notify
         


     }catch(err){

       // console.log('Erro on notification '+err.message)
        return []
     }

}


module.exports = getnotify