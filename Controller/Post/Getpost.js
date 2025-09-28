// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const postdbs = require("../../Models/post");
const userdbs = require("../../Models/userdb");
const modelDB = require("../../Models/models");
const comdbs = require("../../Models/usercomplete");
const commentdbs = require("../../Models/comment");
const likedbs = require("../../Models/like");
const alldelete = require("../../utiils/Deletes/deleteAcceptsBook");
const followdb = require("../../Models/followers");

const readPost = async (req, res) => {
  // let data = await connectdatabase()

  const userid = req.body.userid;

  try {
    //let  postdb = await data.databar.listDocuments(data.dataid,data.postCol)

    //let  userdb = await data.databar.listDocuments(data.dataid,data.colid)

    //let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)

    //let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)

    // let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)

    const posts = await postdbs.aggregate([
      // make ObjectId copy of userid for joins
      {
        $addFields: {
          useridObj: { $toObjectId: "$userid" },
        },
      },

      // join with users
      {
        $lookup: {
          from: "userdbs", // your users collection name
          localField: "useridObj",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // join with likes
      {
        $lookup: {
          from: "likes", // your Like model collection
          localField: "_id",
          foreignField: "postid",
          as: "likes",
        },
      },

      // join with comments
      {
        $lookup: {
          from: "comments", // your Comment model collection
          localField: "_id",
          foreignField: "postid",
          as: "comments",
        },
      },
      {
        $project: {
          userid: 1,
          postfilelink: 1,
          postfilepublicid: 1,
          posttime: 1,
          content: 1,
          posttype: 1,
          createdAt: 1,
          updatedAt: 1,
          likes: 1,
          comments: 1,
          user: {
            _id: 1,
            firstname: 1,
            lastname: 1,
            nickname: 1,
            gender: 1,
            country: 1,
            age: 1,
            followers: 1,
            following: 1,
            isModel: 1,
            modelId: 1,
            exclusive_verify: 1,
            photolink: 1,
            photoID: 1,
          },
        },
      },
    ]);
    // let userdb = await userdbs.find().exec();
    // let comdb = await comdbs.find().exec();
    // let commentdb = await commentdbs.find().exec();
    // let likedb = await likedbs.find().exec();
    // let following = await followdb.find({}).exec();

    alldelete();
    return res
      .status(200)
      .json({ ok: true, message: `Enter new password`, post: posts.reverse() });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readPost;
