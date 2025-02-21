// const {connectdatabase, client} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const messagedb = require("../../Models/message")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const models = require("../../Models/models")

const createModel = async (req,res)=>{

    const userid = req.body.modelid;
    const clientid = req.body.clientid
    const mychat = req.body.mychat

    
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

   //let data = await connectdatabase()

    try{

        let chatInfo = {}


             let clientinfo = await userdb.findOne({_id:userid}).exec()
            if(clientinfo){
                let photos = await completedb.findOne({useraccountId:clientinfo._id}).exec()
                let image = ''
                if(photos){
                    image = photos.photoLink
                }
               
                chatInfo.name = `${clientinfo.firstname} ${clientinfo.lastname}`
                chatInfo.photolink = image
                chatInfo.value = "client"
                chatInfo.id = clientinfo._id
                console.log("success getting client info")
            }

        
       

        // console.log("this is chatinfo "+chatInfo)
        //    let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.limit(200), sdk.Query.and([
        //     sdk.Query.or([sdk.Query.equal("toid",[userid]), sdk.Query.equal("toid",[clientid])]),
        //     sdk.Query.or([sdk.Query.equal("fromid",[userid]), sdk.Query.equal("fromid",[clientid])])
        //    ])])

           let chating = await messagedb.find().exec();

           let Chats = chating.filter(value =>{
             return String(value.toid) === String(userid) || String(value.fromid) === String(userid) && String(value.fromid) === String(clientid) || String(value.toid)  === String(clientid)
           })

          
           console.log("number of chats "+Chats.length)
         
      

          

           if(!Chats[0]){
            return res.status(200).json({"ok":true,"message":`user host empty`,chats:[],chatInfo})
           }
           // fecting unviewed notification chats
            let unviewing = Chats.filter(value =>{
                return value.notify === true && String(value.toid) === String(clientid)
            
            })
            
           
           console.log("list of unview chat "+unviewing.length)
          

                
                    for(let i = 0; i < unviewing.length; i++){
                       
                            unviewing[i].notify = false;
                           await unviewing[i].save()
                        
                      }

            
             

            //let msg = await data.databar.listDocuments(data.dataid,data.msgCol)
            let msglist = Chats.sort((a,b)=>{
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
             console.log('under client chat '+clientchat)

            //now let marshal my chat names and photolink as ordinary client user

          
            for(let i = 0; i < myChat.length; i++){
               
                     //let usernames = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[myChat[i].fromid])])
                     //let photos = await data.databar.listDocuments(data.dataid,data.userincol, [sdk.Query.equal("useraccountId",[myChat[i].fromid])])
                     let usernames = await userdb.findOne({_id:myChat[i].fromid}).exec()
                     let photos = await completedb.findOne({useraccountId:myChat[i].fromid})

                     if(usernames){
                         let chat = {
                                id: myChat[i].fromid,
                                content:  myChat[i].content,
                                date:  myChat[i].date,
                                name: usernames.firstname,
                                photolink: photos.photoLink,
                                client: myChat[i].client
                            }

                         Listchat.push(chat)
                     }
                
            }


           
            console.log('under  my chat names and photolink as ordinary client user ')


            //now let marshal my chat names and photolink as a model user

        
            // for(let i = 0; i < myChat.length; i++){
            //     if(myChat[i].client === false){
            //         //let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[myChat[i].fromid])])
            //         let Model = await models.findOne({userid:myChat[i].fromid})
            //         let photolink = Model.photolink.split(",")
            //             let chat = {
            //                 id: myChat[i].fromid,
            //                 content:  myChat[i].content,
            //                 date: myChat[i].date,
            //                 photolink: photolink[0],
            //                 name: Model.name,
            //                 client: myChat[i].client
            //             }
            //             Listchat.push(chat)
            //     }
            // }
           



            // now let marshal our client chat names and photolink as ordinary client user

           
            
            for(let i = 0; i <  clientchat.length; i++){

                     //let usernames = await data.databar.listDocuments(data.dataid,data.colid,[sdk.Query.equal("$id",[clientchat[i].fromid])])
                     //let photos = await data.databar.listDocuments(data.dataid,data.userincol, [sdk.Query.equal("useraccountId",[clientchat[i].fromid])])
                     let usernames = await userdb.findOne({_id:clientchat[i].fromid}).exec()
                     let photos = await completedb.findOne({useraccountId:clientchat[i].fromid}).exec()

                     if(usernames){
                         let chat = {
                                id: clientchat[i].fromid,
                                content:  clientchat[i].content,
                                date:  clientchat[i].date,
                                name: usernames.firstname,
                                photolink: photos.photoLink,
                                client: clientchat[i].client
                            }

                         Listchat.push(chat)
                     }
                
            }
           // console.log('under  our client chat names and photolink as ordinary client user')

            // now marshal our client chat names and photolink as a model client user

          
            // for(let i = 0; i < clientchat.length; i++){

            //     if(clientchat[i].client === false){

            //        // let Model = await data.databar.listDocuments(data.dataid,data.modelCol,[sdk.Query.equal("userid",[clientchat[i].fromid])])
            //        let Model = await models.findOne({userid:clientchat[i].fromid})
            //          if(Model){
            //              let photolink = Model.photolink.split(",")
            //             let chat = {
            //                 id: clientchat[i].fromid,
            //                 content:  clientchat[i].content,
            //                 date: clientchat[i].date,
            //                 photolink: photolink[0],
            //                 name: Model.name,
            //                 client: clientchat[i].client
            //             }
            //             Listchat.push(chat)
            //          }
            //     }
            // }
          
            // console.log('under  our client chat names and photolink as ordinary client user')
            //      console.log(Listchat) 
                 let allchat = Listchat.sort((a,b)=>{
                return Number(a.date) - Number(b.date)
            }) 
            console.log("all chat "+allchat.length)
          return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,chats:allchat,chatInfo})

          
          }catch(err){
            console.log("message erro "+err)
           return res.status(500).json({"ok":false,'message': `${err.message}!`});

           
       }
}

module.exports = createModel