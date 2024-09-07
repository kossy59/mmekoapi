const {connectdatabase} = require('../../config/connectDB')
const sdk = require("node-appwrite");

const MsgNotify = async(req,res)=>{

    let userid = req.body.userid;

     let data = await connectdatabase();

     try{
         let Chats = await data.databar.listDocuments(data.dataid,data.msgCol)
         let Username = await data.databar.listDocuments(data.dataid,data.colid)
         let Photo = await data.databar.listDocuments(data.dataid,data.userincol)
         let Model = await data.databar.listDocuments(data.dataid,data.modelCol)
         
         // get any chat with my userid
           let Listofchat = Chats.documents.filter(value=>{
            return value.toid === userid || value.toid === userid
           })

             if(!Listofchat[0]){
             return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:[]})
             }

          

           //list of  chat perID
           let ChatParID = []

           //List of saturated Chat with Photo Link and names

           let FullChat = []

            Listofchat.forEach(value1 =>{
              if(value1.notify === false){
                    if(ChatParID.length <= 0){
                    ChatParID.push(value1)
                  }
                ChatParID.forEach((value2,index) =>{
                  if(value1.fromid === value2.fromid || value1.fromid === value2.toid && value1.toid === value2.fromid || value1.toid === value2.toid){
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

            // lets search name and photolink as a client 

            ChatParID.forEach(value =>{
              Username.documents.forEach(user =>{

                if(value.fromid !== userid && value.fromid === user.$id ){
                  Photo.documents.forEach(image =>{
                    if(user.$id === image.useraccountId){
                       let chat = {
                        fromid: value.fromid,
                        toid: value.toid,
                        content: value.content,
                        date: value.date,
                        name: user.firstname,
                        photolink: image.photoLink,
                        client: value.client,
                        value:"recent"
                       }
                       FullChat.push(chat)
                    }
                  })
                 
                
                } else if(value.toid !== userid && value.toid === user.$id ){
                  Photo.documents.forEach(image =>{
                    if(user.$id === image.useraccountId){
                       let chat = {
                        fromid: value.fromid,
                        toid: value.toid,
                        content: value.content,
                        date: value.date,
                        name: user.firstname,
                        photolink: image.photoLink,
                        client: value.client,
                        value:"recent"
                       }
                       FullChat.push(chat)
                    }
                  })
                 
                }
              })
            })

             // lets search name and photolink as a model 

             ChatParID.forEach(value =>{
              Model.documents.forEach(user =>{
                if(value.fromid !== userid && value.fromid === user.$id){

                  let picture = user.photolink.split(",")
                    let chat = {
                        fromid: value.fromid,
                        toid: value.toid,
                        content: value.content,
                        date: value.date,
                        name: user.name,
                        photolink: picture[0],
                        client: value.client,
                        value:"recent"
                       }
                       FullChat.push(chat)

                }else  if(value.toid !== userid && value.toid === user.$id){

                  let picture = user.photolink.split(",")
                    let chat = {
                        fromid: value.fromid,
                        toid: value.toid,
                        content: value.content,
                        date: value.date,
                        name: user.name,
                        photolink: picture[0],
                        client: value.client,
                        value:"recent"
                       }
                       FullChat.push(chat)

                }
              })
             })



           // console.log(FullChat)

           FullChat.sort((a,b)=> Number(a.date) - Number(b.date)).reverse()

           let RecentChat = FullChat.slice(0,30)

           console.log(RecentChat)

          
        
          return res.status(200).json({"ok":true,"message":`user host empty`,lastchat:FullChat}) 

          
      


     }catch(err){

        console.log(err.message)
        return []
     }

}

module.exports = MsgNotify;