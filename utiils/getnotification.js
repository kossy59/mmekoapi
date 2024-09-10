const {connectdatabase} = require("../config/connectDB")
const sdk = require("node-appwrite");


const getNotify = async(userid)=>{

     //console.log(userid) 
     let data = await connectdatabase();
     

     try{
        
         let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.and([sdk.Query.equal("toid",[userid]), sdk.Query.equal("notify",[true])])])
       
        //  let Listofchat = Chats.documents.filter(value=>{
        //     return value.toid === userid
        //    })

          //console.log(Listofchat+" List of notification")
        //   console.log(userid)
        //   console.log("66ce8992001432aca6b0")
         //  console.log(Chats)
          


          
        //    let NonreponseChat = Listofchat.filter(value =>{
        //      return value.Notify === true
        //    })

           //console.log(Chats.documents[0])

            if(!Chats.documents[0]){
             return []
           }

          // console.log(NonreponseChat[0].fromid)
        
           let notificationbyuser = []
         
           // file notification base on the sender

           Chats.documents.forEach((value,index) => {

            if(notificationbyuser.length < 1){
                  
                let chat = {
                    userid: value.fromid,
                    content:value.content,
                    notifycount : 0,
                    toid:value.toid,
                    client:value.client
                }

                notificationbyuser.push(chat)

            }

            notificationbyuser.forEach((value1,index2) => {
                if(value1.userid === value.fromid){
                    notificationbyuser[index2].content = value.content; 
                    notificationbyuser[index2].notifycount++
                }else{
                     let chat = {
                            userid: value.fromid,
                            content:value.content,
                            notifycount : 0,
                            toid:value.toid,
                            client:value.client
                        }

                 notificationbyuser.push(chat)
                }
            })

           })

         //console.log(notificationbyuser[0])

         // all notification array
         let Notify = []

         // get the sender notifcations name and photolink with it id

         // starting from userdb database as client...

         for(let i = 0; i < notificationbyuser.length; i++){
            if(notificationbyuser[i].client === true){
                let Users =  await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[notificationbyuser[i].userid])])
                let Photos = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[notificationbyuser[i].userid])])
                 
                if(Users.documents[0]){
                     
                           let notication = {
                                photolink: Photos.documents[0].photoLink,
                                username:Users.documents[0].firstname,
                                content: notificationbyuser[i].content,
                                messagecount: notificationbyuser[i].notifycount,
                                fromid: notificationbyuser[i].userid,
                                toid: notificationbyuser[i].toid,
                                client:notificationbyuser[i].client,
                                value:"notify"
                            }

                       // Notify.push(notication)

                        Notify.push(notication)
                         //console.log(Notify[0])
                          
                }
            }
         }
          
       

     

        //  getting user names from model as model

        for(let i = 0; i < notificationbyuser.length; i++){
            if(notificationbyuser[i].client === false){
               let Modeling = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[notificationbyuser[i].userid])])
               if(Modeling.documents[0]){

                  let photoLinks = Modeling.documents[0].photolink.split(",")
                      let notication = {
                                photolink: photoLinks[0],
                                username: Modeling.documents[0].name,
                                content: notificationbyuser[i].content,
                                messagecount: notificationbyuser[i].notifycount,
                                fromid: notificationbyuser[i].userid,
                                toid: notificationbyuser[i].toid,
                                value:"notify"
                            }

                            Notify.push(notication)
                 
               }
            }
        }
      
        

        console.log("still nothig "+Notify[0])

          return Notify
         


     }catch(err){

       // console.log('Erro on notification '+err.message)
        return []
     }

}


module.exports = getNotify