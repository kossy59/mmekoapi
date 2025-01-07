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

        
         let Chatss = await messagedb.find({}).exec()
          let toChatss = await messagedb.find({toid:userid}).exec()

         let Chats = Chatss.filter(value=>{
          return value.toid !== userid && value.fromid === userid
         }
          )

       

         // console.log("chats length "+Chats.length)

          let toChats = toChatss.filter(value=>{
            return value.fromid !== userid && value.toid === userid
          })


          await deleteOldChats()
           let ChatParID = []


           //List of saturated Chat with Photo Link and names

           let FullChat = []

       
            const fromchat = []
       
              console.log("Chats length "+Chats.length)

           if(Chats){
            
                Chats.forEach(value1 =>{
              if(value1.toid !== userid){

                    if(ChatParID.length < 1){
                    ChatParID.push(value1)
                    }

                ChatParID.forEach((value2,index) =>{
                  if(value1.toid === value2.toid && value1.fromid === userid){
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
           
            // for(let i = 0; i < ChatParID.length; i++ ){

            //    let allmodel = await models.findOne({_id:ChatParID[i].toid}).exec()
            //    let alluser = await userdb.findOne({_id:ChatParID[i].toid}).exec()

            //   //  if(!allmodel && !alluser){

            //   //   console.log("inside deleting")
            //   //  let sus =  await messagedb.deleteOne({toid:ChatParID[i].toid}).exec()
            //   //   let sus2 =  await messagedb.deleteOne({fomid:ChatParID[i].fomid}).exec()

            //   //  console.log("sus "+sus)
            //   //  }
             
            // }

           // console.log(ChatParID)

            // lets search name and photolink as a client 

            for(let i = 0; i < ChatParID.length; i++){

                if(ChatParID[i].fromid === userid){
                       console.log("on top database colotion")
                  // let Username = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[ChatParID[i].fromid])])
                  let Username = await userdb.findOne({_id:ChatParID[i].toid}).exec()
                  let modeluser = await userdb.findOne({_id:Username._id}).exec()
                 //  console.log("on top database username colotion")
                  // let Photo = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[ChatParID[i].fromid])])
                
                 
                     // console.log("on top database photo colotion")
                   if(Username){
                    let Photo = ""
                    let poto = await completedb.findOne({useraccountId:ChatParID[i].toid}).exec()

                    if(poto){
                      Photo = poto.photoLink
                    }
                    let chat = {
                        fromid: ChatParID[i].fromid,
                        toid: ChatParID[i].toid,
                        content: ChatParID[i].content,
                        date: ChatParID[i].date,
                        name:`${ Username.firstname} ${ Username.lastname}`,
                        photolink: Photo,
                        value:"recent",
                        online:modeluser.active,
                        clientid:ChatParID[i].toid,
                        photostats:"model"
                       }

                       
                       fromchat.push(chat)
                   }
             }
                
                

                
            }

          //  console.log("Under searching names as client for loop")

           

         
             // lets search name and photolink as a model 

            //  for(let i = 0; i < ChatParID.length; i++){
            //   // console.log("inside model forloop "+i)
            //   if(ChatParID[i].client === false){
            //     //console.log("inside model")
            //       if(ChatParID[i].fromid === userid){

            //       //let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[ChatParID[i].fromid])])
            //       let Model = await userdb.findOne({_id:ChatParID[i].toid}).exec()
                 
                 
            //        if(Model){

            //         let userphoto = ""
            //         let photo = await completedb.findOne({useraccountId:Model._id}).exec()

            //            if(photo){
            //             if(photo.photoLink){
            //               userphoto = photo.photoLink
            //             }
            //            }
            //           let chat = {
            //             fromid: ChatParID[i].fromid,
            //             toid: ChatParID[i].toid,
            //             content: ChatParID[i].content,
            //             date: ChatParID[i].date,
            //             name: Model.firstname,
            //             photolink: userphoto,
            //             client: ChatParID[i].client,
            //             value:"recent",
            //             online:Model.active,
            //           clientid:ChatParID[i].toid,
            //           photostats:"profile"
            //            }
            //            fromchat.push(chat)

            //       }
            //     }
            //   }
            //  }
            //  console.log("Under searching names as model for loop")


           // console.log(FullChat)

         
           }
          //    fromchat.sort((a,b)=> Number(a.date) - Number(b.date))

          //  fromchat.reverse()

          // let RecentChat1 = fromchat.slice(0,30)

            console.log("fromchat length "+fromchat.length)
          
          
           // if no recent message sent by me check sent to me
          
            const tochatlist = []
       
           if(toChats){
            
            console.log("tochat length "+toChats.length)

         //get any chat with my userid
          //  let Listofchat = Chats.documents.filter(value=>{
          //   return value.toid === userid || value.toid === userid
          //  })
          //    console.log("model recent chat length "+Chats.length)
          //    if(!Chats[0]){
          //    return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:[]})
          //    }

          

          // list of  chat perID
           let ChatParID1 = []

          // List of saturated Chat with Photo Link and names

          

           if(true){

            
           toChats.forEach((value1,index1) =>{
            console.log("tochat  index1 "+index1)
              if(value1.fromid !== userid){

                    if(ChatParID1.length <= 0){
                     ChatParID1.push(value1)
                    }

                  //  console.log("chatparid length "+ChatParID1.length)

                    if(ChatParID1.length > 0){
                        ChatParID1.forEach((value2,index) =>{
                          console.log("chatpar  index "+index)
                 
                  if(value2.fromid === value1.fromid ){
                    // console.log("adding match")
                    //  console.log("chatpar id index "+index)
                    if(Number(value1.date) > Number(value2.date)){
                      // console.log("adding match value1")
                      
                      ChatParID1[index] = value1

                     }
                     else{
                     // console.log("adding match value2")
                      ChatParID1[index] = value2

                    }
                  }
                 else if(value2.fromid !== value1.fromid){
                  
                     
                          // console.log("value1 id "+value1.fromid)
                          // console.log("value2 id "+value2.fromid)
                          ChatParID1.push(value1)

                     
                  }
                      })

                    }

              

              }

            })
           
            // for(let i = 0; i < ChatParID1.length; i++ ){

            //    let allmodel = await models.findOne({userid:ChatParID[i].fromid}).exec()
            //    let alluser = await userdb.findOne({_id:allmodel.userid}).exec()

            //    if(!allmodel && !alluser){

            //     //console.log("inside deleting")
            //    let sus =  await messagedb.deleteOne({toid:ChatParID[i].fromid}).exec()
            //     let sus2 =  await messagedb.deleteOne({fomid:ChatParID[i].toid}).exec()

            //    //console.log("sus "+sus)
            //    }
             
            // }

            console.log("chatparID length "+ChatParID1.length)

            //lets search name and photolink as a client 

            for(let i = 0; i < ChatParID1.length; i++){

              
                if(ChatParID1[i].toid === userid){
                       console.log("on top database colotion")
                   //let Username = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[ChatParID[i].fromid])])
                  let modelname = await userdb.findOne({_id:ChatParID1[i].fromid}).exec()
                 
                  console.log("on top database username colotion")
                     // let Photo = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[ChatParID[i].fromid])])
                  let Photo = ""
                     console.log("on top database photo colotion")
                   if(modelname){
                    let photolink = await completedb.findOne({useraccountId:modelname._id}).exec()
                    if(photolink.photoLink){
                      Photo = photolink.photoLink
                    }
                    let chat = {
                        toid: ChatParID1[i].toid,
                        fromid: ChatParID1[i].fromid,
                        content: ChatParID1[i].content,
                        date: ChatParID1[i].date,
                        name: modelname.firstname,
                        photolink: Photo,
                        client: ChatParID1[i].client,
                        value:"recent",
                        online:modelname.active,
                        clientid:ChatParID1[i].fromid,
                        photostats:"profile"
                       }

                       
                       tochatlist.push(chat)
                   }
             }
                
                

                
            }

           console.log("Under searching names as client for loop")

           

         
             //lets search name and photolink as a model 

            //  for(let i = 0; i < ChatParID1.length; i++){
            //   console.log("inside model forloop "+i)
            //   if(ChatParID1[i].client === false){
            //     console.log("inside model")
            //       if(ChatParID1[i].toid === userid){

            //         //let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[ChatParID[i].fromid])])
            //       let Model = await models.findOne({userid:ChatParID1[i].fromid}).exec()
                 
            //        if(Model){

            //            let userphoto = Model.photolink.split(",")

            //           let picture = ""

            //           if(userphoto){
                        
            //               picture = userphoto[0]
                        
            //           }
            //           let chat = {
            //             toid: ChatParID1[i].toid,
            //             fromid: ChatParID1[i].fromid,
            //             content: ChatParID1[i].content,
            //             date: ChatParID1[i].date,
            //             name: Model.name,
            //             photolink: picture,
            //             client: ChatParID1[i].client,
            //             value:"recent",
            //             online:Model.active,
            //             clientid:ChatParID1[i].fromid,
            //             photostats:"model"
                        
            //            }
            //            tochatlist.push(chat)

            //       }
            //     }
            //   }
            //  }
             console.log("Under searching names as model for loop")

             
          //  console.log(FullChat)

          

          // console.log(RecentChat)

           }
           }

           // tochatlist.sort((a,b)=> Number(a.date) - Number(b.date))

           //tochatlist.reverse()

           //let RecentChat = tochatlist.slice(0,30)

           // console.log("tochatlist length "+tochatlist.length)


           // sepreting the tochat and fromchat
            const allrecentList = []
          

           if(fromchat.length > 0 && tochatlist.length > 0){
              console.log(" value in both tolist and fromlist ")
            if(tochatlist.length > fromchat.length){
               console.log(" to list is bigger ")
              for(let i = 0; i < tochatlist.length; i++){
                for(let j = 0; j < fromchat.length; j++){
                    console.log("allrecentList length "+allrecentList.length)
                    console.log(" client match ")
                      // we have to choose the latest
                    if(tochatlist[i].fromid === fromchat[j].toid){
                         if(Number(tochatlist[i].date) > Number(fromchat[j].date)){
                        allrecentList.push(tochatlist[i])
                        console.log("allrecentList length inside match on tolist"+allrecentList.length)
                      }else if(Number(tochatlist[i].date) < Number(fromchat[j].date)){
                        console.log("allrecentList length inside match fromlist "+allrecentList.length)
                          allrecentList.push(fromchat[j])

                      }
                    } else{
                   console.log("pushing all")
                   allrecentList.push(tochatlist[i])
                  //  allrecentList.push(fromchat[j])
                  }

                  

                  
                }
              }

            }
            
            if(fromchat.length > tochatlist.length){

               for(let j = 0; i < fromchat.length; i++){
                for(let i = 0; j < tochatlist.length; j++){
                    console.log("allrecentList length "+allrecentList.length)
                    console.log(" client match ")
                      // we have to choose the latest
                    if(tochatlist[i].fromid === fromchat[j].toid ){
                         if(Number(tochatlist[i].date) > Number(fromchat[j].date)){
                        allrecentList.push(tochatlist[i])
                        console.log("allrecentList length inside match on tolist"+allrecentList.length)
                      }else if(Number(tochatlist[i].date) < Number(fromchat[j].date)){
                        console.log("allrecentList length inside match fromlist "+allrecentList.length)
                          allrecentList.push(fromchat[j])

                      }
                    } else{
                   console.log("pushing all")
                  //  allrecentList.push(tochatlist[i])
                   allrecentList.push(fromchat[j])
                  }

                  

                  
                }
              }
              
            }
            if(fromchat.length === tochatlist.length){

               console.log(" from list is equal ")
                fromchat.forEach((tovalue,index) =>{
                tochatlist.forEach((fromvalue,index2) =>{

                // if we get message that resembles 
                if(tovalue.toid === fromvalue.fromid ){
                 // we have to choose the latest
                  if(Number(tovalue.date) > Number(fromvalue.date)){
                    allrecentList.push(tovalue)
                  }else{
                    allrecentList.push(fromvalue)
                  }

                }else{
                  allrecentList.push(tovalue)
                  // allrecentList.push(fromvalue)
                }

              })
            })

            }
           }
            if(fromchat.length <= 0 && tochatlist.length > 0){
            tochatlist.forEach(value =>{
              allrecentList.push(value)
            })
           }
           
           if(tochatlist.length <= 0 && fromchat.length > 0){
            fromchat.forEach(value =>{
              allrecentList.push(value)
            })
           }

           console.log("all recent length "+allrecentList.length)



  


        

           // uread chat section

            let  chatting = await messagedb.find({toid:userid}).exec()
             const ureadchat = []

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

                      
                        ureadchat.push(notication)
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

                        ureadchat.push(notication)

              
                 
               }
            }
        }

        

      //  console.log("all chat "+FullChat[0].value)

      }

      if(ureadchat.length > 0 && allrecentList.length > 0){
        if(ureadchat.length > allrecentList.length ){
          ureadchat.forEach((unread,index)=>{
            allrecentList.forEach((recent,index2)=>{
              if(unread.toid === recent.toid && unread.fromid === recent.fromid || unread.toid === recent.fromid && unread.fromid === recent.toid){
                FullChat.push(unread)
              }else{
                FullChat.push(unread)
                FullChat.push(recent)
              }
            })
          })
        }else if(allrecentList.length > ureadchat.length ){
          allrecentList.forEach((unread,index)=>{
            ureadchat.forEach((recent,index2)=>{
              if(unread.toid === recent.toid && unread.fromid === recent.fromid || unread.toid === recent.fromid && unread.fromid === recent.toid){
                FullChat.push(unread)
              }else{
                FullChat.push(unread)
                FullChat.push(recent)
              }
            })
          })
        }else{
          ureadchat.forEach(value=>{
             FullChat.push(value)
            
          })

          allrecentList.forEach(value=>{
             FullChat.push(value)
            
          })
        }
      }else if(ureadchat.length <= 0){
        allrecentList.forEach(value=>{
          FullChat.push(value)
        })
      }else if(allrecentList.length <=0){
          ureadchat.forEach(value=>{
          FullChat.push(value)
        })
      }
          
         // console.log("chat content "+FullChat.length)
          return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:FullChat}) 


     }catch(err){

        console.log(err.message+"  inside recent message")
        return []
     }

}

module.exports = MsgNotify;