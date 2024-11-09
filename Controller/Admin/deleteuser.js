const admindb = require("../../Models/admindb")
const bookingdb = require("../../Models/book")
const commentdb = require("../../Models/comment")
const giftdb = require("../../Models/gift")
const likedb = require("../../Models/like")
const mainbalancedb = require("../../Models/mainbalance")
const messagedb = require("../../Models/message")
const modelsdb = require("../../Models/models")
const postdb = require("../../Models/post")
const reviewdb = require("../../Models/review")
const userphotodb = require("../../Models/usercomplete")
const sharedb = require("../../Models/share")
let userdb = require("../../Models/userdb")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
 

        let user = await userdb.findOne({_id:userid}).exec()

        if(!user){
            return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
        }


        let booking = await bookingdb.deleteMany({userid:userid})
        let gift = await giftdb.deleteMany({userid:userid}).exec()
        let mainB = await mainbalancedb.deleteMany({userid:userid}).exec()
        let review = await reviewdb.deleteMany({userid:userid}).exec()
        let model = await modelsdb.findOne({userid:userid}).exec()
        let send_to = await messagedb.find({fromid:userid}).exec()
        let rev_from = await messagedb.find({toid:userid}).exec()
        let modelphoto = []

        if(model){
             if(model.photolink){
              modelphoto = model.photolink.split(",")
           }

        }

       

        if(send_to){
            
         await messagedb.deleteMany({fromid:userid}).exec()
            
        }

        if(rev_from){
            
         await messagedb.deleteMany({toid:userid}).exec()
            
        }

   

        let model2 = await modelsdb.deleteOne({userid:userid}).exec()

        

        let post = await postdb.find({userid:userid}).exec()
        let postphoto =[]

        if(post){
              post.forEach(value =>{
                if(value.postlink){
                postphoto.push(value.postlink)
              }
            })
        }

        if(post){

             for(let i = 0; i < post.length; i++){
             await commentdb.deleteOne({postid:post[i]._id}).exec()
             await likedb.deleteOne({postid:post[i]._id}).exec()
            }

        }

       

        let userphoto = await userphotodb.findOne({useraccountId:userid}).exec()

        let userimage = []

        if(userphoto){

            if(userphoto.photoLink){
              userimage = userphoto.photoLink.split(",")
            }
        }

       
        let userphoto1 = await userphotodb.deleteOne({useraccountId:userid}).exec()

        let post2 = await postdb.deleteMany({userid:userid}).exec()

        let data = {
            userid : userid,
            email : user.email,
            delete:true,
            message:"account not available"
        }

        let newAdmin = await admindb.create(data)

        let photos = {
            modelphoto : modelphoto,
            postphoto : postphoto,
            profilephoto : userimage
        }



   

    
         console.log(photos.postphoto)
         console.log(photos.modelphoto)
         console.log(photos.profilephoto)

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,photos:photos})
      
       try{
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost