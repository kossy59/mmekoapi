// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const messagedb = require("../../Models/message")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const models = require("../../Models/models")

const getnotify = async(req,res)=>{

     const userid = req.body.userid

    // console.log("inside message notificaton "+userid)
     // let data = await connectdatabase();
     

     try{
        
        // let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.and([sdk.Query.equal("toid",[userid]), sdk.Query.equal("notify",[true])])])
         let  chatting = await messagedb.find({toid:userid}).exec()
         let Chats = chatting.filter(value =>{
            return value.notify === true
         })

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

            if(!Chats[0]){
              return res.status(200).json({"ok":true,"message":`user host empty`,notify:[]})
           }

          // console.log(NonreponseChat[0].fromid)
        
           let notificationbyuser = []
         
           // file notification base on the sender

           Chats.forEach((value,index) => {

            if(notificationbyuser.length < 1){
                  
                let chat = {
                    userid: value.fromid,
                    content:value.content,
                    notifycount : 0,
                    toid:value.toid,
                    client:value.client,
                    date:value.date
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
                            client:value.client,
                            date:value.date
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
               // let Users =  await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[notificationbyuser[i].userid])])
               let Users = await userdb.findOne({_id:notificationbyuser[i].userid}).exec()
                //let Photos = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[notificationbyuser[i].userid])])
                 let Photos = await completedb.findOne({useraccountId:userid}).exec()
                if(Users){
                     
                           let notication = {
                                photolink: Photos.photoLink,
                                username:Users.firstname,
                                content: notificationbyuser[i].content,
                                messagecount: notificationbyuser[i].notifycount,
                                fromid: notificationbyuser[i].userid,
                                toid: notificationbyuser[i].toid,
                                client:notificationbyuser[i].client,
                                value:"notify",
                                date:notificationbyuser[i].date
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
               //let Modeling = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[notificationbyuser[i].userid])])
               let Modeling = await models.findOne({userid:notificationbyuser[i].userid}).exec()
               if(Modeling){

                  let photoLinks = Modeling.photolink.split(",")
                      let notication = {
                                photolink: photoLinks[0],
                                username: Modeling.name,
                                content: notificationbyuser[i].content,
                                messagecount: notificationbyuser[i].notifycount,
                                fromid: notificationbyuser[i].userid,
                                toid: notificationbyuser[i].toid,
                                value:"notify",
                                 date:notificationbyuser[i].date
                            }

                            Notify.push(notication)
                 
               }
            }
        }
      
        

      //  console.log("still nothig "+Notify[0])

         // return Notify
        return res.status(200).json({"ok":true,"message":`user host empty`,notify:Notify})
         


     }catch(err){

       // console.log('Erro on notification '+err.message)
        return []
     }

}


module.exports = getnotify