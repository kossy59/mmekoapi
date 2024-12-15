// const {connectdatabase} = require('../../config/connectDB')
// const sdk = require("node-appwrite");

const messagedb = require("../../Models/message")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const models = require("../../Models/models")
const deleteOldChats = require("../../utiils/Deletes/deletemessage")

const MsgNotify = async(req,res)=>{

    let userid = req.body.userid;

    // let data = await connectdatabase();

    // console.log("inside recent message "+userid)

     try{
        // let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.limit(200), sdk.Query.equal("fromid",[userid])])

         let Chats = await messagedb.find({fromid:userid}).exec()

          await deleteOldChats()
           let ChatParID = []

           //List of saturated Chat with Photo Link and names

           let FullChat = []

           if(Chats){
                Chats.forEach(value1 =>{
              if(true){

                    if(ChatParID.length < 1){
                    ChatParID.push(value1)
                    }

                ChatParID.forEach((value2,index) =>{
                  if(value1.toid === value2.toid){
                    if(Number(value1.date) > Number(value2.date)){
                      ChatParID[index] = value1

                    }else{
                      ChatParID[index] = value2

                    }
                  }else{
                      if(Number(value1.date) > Number(value2.date)){
                      ChatParID.push(value1)

                    }else{
                      ChatParID.push(value2)

                    }
                  }
                })

              }

            })
           
            for(let i = 0; i < ChatParID.length; i++ ){

               let allmodel = await models.findOne({_id:ChatParID[i].toid}).exec()
               let alluser = await userdb.findOne({_id:ChatParID[i].toid}).exec()

               if(!allmodel && !alluser){

                console.log("inside deleting")
               let sus =  await messagedb.deleteOne({toid:ChatParID[i].toid}).exec()
                let sus2 =  await messagedb.deleteOne({fomid:ChatParID[i].fomid}).exec()

               console.log("sus "+sus)
               }
             
            }

           // console.log(ChatParID)

            // lets search name and photolink as a client 

            for(let i = 0; i < ChatParID.length; i++){

                if(ChatParID[i].client === true){
                if(ChatParID[i].fromid === userid){
                       console.log("on top database colotion")
                  // let Username = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[ChatParID[i].fromid])])
                  let Username = await userdb.findOne({_id:ChatParID[i].fromid})
                 //  console.log("on top database username colotion")
                  // let Photo = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[ChatParID[i].fromid])])
                  let Photo = await completedb.findOne({useraccountId:ChatParID[i].fromid})
                     // console.log("on top database photo colotion")
                   if(Username){
                    let chat = {
                        fromid: ChatParID[i].fromid,
                        toid: ChatParID[i].toid,
                        content: ChatParID[i].content,
                        date: ChatParID[i].date,
                        name: Username.firstname,
                        photolink: Photo.photoLink,
                        client: ChatParID[i].client,
                        value:"recent",
                        online:Username.active
                       }

                       
                       FullChat.push(chat)
                   }
             }
                
                

                }
            }

          //  console.log("Under searching names as client for loop")

           

         
             // lets search name and photolink as a model 

             for(let i = 0; i < ChatParID.length; i++){
              // console.log("inside model forloop "+i)
              if(ChatParID[i].client === false){
                //console.log("inside model")
                  if(ChatParID[i].fromid === userid){

                  //let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[ChatParID[i].fromid])])
                  let Model = await models.findOne({userid:ChatParID[i].fromid})
                 
                   if(Model){
                       let Username = await userdb.findOne({_id:Model.userid})
                      let picture = Model.photolink.split(",")
                      let chat = {
                        fromid: ChatParID[i].fromid,
                        toid: ChatParID[i].toid,
                        content: ChatParID[i].content,
                        date: ChatParID[i].date,
                        name: Model.name,
                        photolink: picture[0],
                        client: ChatParID[i].client,
                        value:"recent",
                        online:Username.active
                       }
                       FullChat.push(chat)

                  }
                }
              }
             }
            //  console.log("Under searching names as model for loop")


           // console.log(FullChat)

          //  FullChat.sort((a,b)=> Number(a.date) - Number(b.date))

          //  FullChat.reverse()

         //  let RecentChat = FullChat.slice(0,30)

          // console.log(RecentChat)

           }

             // console.log("fullchats "+FullChat.length)

           
          
          
           // if no recent message sent by me check sent to me
           if(true){
            
             let toChats = await messagedb.find({toid:userid}).exec()

             let nonchat = []
             
              // check for message that is my id which is to and not equal to fromid
             toChats.forEach(value1=>{

             // console.log("inside to chat "+value1.toid)

              if(FullChat.length > 0){
                 FullChat.forEach(value2=>{
                 // console.log("inside  chat "+value2.fromid)
                  if(value1.fromid !== value2.toid){
                     nonchat.push(value1)
                  
                  }else{
                      
                  }
                })

              }else{
                nonchat.push(value1)
              }
             })

            // console.log("tochat "+nonchat.length)

          

     
         // get any chat with my userid
          //  let Listofchat = Chats.documents.filter(value=>{
          //   return value.toid === userid || value.toid === userid
          //  })
             //console.log("model recent chat length "+Chats.length)
            //  if(!Chats[0]){
            //  return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:[]})
            //  }

          

           //list of  chat perID
           let ChatParID = []

           //List of saturated Chat with Photo Link and names

          

           if(nonchat){
                nonchat.forEach(value1 =>{
              if(true){

                    if(ChatParID.length < 1){
                    ChatParID.push(value1)
                    }

                ChatParID.forEach((value2,index) =>{
                  if(value1.fromid === value2.fromid){
                    if(Number(value1.date) > Number(value2.date)){
                      ChatParID[index] = value1

                    }else{
                      ChatParID[index] = value2

                    }
                  }else{
                      if(Number(value1.date) > Number(value2.date)){
                      ChatParID.push(value1)

                    }else{
                      ChatParID.push(value2)

                    }
                  }
                })

              }

            })
           
            for(let i = 0; i < ChatParID.length; i++ ){

               let allmodel = await models.findOne({_id:ChatParID[i].fromid}).exec()
               let alluser = await userdb.findOne({_id:ChatParID[i].fromid}).exec()

               if(!allmodel && !alluser){

                //console.log("inside deleting")
               let sus =  await messagedb.deleteOne({toid:ChatParID[i].fromid}).exec()
                let sus2 =  await messagedb.deleteOne({fomid:ChatParID[i].toid}).exec()

               //console.log("sus "+sus)
               }
             
            }

           // console.log(ChatParID)

            // lets search name and photolink as a client 

            for(let i = 0; i < ChatParID.length; i++){

                if(ChatParID[i].client === true){
                if(ChatParID[i].toid === userid){
                       console.log("on top database colotion")
                  // let Username = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[ChatParID[i].fromid])])
                  let Username = await userdb.findOne({_id:ChatParID[i].fromid})
                 //  console.log("on top database username colotion")
                  // let Photo = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[ChatParID[i].fromid])])
                  let Photo = await completedb.findOne({useraccountId:ChatParID[i].fromid})
                     // console.log("on top database photo colotion")
                   if(Username){
                    let chat = {
                        toid: ChatParID[i].toid,
                        fromid: ChatParID[i].fromid,
                        content: ChatParID[i].content,
                        date: ChatParID[i].date,
                        name: Username.firstname,
                        photolink: Photo.photoLink,
                        client: ChatParID[i].client,
                        value:"recent",
                        online:Username.active
                       }

                       
                       FullChat.push(chat)
                   }
             }
                
                

                }
            }

          //  console.log("Under searching names as client for loop")

           

         
             // lets search name and photolink as a model 

             for(let i = 0; i < ChatParID.length; i++){
              // console.log("inside model forloop "+i)
              if(ChatParID[i].client === false){
                //console.log("inside model")
                  if(ChatParID[i].toid === userid){

                  //let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[ChatParID[i].fromid])])
                  let Model = await models.findOne({userid:ChatParID[i].fromid})
                 
                   if(Model){
                       let Username = await userdb.findOne({_id:Model.userid})
                      let picture = Model.photolink.split(",")
                      let chat = {
                        toid: ChatParID[i].toid,
                        fromid: ChatParID[i].fromid,
                        content: ChatParID[i].content,
                        date: ChatParID[i].date,
                        name: Model.name,
                        photolink: picture[0],
                        client: ChatParID[i].client,
                        value:"recent",
                        online:Username.active,
                        
                       }
                       FullChat.push(chat)

                  }
                }
              }
             }
            //  console.log("Under searching names as model for loop")


           // console.log(FullChat)

           FullChat.sort((a,b)=> Number(a.date) - Number(b.date))

           FullChat.reverse()

           let RecentChat = FullChat.slice(0,30)

          // console.log(RecentChat)

           }
           }

             console.log("fullchating "+FullChat.length)



        

           // uread chat section

            let  chatting = await messagedb.find({toid:userid}).exec()
            if(chatting[0]){
                let Chatss = chatting.filter(value =>{
            return value.notify === true
         })

           let notificationbyuser = []
         
           // file notification base on the sender

           Chatss.forEach((value,index) => {

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


         // get the sender notifcations name and photolink with it id

         // starting from userdb database as client...

         for(let i = 0; i < notificationbyuser.length; i++){
            if(notificationbyuser[i].client === true){
               // let Users =  await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[notificationbyuser[i].userid])])
               let Users = await userdb.findOne({_id:notificationbyuser[i].userid}).exec()
                //let Photos = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[notificationbyuser[i].userid])])
                 let Photos = await completedb.findOne({useraccountId:notificationbyuser[i].userid}).exec()
                if(Users){

                  // console.log("message content "+notificationbyuser[i].content)
                  //  console.log("message photolink "+Photos.photoLink)
                     
                           let notication = {
                                photolink: Photos.photoLink,
                                username:Users.firstname,
                                content: notificationbyuser[i].content,
                                messagecount: notificationbyuser[i].notifycount,
                                fromid: notificationbyuser[i].userid,
                                toid: notificationbyuser[i].toid,
                                client:true,
                                value:"notify",
                                date:notificationbyuser[i].date,
                                online:Users.active
                            }

                       // Notify.push(notication)

                        FullChat.push(notication)
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
                  let username = await userdb.findOne({_id:notificationbyuser[i].userid}).exec()
                  let photoLinks = Modeling.photolink.split(",")
                      let notication = {
                                photolink: photoLinks[0],
                                username: Modeling.name,
                                content: notificationbyuser[i].content,
                                messagecount: notificationbyuser[i].notifycount,
                                fromid: notificationbyuser[i].userid,
                                toid: notificationbyuser[i].toid,
                                value:"notify",
                                date:notificationbyuser[i].date,
                                online:username.active,
                                client:false
                            }

                            FullChat.push(notication)
                 
               }
            }
        }

      //  console.log("all chat "+FullChat[0].value)

            }
          
         // console.log("chat content "+FullChat.length)
          return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:FullChat}) 


     }catch(err){

        console.log(err.message+"  inside recent message")
        return []
     }

}

module.exports = MsgNotify;