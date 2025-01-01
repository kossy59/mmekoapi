// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const commentdb = require("../../Models/comment")
const likedb = require("../../Models/like")
const postdb = require("../../Models/post")
let exclusivedb = require("../../Models/exclusivedb")
let followersdb = require("../../Models/followers")

const readProfile = async (req,res)=>{

    const userid = req.body.userid;
     let likecount = 0
   // let data = await connectdatabase()

    try{

            // let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)
            // let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)
            // let  commentDB = await data.databar.listDocuments(data.dataid,data.commentCol)
            // let  likeDB = await data.databar.listDocuments(data.dataid,data.likeCol)
            // let  postDB = await data.databar.listDocuments(data.dataid,data.postCol)

            // let du = dupplicate.documents.find(value=>{
            //     return value.$id === userid
            //    })
              
               let du = await userdb.findOne({_id:userid}).exec()
              

            //    let com = comdb.documents.find(value=>{
            //     return value.useraccountId === userid
            //    })

               let com = await completedb.findOne({useraccountId:userid}).exec()
               let commentDB = await commentdb.find().exec()
               let likeDB = await likedb.find().exec()
                
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user cant view this post!!'});
        
               }

                let postDB = await postdb.find({userid:userid}).exec()

               let user = {
                userid:du._id,
                exclusive:du.exclusive_verify,
                username:`${du.firstname} ${du.lastname}`,
                admin:du.admin,
                userphoto:com.photoLink,
                nickname:`${du.nickname}`,
                aboutuser:`${com.details}`,
                location: `${du.state}, ${du.country}`,
                active:du.active,
                gender:du.gender,
                post:[],
                firstname:du.firstname,
                lastname:du.lastname,
                exclusive_content:[],
                followers:[],
                joined_month:`${du._id.getTimestamp().getMonth()}`,
                joined_year:`${du._id.getTimestamp().getFullYear()}`,
                likecount:0
               }

               console.log("date joined "+user.joined_month)
               console.log("date joined "+user.joined_year)

              let exclusiveData = await exclusivedb.find({userid:userid}).exec()

              if(exclusiveData){
                user.exclusive_content = exclusiveData
              }

              let followers = await followersdb.find({userid:userid}).exec()

              if(followers){
                user.followers = followers
              }

              

               if(postDB.length > 0){
                postDB.forEach(value =>{
                      con = {
                        content:value.content,
                        postphoto: `${value.postlink}`,
                        posttime: `${value.posttime}`,
                        posttype: `${value.posttype}`,
                        postid: `${value._id}`,
                        userid:du._id,
                        active:du.active,
                        comment:[],
                        like:[]
                    }
                    user.post.push(con)

                })

               }

            //    for(let i = 0; i < postDB.documents.length; i++){

            //     if(postDB.documents[i].userid === du.$id){
            //         con = {
            //             content:postDB.documents[i].content,
            //             postphoto: `${postDB.documents[i].postlink}`,
            //             posttime: `${postDB.documents[i].posttime}`,
            //             posttype: `${postDB.documents[i].posttype}`,
            //             postid: `${postDB.documents[i].$id}`,
            //             userid:du.$id,
            //             active:du.active,
            //             comment:[],
            //             like:[]
            //         }
            //         user.post.push(con)
            //     }

            //    }


           



            //    for(let i = 0; i<user.post.length; i++){
                
            //     if(commentDB.documents.length <= 0){
                    
            //         continue;
                    
            //     }else{

            //         for(let j = 0; j < commentDB.documents.length; j++){
            //         if(user.post[i].postid === commentDB.documents[j].postid){
            //         user.post[i].comment.push(commentDB.documents[j])
            //         }

            //       }
            //     }
                
            //      }

             

            user.post.forEach((value, index) =>{
             
                commentDB.forEach(value1 =>{
                   
                    if(String(value.postid) === String(value1.postid)){
                        
                        user.post[index].comment.push(value1)
                    }
                })

            })

             

            // for(let i = 0; i<user.post.length; i++){

            //     if(likeDB.documents.length <= 0){
  
            //      continue;
                  
            //     }else{
  
            //       for(let j = 0; j < likeDB.documents.length; j++){
            //        if(user.post[i].postid === likeDB.documents[j].postid){
            //            user.post[i].like.push(likeDB.documents[j])
            //        }
  
            //       }
            //   }
            //   }

                 user.post.forEach((value, index) =>{
                   likeDB.forEach(value1 =>{
                    if(String(value.postid) === String(value1.postid)){
                        user.post[index].like.push(value1)
                        likecount = likecount + 1
                    }
                })

            })

        user.likecount = likecount


            return res.status(200).json({"ok":true,"message":`All Post`,profile:user})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readProfile
