// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const postdata = require("../../Models/post")
const commentdata = require("../../Models/comment")
const likedata = require("../../Models/like")
const userdata = require("../../Models/userdb")
const comdata = require("../../Models/usercomplete")
const { saveFile, uploadSingleFileToAppwrite } = require("../../utiils/appwrite")

// configuring fluent-ffmpeg

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const fs = require('fs');
const path = require('path');
const os = require('os');
const mime = require('mime-types');



const createPost = async (req, res) => {

    console.log("req.body.data", req.body.data);
    const data = JSON.parse(req.body.data);
    console.log("data", data);

    const userid = data.userid;
    let content = data.content;
    let posttype = data.posttype;

    // Get the buffer and MIME type
    let fileBuffer = req.file.buffer;
    let mimeType = req.file.mimetype;

    // If it's a video and longer than 3 minutes, trim it
    if (mimeType && mimeType.startsWith("video/")) {
        try {
            console.log("Trimming video...");
            fileBuffer = await trimVideoBufferTo3Min(fileBuffer);
        } catch (err) {
            console.error("Failed to trim video:", err.message);
            return res.status(500).json({ ok: false, message: "Error trimming video" });
        }
    }

    // Now pass req.file directly
    const result = await uploadSingleFileToAppwrite(req.file, `post`);
    

    /**
     * This implementation uploads the file to a folder on the server
     * and manipulates the filesystem of the server
     */
    // const result = await saveFile(req.file, req.file.path, `assets/${posttype}s`);

    /**
     * This implementation allows for in memory file upload manipulation
     * This prevents accessing the filesystem of the hosted server
     */
    // const result = await uploadSingleFileToAppwrite(req.file, `assets/${posttype}s`);



    console.log("result: ", result)

    const postfilelink = result.file_link
    const postfilepublicid = result.public_id
   
    if (!userid) {
        return res.status(400).json({ "ok": false, 'message': 'user Id invalid!!' })
    }

    console.log("posting image", postfilelink, postfilepublicid)

    // let data = await connectdatabase()

    try {
      

        // if(!postfilelink){
        //     console.log("no photolink")
        //     postfilelink = ""
        // }

        if (!content) {
            content = ""
        }
           
        let posts = {
            userid,
            postfilelink,
            postfilepublicid,
            posttime: `${Date.now()}`,
            content,
            posttype
        }
            

        // let currentpostid = await data.databar.createDocument(data.dataid,data.postCol,sdk.ID.unique(),posts)
        await postdata.create(posts)

        let currentpostid = await postdata.findOne({ posttime: posts.posttime })
        let postdb = await postdata.find().exec()
        let userdb = await userdata.find().exec()
        let comdb = await comdata.find().exec()

        let likedb = await likedata.find().exec()
        let commentdb = await commentdata.find().exec()

        let post = {};
        console.log("current posts id " + currentpostid._id)

          
             

        for (let j = 0; j < userdb.length; j++) {

            for (let k = 0; k < comdb.length; k++) {

                       
                       

                if (String(currentpostid.userid) === String(userdb[j]._id) && String(comdb[k].useraccountId) === String(userdb[j]._id)) {

                    console.log("found post")
                    post = {
                        username: `${userdb[j].firstname} ${userdb[j].lastname}`,
                        nickname: `${userdb[j].nickname}`,
                        userphoto: `${comdb[k].photoLink}`,
                        content: `${currentpostid.content}`,
                        postphoto: `${currentpostid.postlink}`,
                        posttime: `${currentpostid.posttime}`,
                        posttype: `${currentpostid.posttype}`,
                        postid: `${currentpostid._id}`,
                        like: [],
                        comment: [],
                        userid: userdb[j]._id
                    }

                    console.log("post time why " + currentpostid.posttime)
                    console.log("post id why " + currentpostid._id)
                    console.log("post type why " + currentpostid.posttype)

                           

                }

            }

        }

            

            
        for (let j = 0; j < commentdb.length; j++) {
            if (currentpostid._id === commentdb[j].postid) {
                post.comment.push(commentdb[j])
            }

        }
            

          
        for (let j = 0; j < likedb.length; j++) {
            if (currentpostid._id === likedb[j].postid) {
                post.like.push(likedb[j])
            }

        }
        console.log("posts " + post.posttime)

        return res.status(200).json({ "ok": true, "message": `Posted successfully`, post: post })
      
          
    } catch (err) {
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }
}


const trimVideoBufferTo3Min = (buffer) => {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = ffmpeg()
            .input(buffer)
            .inputFormat('mp4')  // adjust format based on video type
            .outputOptions('-t 180') // Trim to 3 minutes
            .outputFormat('mp4')
            .on('end', () => {
                resolve(ffmpegProcess); // Return the trimmed video buffer
            })
            .on('error', (err) => {
                reject(err);
            });

        ffmpegProcess.pipe();
    });
};


module.exports = createPost