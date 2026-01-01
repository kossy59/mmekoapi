// // const {connectdatabase} = require('../../config/connectDB');
// // const sdk = require("node-appwrite");
// const postdata = require("../../Creators/post");
// const commentdata = require("../../Creators/comment");
// const likedata = require("../../Creators/like");
// const userdata = require("../../Creators/userdb");
// const comdata = require("../../Creators/usercomplete");
// const {
//   saveFile,
//   uploadSingleFileToCloudinary,
// } = require("../../utiils/appwrite");

// // configuring fluent-ffmpeg

// const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
// const ffmpeg = require("fluent-ffmpeg");
// ffmpeg.setFfmpegPath(ffmpegPath);

// const fs = require("fs");
// const path = require("path");
// const os = require("os");
// const mime = require("mime-types");

// const createPost = async (req, res) => {
//   console.log("req.body.data", req.body.data);
//   const data = JSON.parse(req.body.data);
//   console.log("data", data);

//   const userid = data.userid;
//   let content = data.content;
//   let posttype = data.posttype;

//   let postfilelink = "";
//   let postfilepublicid = "";

//   if (req.file) {
//     const result = await uploadSingleFileToCloudinary(req.file, `post`);

//     if (!result.file_link && !result.public_id) {
//       console.log("Problem here");
//       return res.status(500).json({
//         ok: false,
//         message: "Something went wrong",
//       });
//     }
//     postfilelink = result.file_link;
//     postfilepublicid = result.public_id;
//   }

//   if (!userid) {
//     console.log("No user id");
//     return res.status(400).json({ ok: false, message: "user Id invalid!!" });
//   }

//   console.log("posting image", postfilelink, postfilepublicid);

//   // let data = await connectdatabase()

//   try {
//     // if(!postfilelink){
//     //     console.log("no photolink")
//     //     postfilelink = ""
//     // }

//     if (!content) {
//       content = "";
//     }

//     let posts = {
//       userid,
//       postfilelink,
//       postfilepublicid,
//       posttime: `${Date.now()}`,
//       content,
//       posttype,
//     };

//     // let currentpostid = await data.databar.createDocument(data.dataid,data.postCol,sdk.ID.unique(),posts)
//     await postdata.create(posts);

//     let currentpostid = await postdata.findOne({ posttime: posts.posttime });
//     let postdb = await postdata.find().exec();
//     let userdb = await userdata.find().exec();
//     let comdb = await comdata.find().exec();

//     let likedb = await likedata.find().exec();
//     let commentdb = await commentdata.find().exec();

//     let post = {};
//     console.log("current posts id " + currentpostid._id);

//     for (let j = 0; j < userdb.length; j++) {
//       for (let k = 0; k < comdb.length; k++) {
//         if (
//           String(currentpostid.userid) === String(userdb[j]._id) &&
//           String(comdb[k].useraccountId) === String(userdb[j]._id)
//         ) {
//           console.log("found post");
//           post = {
//             username: `${userdb[j].firstname} ${userdb[j].lastname}`,
//             username: `${userdb[j].username}`,
//             userphoto: `${comdb[k].photoLink}`,
//             content: `${currentpostid.content}`,
//             postphoto: `${currentpostid.postlink}`,
//             posttime: `${currentpostid.posttime}`,
//             posttype: `${currentpostid.posttype}`,
//             postid: `${currentpostid._id}`,
//             like: [],
//             comment: [],
//             userid: userdb[j]._id,
//           };

//           console.log("post time why " + currentpostid.posttime);
//           console.log("post id why " + currentpostid._id);
//           console.log("post type why " + currentpostid.posttype);
//         }
//       }
//     }

//     for (let j = 0; j < commentdb.length; j++) {
//       if (currentpostid._id === commentdb[j].postid) {
//         post.comment.push(commentdb[j]);
//       }
//     }

//     for (let j = 0; j < likedb.length; j++) {
//       if (currentpostid._id === likedb[j].postid) {
//         post.like.push(likedb[j]);
//       }
//     }
//     console.log("posts " + post.posttime);

//     return res
//       .status(200)
//       .json({ ok: true, message: `Posted successfully`, post: post });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ ok: false, message: `${err.message}!` });
//   }
// };

