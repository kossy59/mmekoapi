const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const postdata = require("../../Models/post");
const commentdata = require("../../Models/comment");
const likedata = require("../../Models/like");
const userdata = require("../../Models/userdb");
const comdata = require("../../Models/usercomplete");

const { uploadSingleFileToCloudinary } = require("../../utiils/cloudinary");

const compressVideo = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                "-vcodec libx264",
                "-crf 28", // compression level
                "-preset veryfast",
                "-acodec aac",
                "-b:a 128k",
                "-movflags +faststart"
            ])
            .on("end", () => resolve(outputPath))
            .on("error", (err) => reject(err))
            .save(outputPath);
    });
};

const createPost = async (req, res) => {
    try {
        const data = JSON.parse(req.body.data);
        const userid = data.userid;
        let content = data.content || "";
        let posttype = data.posttype;

        if (!userid) {
            return res.status(400).json({ ok: false, message: "User ID invalid!" });
        }

        let result;

        if (posttype === "video") {
            // Compress video before uploading
            const tempPath = `./temp/${Date.now()}-${req.file.originalname}`;
            fs.writeFileSync(tempPath, req.file.buffer);

            const compressedPath = tempPath.replace(path.extname(tempPath), "-compressed.mp4");

            await compressVideo(tempPath, compressedPath);

            result = await uploadSingleFileToCloudinary(
                fs.createReadStream(compressedPath),
                `assets/${posttype}s`
            );

            fs.unlinkSync(tempPath);         // Clean up original
            fs.unlinkSync(compressedPath);   // Clean up compressed
        } else {
            // Upload directly for non-video types
            result = await uploadSingleFileToCloudinary(req.file, `assets/${posttype}s`);
        }

        const postfilelink = result.file_link;
        const postfilepublicid = result.public_id;

        const posts = {
            userid,
            postfilelink,
            postfilepublicid,
            posttime: `${Date.now()}`,
            content,
            posttype,
        };

        await postdata.create(posts);

        const currentpostid = await postdata.findOne({ posttime: posts.posttime });
        const [userdb, comdb, likedb, commentdb] = await Promise.all([
            userdata.find().exec(),
            comdata.find().exec(),
            likedata.find().exec(),
            commentdata.find().exec()
        ]);

        let post = {};

        for (let user of userdb) {
            for (let com of comdb) {
                if (
                    String(currentpostid.userid) === String(user._id) &&
                    String(com.useraccountId) === String(user._id)
                ) {
                    post = {
                        username: `${user.firstname} ${user.lastname}`,
                        nickname: user.nickname,
                        userphoto: com.photoLink,
                        content: currentpostid.content,
                        postphoto: currentpostid.postfilelink,
                        posttime: currentpostid.posttime,
                        posttype: currentpostid.posttype,
                        postid: currentpostid._id,
                        like: [],
                        comment: [],
                        userid: user._id,
                    };
                }
            }
        }

        for (let comment of commentdb) {
            if (String(currentpostid._id) === String(comment.postid)) {
                post.comment.push(comment);
            }
        }

        for (let like of likedb) {
            if (String(currentpostid._id) === String(like.postid)) {
                post.like.push(like);
            }
        }

        return res.status(200).json({ ok: true, message: "Posted successfully", post });
    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

module.exports = createPost;
