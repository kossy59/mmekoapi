const {connectdatabase, client} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createModel = async (req,res)=>{

    const userid = req.body.modelid;
    const clientid = req.body.clientid
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    let data = await connectdatabase()

    try{
      
           let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.limit(200), sdk.Query.and([
            sdk.Query.or([sdk.Query.equal("toid",[userid]), sdk.Query.equal("toid",[clientid])]),
            sdk.Query.or([sdk.Query.equal("fromid",[userid]), sdk.Query.equal("fromid",[clientid])])
           ])])

          
           console.log("number of chats "+Chats.documents.length)
         
        //    let Listofchat = Chats.documents.filter(value=>{
        //     return  (value.toid === userid || value.fromid === userid) && (value.toid === clientid || value.fromid === clientid) 
        //    })

          

           if(!Chats.documents[0]){
            return res.status(200).json({"ok":true,"message":`user host empty`,chats:[]})
           }
           // fecting unviewed notification chats
            let unviewing = Chats.documents.filter(value =>{
                return value.notify === true;
            
            })
            
           
            // setting them to notified
        
            for(let i = 0; i < unviewing.length; i++){
                if(unviewing[i].toid === clientid){
                    await data.databar.updateDocument(data.dataid,data.msgCol,unviewing[i].$id,{notify:false})
                }
            }
             

            //let msg = await data.databar.listDocuments(data.dataid,data.msgCol)
            let msglist = Chats.documents.sort((a,b)=>{
                return Number(a.date) - Number(b.date)
            })
             console.log('under sorting')

            let chatslice = msglist.slice(0,100)
             console.log('under slice')

            let Listchat =[]

            //getting chats sent by me
            let myChat = chatslice.filter(value=>{
                return value.fromid === userid;
            })
             console.log('under chat sent by me')

            //getting client chats
            let clientchat = chatslice.filter(value =>{
                return value.fromid === clientid
            })
             console.log('under client chat')

            //now let marshal my chat names and photolink as ordinary client user

          
            for(let i = 0; i < myChat.length; i++){
                if(myChat[i].client === true){

                     let usernames = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[myChat[i].fromid])])
                     let photos = await data.databar.listDocuments(data.dataid,data.userincol, [sdk.Query.equal("useraccountId",[myChat[i].fromid])])

                     if(usernames.documents[0]){
                         let chat = {
                                id: myChat[i].fromid,
                                content:  myChat[i].content,
                                date:  myChat[i].date,
                                name: usernames.documents[0].firstname,
                                photolink: photos.documents[0].photoLink,
                                client: myChat[i].client
                            }

                         Listchat.push(chat)
                     }
                }
            }


           
            console.log('under  my chat names and photolink as ordinary client user')


            //now let marshal my chat names and photolink as a model user

        
            for(let i = 0; i < myChat.length; i++){
                if(myChat[i].client === false){
                    let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[myChat[i].fromid])])
                    let photolink = Model.documents[0].photolink.split(",")
                        let chat = {
                            id: myChat[i].fromid,
                            content:  myChat[i].content,
                            date: myChat[i].date,
                            photolink: photolink[0],
                            name: Model.documents[0].name,
                            client: myChat[i].client
                        }
                        Listchat.push(chat)
                }
            }
           
             console.log('under  my chat names and photolink as a model user')


            // now let marshal our client chat names and photolink as ordinary client user

           
            
            for(let i = 0; i <  clientchat.length; i++){
                if(clientchat[i].client == true){
                     let usernames = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[clientchat[i].fromid])])
                     let photos = await data.databar.listDocuments(data.dataid,data.userincol, [sdk.Query.equal("useraccountId",[clientchat[i].fromid])])

                     if(usernames.documents[0]){
                         let chat = {
                                id: clientchat[i].fromid,
                                content:  clientchat[i].content,
                                date:  clientchat[i].date,
                                name: usernames.documents[0].firstname,
                                photolink: photos.documents[0].photoLink,
                                client: clientchat[i].client
                            }

                         Listchat.push(chat)
                     }
                }
            }
            console.log('under  our client chat names and photolink as ordinary client user')

            // now marshal our client chat names and photolink as a model client user

          
            for(let i = 0; i < clientchat.length; i++){

                if(clientchat[i].client === false){

                    let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[clientchat[i].fromid])])
                     if(Model.documents[0]){
                         let photolink = Model.documents[0].photolink.split(",")
                        let chat = {
                            id: clientchat[i].fromid,
                            content:  clientchat[i].content,
                            date: clientchat[i].date,
                            photolink: photolink[0],
                            name: Model.documents[0].name,
                            client: clientchat[i].client
                        }
                        Listchat.push(chat)
                     }
                }
            }
          
            console.log('under  our client chat names and photolink as ordinary client user')
                 console.log(Listchat) 
                 let allchat = Listchat.sort((a,b)=>{
                return Number(a.date) - Number(b.date)
            }) 
          return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,chats:allchat})

          
          }catch(err){
            console.log("message erro "+err)
           return res.status(500).json({"ok":false,'message': `${err.message}!`});

           
       }
}

module.exports = createModel