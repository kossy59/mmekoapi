// const {connectdatabase} = require('../../config/connectDB')
// const sdk = require("node-appwrite");

const messagedb = require("../../Models/message")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const models = require("../../Models/models")

const MsgNotify = async(req,res)=>{

    let userid = req.body.userid;

    // let data = await connectdatabase();

     console.log("inside recent message "+userid)

     try{
        // let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.limit(200), sdk.Query.equal("fromid",[userid])])

        let Chats = await messagedb.find({fromid:userid}).exec()
        
        
         
         
         // get any chat with my userid
          //  let Listofchat = Chats.documents.filter(value=>{
          //   return value.toid === userid || value.toid === userid
          //  })
             console.log("model recent chat length "+Chats.length)
             if(!Chats[0]){
             return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:[]})
             }

          

           //list of  chat perID
           let ChatParID = []

           //List of saturated Chat with Photo Link and names

           let FullChat = []

            Chats.forEach(value1 =>{
              if(value1.notify === false){

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
                      ChatParID[index] = value1

                    }else{
                      ChatParID[index] = value2

                    }
                  }
                })

              }

            })

            console.log(ChatParID)

            // lets search name and photolink as a client 

            for(let i = 0; i < ChatParID.length; i++){

                if(ChatParID[i].client === true){
                if(ChatParID[i].fromid === userid){
                       console.log("on top database colotion")
                  // let Username = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[ChatParID[i].fromid])])
                  let Username = await userdb.findOne({_id:ChatParID[i].fromid})
                   console.log("on top database username colotion")
                  // let Photo = await data.databar.listDocuments(data.dataid,data.userincol,[sdk.Query.equal("useraccountId",[ChatParID[i].fromid])])
                  let Photo = await completedb.findOne({useraccountId:ChatParID[i].fromid})
                      console.log("on top database photo colotion")
                   if(Username.length > 0){

                    let chat = {
                        fromid: ChatParID[i].fromid,
                        toid: ChatParID[i].toid,
                        content: ChatParID[i].content,
                        date: ChatParID[i].date,
                        name: Username.firstname,
                        photolink: Photo.photoLink,
                        client: ChatParID[i].client,
                        value:"recent"
                       }

                       
                       FullChat.push(chat)
                   }
             }
                
                

                }
            }

            console.log("Under searching names as client for loop")

           

         
             // lets search name and photolink as a model 

             for(let i = 0; i < ChatParID.length; i++){
               console.log("inside model forloop "+i)
              if(ChatParID[i].client === false){
                console.log("inside model")
                  if(ChatParID[i].fromid === userid){

                  //let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[ChatParID[i].fromid])])
                  let Model = await models.findOne({userid:ChatParID[i].fromid})
                   if(Model){

                      let picture = Model.photolink.split(",")
                      let chat = {
                        fromid: ChatParID[i].fromid,
                        toid: ChatParID[i].toid,
                        content: ChatParID[i].content,
                        date: ChatParID[i].date,
                        name: Model.name,
                        photolink: picture[0],
                        client: ChatParID[i].client,
                        value:"recent"
                       }
                       FullChat.push(chat)

                  }
                }
              }
             }
              console.log("Under searching names as model for loop")


           // console.log(FullChat)

           FullChat.sort((a,b)=> Number(a.date) - Number(b.date))

           FullChat.reverse()

           let RecentChat = FullChat.slice(0,30)

           console.log(RecentChat)
   
          return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:FullChat}) 


     }catch(err){

        console.log(err.message+"  inside recent message")
        return []
     }

}

module.exports = MsgNotify;