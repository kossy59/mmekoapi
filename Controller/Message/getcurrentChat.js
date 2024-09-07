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
      
           let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.limit(200) ,sdk.Query.and([sdk.Query.equal("toid",[`${userid}`,`${clientid}`]), sdk.Query.equal("fromid",[`${userid}`,`${client}`])],  )])
           let Listofusername = await data.databar.listDocuments(data.dataid,data.colid)
           let Listofmodel = await data.databar.listDocuments(data.dataid,data.modelCol)
           let Listofuserphoto = await data.databar.listDocuments(data.dataid,data.userincol)
           console.log("number of chats "+Chats.documents.length)
         
           let Listofchat = Chats.documents.filter(value=>{
            return  (value.toid === userid || value.fromid === userid) && (value.toid === clientid || value.fromid === clientid) 
           })

          

           if(!Listofchat[0]){
            return res.status(200).json({"ok":true,"message":`user host empty`,chats:[]})
           }
           // fecting unviewed notification chats
            let unviewing = Listofchat.filter(value =>{
                return value.notify === true;
            
            })
            
           
            // setting them to notified
            unviewing.forEach(async (value)=>{
                if(value.toid === clientid ){
                    
                     await data.databar.updateDocument(data.dataid,data.msgCol,value.$id,{notify:false})
                    
                }
                 
            })
             

            let msg = await data.databar.listDocuments(data.dataid,data.msgCol)
            let msglist = msg.documents.sort((a,b)=>{
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
            for(let i = 0; i< Listofusername.documents.length; i++){
                for(let j = 0; j < Listofuserphoto.documents.length; j++){
                    for(let k = 0; k < myChat.length; k++){
                       if(myChat[k].fromid === Listofusername.documents[i].$id){
                        if(Listofusername.documents[i].$id === Listofuserphoto.documents[j].useraccountId){
                            let chat = {
                                id: myChat[k].fromid,
                                content:  myChat[k].content,
                                date:  myChat[k].date,
                                name: Listofusername.documents[i].firstname,
                                photolink: Listofuserphoto.documents[j].photoLink,
                                client: myChat[k].client
                            }

                         Listchat.push(chat)
                        }
                       }
                    }
                }
            }
            console.log('under  my chat names and photolink as ordinary client user')


            //now let marshal my chat names and photolink as a model user

            for(let i = 0; i < Listofmodel.documents.length; i++){
                for(let j = 0; j < myChat.length; j++){
                    if(myChat[j].fromid === Listofmodel.documents[i].$id){
                        let photolink = Listofmodel.documents[i].photolink.split(",")
                        let chat = {
                            id: myChat[j].fromid,
                            content:  myChat[j].content,
                            date: myChat[j].date,
                            photolink: photolink[0],
                            name: Listofmodel.documents[i].name,
                            client: myChat[j].client
                        }
                        Listchat.push(chat)
                    }
                }
            }
             console.log('under  my chat names and photolink as a model user')


            // now let marshal our client chat names and photolink as ordinary client user

             for(let i = 0; i< Listofusername.documents.length; i++){
                for(let j = 0; j < Listofuserphoto.documents.length; j++){
                    for(let k = 0; k < clientchat.length; k++){
                       if(clientchat[k].fromid === Listofusername.documents[i].$id){
                        if(Listofusername.documents[i].$id === Listofuserphoto.documents[j].useraccountId){
                            let chat = {
                                id: clientchat[k].fromid,
                                content:  clientchat[k].content,
                                date:  clientchat[k].date,
                                name: Listofusername.documents[i].firstname,
                                photolink: Listofuserphoto.documents[j].photoLink,
                                favourite: clientchat[k].favourite,
                                client: clientchat[k].client
                            }

                         Listchat.push(chat)
                        }
                       }
                    }
                }
            } console.log('under  our client chat names and photolink as ordinary client user')

            // now marshal our client chat names and photolink as a model client user
            for(let i = 0; i < Listofmodel.documents.length; i++){
                for(let j = 0; j < clientchat.length; j++){
                    if(clientchat[j].fromid === Listofmodel.documents[i].$id){
                        let photolink = Listofmodel.documents[i].photolink.split(",")
                        let chat = {
                            id: clientchat[j].fromid,
                            content:  clientchat[j].content,
                            date: clientchat[j].date,
                            photolink: photolink[0],
                            name: Listofmodel.documents[i].name,
                            favourite: clientchat[j].favourite,
                            client:clientchat[j].client
                            
                            
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