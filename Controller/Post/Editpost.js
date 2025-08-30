// const { Duplex } = require('nodemailer/lib/xoauth2');
// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const postdb = require("../../Models/post")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const commentdb = require("../../Models/comment")
const likedb = require("../../Models/like")

const updatePost = async (req, res) => {

    const postid = req.body.postid;

    if (!postid) {
        return res.status(400).json({ "ok": false, 'message': 'user Id invalid!!' })
    }

    console.log("na here like dey post id " + postid)

    //let data = await connectdatabase()
    let post = {}

    try {

        // let  dupplicate = await data.databar.listDocuments(data.dataid,data.postCol)

        // let du = dupplicate.documents.find(value=>{
        //     return value.$id === postid
        //    })

        let du = await postdb.findOne({ _id: postid }).exec()
        console.log("post id " + du._id)
        console.log("post content " + du.content)
        let userdatabase = await userdb.find().exec()
        let completedatabase = await completedb.find().exec()
        let commentdatabase = await commentdb.find().exec()
        let likedatabase = await likedb.find().exec()


        if (!du) {

            return res.status(409).json({ "ok": false, 'message': 'current user can not edit this post!!' });

        }

        userdatabase.forEach(username => {
            completedatabase.forEach(userphoto => {


                if (String(du.userid) === String(username._id) && String(username._id) === String(userphoto.useraccountId)) {

                    post = {
                        username: `${username.firstname} ${username.lastname}`,
                        nickname: `${username.nickname}`,
                        userphoto: `${userphoto.photoLink}`,
                        content: `${du.content}`,
                        postphoto: `${du.postlink}`,
                        posttime: `${du.posttime}`,
                        posttype: `${du.posttype}`,
                        postid: `${du._id}`,
                        like: [],
                        comment: [],
                        userid: username._id
                    }

                }


            })
        })

        commentdatabase.forEach(value => {
            if (String(value.postid) === String(du._id)) {
                post.comment.push(value)
            }
        })

        likedatabase.forEach(value => {
            if (String(value.postid) === String(du._id)) {
                post.like.push(value)
            }
        })










        //    post.comment.push(commentdatabase)






        //    post.like.push(likedatabase)
        console.log("likes " + post.content)






        return res.status(200).json({ "ok": true, "message": `Post updated Successfully`, post: post })


    } catch (err) {
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }
}

module.exports = updatePost