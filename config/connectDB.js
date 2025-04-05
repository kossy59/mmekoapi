const sdk = require("node-appwrite");
const {initalizeDB} = require('../Model/userdb')
const {initalizeer} = require('../Model/usercomplete')
const {initalizePost} = require('../Model/post')
const {initalizeComment}  = require('../Model/comment')
const {initalizeLike}  = require('../Model/like')
const {initalizeShare}  = require('../Model/share')
const {initalizeModel} = require('../Model/models')
const {initalizeMessage} = require('../Model/message')


require('dotenv').config()
const client = new sdk.Client()
let memkodbID;
let memko_socialDB = ''
let colID = ''
let userCOL = ''
let colPost = ''
let colComment =''
let colLike = ''
let colShare = ''
let colModel = ''
let colMsg

client.setEndpoint("https://cloud.appwrite.io/v1")
.setProject(process.env.PROJECTID)
.setKey(process.env.APIKEY);
var database = new sdk.Databases(client);

async function connectdatabase(){

    try{
        if((await database.list()).databases.length <= 0){
            memkodbID = await database.create(
                sdk.ID.unique(),
                'memkosocialDB'
            )
            memko_socialDB = String(memkodbID.$id)
    
           // database.createStringAttribute()
           let userdata = await initalizeDB(memkodbID.$id,database)
           colID = String(userdata.$id)
    
           let userCom = await initalizeer(memkodbID.$id,database)
           userCOL =  String(userCom.$id)
    
           let userpost = await initalizePost(memkodbID.$id,database)
           colPost = String(userpost.$id)
    
           let usercomment = await initalizeComment(memkodbID.$id,database)
           colComment = String(usercomment.$id)
    
    
           
           let userlike = await initalizeLike(memkodbID.$id,database)
           colLike = String(userlike.$id)
    
           let usershare = await initalizeShare(memkodbID.$id,database)
           colShare = String(usershare.$id)
    
           let usersmodel = await initalizeModel(memkodbID.$id,database)
           colModel = String(usersmodel.$id)

            let usermsg = await initalizeMessage(memkodbID.$id,database)
            colMsg = String(usermsg.$id)
    
           
        
    
        }else{
            let db = (await database.list()).databases.filter(value=>{
                return value.name === "memkosocialDB"
            })
            memkodbID = db[0];
            memko_socialDB = String(db[0].$id)
    
            coll = await database.listCollections(db[0].$id);
            let collection = coll.collections.filter(value=>{
                return value.name === "userDB"
            })
    
            colID = String(collection[0].$id)
    
            let userincol = await database.listCollections(db[0].$id);
            let userinfocollectin = userincol.collections.filter(value=>{
                return value.name === "userInfo"
            })
    
            userCOL = String(userinfocollectin[0].$id)
    
            let userpost = await database.listCollections(db[0].$id);
            let postcollectin = userpost.collections.filter(value=>{
                return value.name === "Post"
            })
    
            colPost = String(postcollectin[0].$id)
    
            let usercomment = await database.listCollections(db[0].$id);
            let commentcollectin = usercomment.collections.filter(value=>{
                return value.name === "Comment"
            })
    
            colComment = String(commentcollectin[0].$id)

            let userlike = await database.listCollections(db[0].$id);
            let likecollectin = userlike.collections.filter(value=>{
                return value.name === "Like"
            })
    
            colLike = String(likecollectin[0].$id)
    
            let usershare = await database.listCollections(db[0].$id);
            let sharecollectin = usershare.collections.filter(value=>{
                return value.name === "Share"
            })
    
            colShare = String(sharecollectin[0].$id)

            let usermodel = await database.listCollections(db[0].$id);
            let modelcollectin = usermodel.collections.filter(value=>{
                return value.name === "Model"
            })
    
            colModel = String(modelcollectin[0].$id)


             let usermsg = await database.listCollections(db[0].$id);
             let msgcol = usermsg.collections.filter(value=>{
                return value.name === "Message"
            })
    
            colMsg = String(msgcol[0].$id)
    
           
        }
    
    
    
       // console.log(memko_socialDB)
      // console.log(colID)
    
      return{
        colid:colID,
        dataid:memko_socialDB,
        databar:database,
        userincol:userCOL,
        postCol:colPost,
        commentCol:colComment,
        likeCol:colLike,
        shareCol:colShare,
        modelCol:colModel,
        msgCol:colMsg
      }

    }catch(err){
        
    }
  


}






module.exports = {client,memko_socialDB,database,connectdatabase,colID}