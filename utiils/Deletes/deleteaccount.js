let admindb = require("../../Models/admindb")
let bookdb =  require("../../Models/book")
let commentdb = require("../../Models/book")
let crushdb = require("../../Models/crushdb")
let follwerdb = require("../../Models/followers")
let gift = require("../../Models/gift")
let mainbalance = require("../../Models/mainbalance")
let messagedb = require("../../Models/message")
let reviewdb = require("../../Models/review")
let userdb = require("../../Models/userdb")
let videocalldb = require("../../Models/videoalldb")
let postdb = require("../../Models/post")
let deletelike = require("../deleteLike")
const deleteImage = require("../deleteImage")
let exclusivedb = require("../../Models/exclusivedb")
let completedb = require("../../Models/usercomplete")
let exclusivepurchase = require("../../Models/exclusivePurshase")
let modeldb = require("../../Models/models")
let blockeddb = require("../../Models/BlockedDB")


let deletedbs = async(userid)=>{

 await admindb.deleteMany({userid:userid}).exec()
 await bookdb.deleteMany({userid:userid}).exec()
 await commentdb.deleteMany({userid:userid}).exec()
 await crushdb.deleteMany({userid:userid}).exec()
 await follwerdb.deleteMany({userid:userid}).exec()
 await gift.deleteMany({userid:userid}).exec()
 await mainbalance.deleteMany({userid:userid}).exec()
 await messagedb.deleteMany({fromid:userid}).exec()
 await reviewdb.deleteMany({userid:userid}).exec()
 await userdb.deleteOne({_id:userid}).exec()
 await videocalldb.deleteMany({callerid:userid}).exec()
 await exclusivepurchase.deleteMany({userid:userid}).exec()
 await blockeddb.deleteMany({userid:userid}).exec()

 // delete like with post id

 let list_of_post = await postdb.find({userid:userid}).exec()
 let list_of_exclusve = await exclusivedb.find({userid:userid}).exec()
 let userImage = await completedb.findOne({useraccountId:userid}).exec()
 let modelimage = await modeldb.findOne({userid:userid}).exec()

 for(let i = 0; i < list_of_post.length; i++){
    await deletelike(String(list_of_post[i]._id))

    if(list_of_post[i].postlink){
    await deleteImage("post",list_of_post[i].postlink)
    }
 }

 for(let i = 0; i < list_of_exclusve.length; i++){
   
    if(list_of_exclusve[i].thumblink){
    await deleteImage("post",list_of_exclusve[i].thumblink)
    }
 }

 if(userImage){

    if(userImage.photoLink){
        await deleteImage("profile",userImage.photoLink)
     }
    await completedb.deleteOne({useraccountId:userid}).exec()
 }

 if(modelimage){

    if(modelimage.photolink){

        let images = modelimage.photolink.split(",")

        for(let i = 0; i < images.length; i++){
            await deleteImage("profile",images[i].photolink)
        }
        
     }
    await modeldb.deleteOne({userid:userid}).exec()
 }

 await postdb.deleteMany({userid:userid}).exec()
 await exclusivedb.deleteMany({userid:userid}).exec()
 
}

module.exports = deletedbs;