// const stream = require("stream");

// module.exports = createPost;


const { connectdatabase } = require('../../config/connectDB');
const sdk = require("node-appwrite");
const postdata = require("../../Creators/post");
const commentdata = require("../../Creators/comment");
const likedata = require("../../Creators/like");
const userdata = require("../../Creators/userdb");
const comdata = require("../../Creators/usercomplete");
const {
  uploadSingleFileToCloudinary,
} = require("../../utiils/storj");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const fs = require("fs");
const path = require("path");
const os = require("os");
const mime = require("mime-types");

const createPost = async (req, res) => {
  // Support both: JSON string in req.body.data OR plain fields in req.body
  let data;
  if (req.body && typeof req.body.data === "string") {
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      return res.status(400).json({ ok: false, message: "Invalid JSON in 'data' field" });
    }
  } else {
    data = {
      userid: req.body?.userid,
      content: req.body?.content,
      posttype: req.body?.posttype,
    };
  }

  const userid = data.userid;
  let content = data.content || "";
  const posttype = data.posttype;

  // Extract hashtags from content (words starting with #)
  const extractHashtags = (text) => {
    if (!text) return [];
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    if (!matches) return [];
    // Remove # and return unique hashtags (lowercase)
    return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
  };

  const hashtags = extractHashtags(content);

  // ------------------------------
  // ✅ DAILY UPLOAD LIMIT CHECK
  // ------------------------------
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayCount = await postdata.countDocuments({
    userid,
    posttype,
    posttime: { $gte: startOfDay.getTime().toString(), $lte: endOfDay.getTime().toString() },
  });

  if (posttype === "image" && todayCount >= 10) {
    return res.status(400).json({ ok: false, message: "You can only upload 10 images per day." });
  }
  if (posttype === "video" && todayCount >= 5) {
    return res.status(400).json({ ok: false, message: "You can only upload 5 videos per day." });
  }

  let postfilelink = req.body?.file_link || "";
  let postfilepublicid = req.body?.public_id || "";


  try {
    // --- Video Upload & Trimming ---
    if (req.file && posttype === "video") {
      if (!req.file.mimetype.startsWith("video/")) {
        return res.status(400).json({ ok: false, message: "Invalid video file" });
      }

      // const tempDir = os.tmpdir();
      // const originalExt = mime.extension(req.file.mimetype);
      // const inputPath = path.join(tempDir, `input-${Date.now()}.${originalExt}`);
      // const outputPath = path.join(tempDir, `trimmed-${Date.now()}.mp4`);

      // Write uploaded buffer to disk
      // fs.writeFileSync(inputPath, req.file.buffer);

      // Trim video to 3 minutes
      // await new Promise((resolve, reject) => {
      //   ffmpeg(inputPath)
      //     .setStartTime("00:00:00")
      //     .setDuration(180)
      //     .videoCodec("libx264")
      //     .audioCodec("aac")
      //     .format("mp4")
      //     .outputOptions([
      //       "-preset veryfast",
      //       "-movflags +faststart"
      //     ])
      //     .output(outputPath)
      //     .on("end", resolve)
      //     .on("error", (err) => {
      //       console.error("FFmpeg error:", err.message);
      //       reject(err);
      //     })
      //     .run();
      // });

      // Read trimmed video into buffer
      // const trimmedBuffer = fs.readFileSync(outputPath);
      // const trimmedFile = {
      //   originalname: req.file.originalname.replace(/\.\w+$/, ".mp4"),
      //   mimetype: "video/mp4",
      //   buffer: trimmedBuffer,
      // };

      // Upload to Cloudinary
      // const result = await uploadSingleFileToCloudinary(trimmedFile, `post`);
      const result = { ...(req.body || {}) };

      // Clean up
      // fs.unlinkSync(inputPath);
      // fs.unlinkSync(outputPath);

      if (!result.file_link || !result.public_id) {
        return res.status(500).json({ ok: false, message: "Upload failed" });
      }

      postfilelink = result.file_link;
      postfilepublicid = result.public_id;

      // 🎬 Trigger Mux asset creation asynchronously (don't wait for it)
      // This will optimize the video in the background
      if (postfilelink) {
        try {
          const axios = require('axios');
          const API_URL = process.env.API_URL || 'http://localhost:3100';

          // We'll trigger this after the post is created, so we store the filelink for now
          // The actual Mux processing will happen after post creation (see below)
        } catch (err) {
          console.error('Error preparing Mux processing:', err.message);
          // Continue with post creation even if Mux prep fails
        }
      }
    }

    // --- Image Upload ---
    if (req.file && posttype === "image") {
      // if (!req.file.mimetype.startsWith("image/")) {
      //   return res.status(400).json({ ok: false, message: "Invalid image file" });
      // }

      const result = { ...(req.body || {}) };;

      if (!result.file_link || !result.public_id) {
        return res.status(500).json({ ok: false, message: "Image upload failed" });
      }

      postfilelink = result.file_link;
      postfilepublicid = result.public_id;
    }


    if (!userid) {
      return res.status(400).json({ ok: false, message: "User ID is missing" });
    }

    // --- Save post to DB ---
    const newPost = {
      userid,
      postfilelink,
      postfilepublicid,
      posttime: `${Date.now()}`,
      content,
      posttype,
      hashtags,
    };

    await postdata.create(newPost);

    // Track user activity (post creation)
    const { trackUserAction } = require("../../utiils/trackUserActivity");
    trackUserAction(userid, "post");

    const currentPost = await postdata.findOne({ posttime: newPost.posttime });
    const [userdb, comdb, likedb, commentdb] = await Promise.all([
      userdata.find().exec(),
      comdata.find().exec(),
      likedata.find().exec(),
      commentdata.find().exec(),
    ]);

    let post = {};

    for (let j = 0; j < userdb.length; j++) {
      for (let k = 0; k < comdb.length; k++) {
        if (
          String(currentPost.userid) === String(userdb[j]._id) &&
          String(comdb[k].useraccountId) === String(userdb[j]._id)
        ) {
          post = {
            username: `${userdb[j].firstname} ${userdb[j].lastname}`,
            username: `${userdb[j].username}`,
            userphoto: `${comdb[k].photoLink}`,
            content: currentPost.content,
            postphoto: currentPost.postfilelink,
            posttime: currentPost.posttime,
            posttype: currentPost.posttype,
            postid: currentPost._id,
            like: [],
            comment: [],
            userid: userdb[j]._id,
          };
        }
      }
    }

    for (let j = 0; j < commentdb.length; j++) {
      if (String(currentPost._id) === String(commentdb[j].postid)) {
        post.comment.push(commentdb[j]);
      }
    }

    for (let j = 0; j < likedb.length; j++) {
      if (String(currentPost._id) === String(likedb[j].postid)) {
        post.like.push(likedb[j]);
      }
    }

    // 🎬 Trigger Mux processing in background for video posts
    if (posttype === "video" && postfilelink) {
      // Fire and forget - don't wait for response
      setImmediate(() => {
        triggerMuxProcessing(newPost.posttime, postfilelink);
      });
    }

    return res.status(200).json({ ok: true, message: "Posted successfully", post });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ ok: false, message: err.message || "Internal error" });
  }
};

// Helper function to trigger Mux processing after post creation
const triggerMuxProcessing = async (postTime, postfilelink) => {
  if (!postfilelink) return;

  try {
    const axios = require('axios');
    const API_URL = process.env.API_URL || 'http://localhost:3100';

    // Find the newly created post to get its ID
    const newPost = await postdata.findOne({ posttime: postTime });

    if (newPost && newPost._id) {
      console.log(`🎬 Triggering Mux processing for post ${newPost._id}`);

      // Trigger Mux asset creation (don't await - fire and forget)
      axios.post(`${API_URL}/post/create-mux-asset`, {
        postId: newPost._id,
        videoUrl: postfilelink
      }).then(() => {
        console.log(`✅ Mux processing initiated for post ${newPost._id}`);
      }).catch(err => {
        console.error(`⚠️ Mux processing failed for post ${newPost._id}:`, err.message);
        // This is OK - video will use original source as fallback
      });
    }
  } catch (err) {
    console.error('Error triggering Mux processing:', err.message);
    // Non-critical error - post was created successfully
  }
};

module.exports = createPost;
