const followerdb = require("../../Models/followers")
const userdb = require("../../Models/userdb")
const modeldb = require("../../Models/models")
const photodb = require("../../Models/usercomplete")

const createModel = async (req,res)=>{

    const userid = req.body.userid

   
    if(!userid ){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    try{


        let follows = {
            followers : [],
            following : []
        }
       
        let followers = await followerdb.find({userid:userid}).exec()
        //console.log("getting follower")
        if(followers){

           // console.log("got the follower")
            for(let i = 0; i < followers.length; i++){
               let canmessage = false
               let modelid = ""
               let photolink = ""
               let  username = await userdb.findOne({_id:followers[i].followerid}).exec()
               let  model = await modeldb.findOne({userid:followers[i].followerid}).exec()

               
                if(username){
                   let photo = await photodb.findOne({useraccountId:followers[i].followerid}).exec()
                    if(model){
                        canmessage = true
                        modelid = model._id
                    }

                    if(photo){
                        photolink = photo.photoLink
                    }

                    let user = {
                        name : `${username.firstname} ${username.lastname}`,
                        image : photolink,
                        canmessage:canmessage,
                        modelid:modelid,
                        id: username._id,
                        following:false
                    }

                    follows.followers.push(user)
                }
            }
        }

        let followings = await followerdb.find({followerid:userid}).exec()
       // console.log("getting follower")
        if(followings){
            //console.log("got the followings")
            for(let i = 0; i < followings.length; i++){
               let canmessage = false
               let modelid = ""
               let photolink = ""
               let  username = await userdb.findOne({_id:followings[i].userid}).exec()
               let  model = await modeldb.findOne({userid:followings[i].userid}).exec()

              // console.log("under following model")
                if(username){
                   // console.log("inside there is user")
                   let photo = await photodb.findOne({useraccountId:followings[i].userid}).exec()
                    if(model){
                       // console.log("inside she is model")
                        canmessage = true
                        modelid = model.userid
                    }

                    if(photo){
                       // console.log("inside has photo")
                        photolink = photo.photoLink
                    }

                    let user = {
                        name : `${username.firstname} ${username.lastname}`,
                        image : photolink,
                        canmessage:canmessage,
                        modelid:modelid,
                        id: username._id,
                        following:true
                    }

                    follows.following.push(user)
                }
            }
        }


        return res.status(200).json({"ok":true,"message":`followed successfully`, data:follows})
      
          
    }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
    }
}

module.exports = createModel
