// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const commentdb = require("../../Models/comment")
const likedb = require("../../Models/like")
const postdb = require("../../Models/post")
let exclusivedb = require("../../Models/exclusivedb")
let followersdb = require("../../Models/followers")
let modeldb = require("../../Models/models")
let exclusive_pushasedb = require("../../Models/exclusivePurshase")

const readProfile = async (req, res) => {

  const userid = req.body.userid;
  let clientid = req.body.clientid;


  let likecount = 0
  // let data = await connectdatabase()

  try {
    let du = await userdb.findOne({
      _id: userid
    }).exec()



    let com = await completedb.findOne({
      useraccountId: userid
    }).exec()

    let commentDB = await commentdb.find().exec()
    let likeDB = await likedb.find().exec()
    let followPost = await followersdb.find({}).exec()


    if (!du) {
      return res.status(409).json({
        "ok": false,
        'message': 'Current user cant view this post!!'
      });

    }

    let postDB = await postdb.find({
      userid: userid
    }).exec()

    let dob = "12/06/1992"

    if (du.dob) {
      dob = du.dob
    }

    let user = {
      userid: du._id,
      exclusive: du.exclusive_verify,
      username: `${du.firstname} ${du.lastname}`,
      admin: du.admin,
      userphoto: com.photoLink,
      nickname: `${du.nickname}`,
      aboutuser: `${com.details}`,
      location: `${du.country}`,
      active: du.active,
      gender: du.gender,
      post: [],
      firstname: du.firstname,
      lastname: du.lastname,
      exclusive_content: [],
      followers: [],
      joined_month: `${du._id.getTimestamp().getMonth()}`,
      joined_year: `${du._id.getTimestamp().getFullYear()}`,
      following: false,
      ismodel: false,
      modelid: "",
      modeltype: "",
      dob: dob,
      likecount: 0
    }



    let exclusiveData = await exclusivedb.find({
      userid: userid
    }).exec()
    let have_buy = []

    if (clientid) {
      have_buy = await exclusive_pushasedb.find({
        userid: clientid
      }).exec()
    }

    if (exclusiveData) {
      exclusiveData.forEach(value => {

        let data = {}
        let is_in = have_buy.find(index => String(index.exclusiveid) === String(value._id))
        if (is_in) {

          data = value.toObject()
          data.buy = true

        } else {
          data = value.toObject()
          data.buy = false
        }
        user.exclusive_content.push(data)
      })

    }

    let followers = await followersdb.find({
      userid: userid
    }).exec()

    if (followers) {
      user.followers = followers
    }

    if (clientid) {

      let isFollowed = followers.find(value => {
        return String(value.followerid) === String(clientid)
      })

      if (isFollowed) {
        user.following = true
      }

    }

    let ismodel = await modeldb.findOne({
      userid: userid
    }).exec()

    if (ismodel) {
      user.ismodel = true
      user.modelid = ismodel._id
      user.modeltype = ismodel.hosttype
    }

    if (postDB.length > 0) {
      postDB.forEach(value => {
        let postFollowed = false
        if (clientid) {
          let isfollowww = followPost.find(value => {
            return String(value.followerid) === String(clientid) && String(value.userid) === String(userid)
          })

          if (isfollowww) {
            postFollowed = true
          }

        }
        let con = {
          content: value.content,
          postphoto: value.postfilelink,
          postphotoID: value.postfilepublicid,
          posttime: `${value.posttime}`,
          posttype: `${value.posttype}`,
          postid: `${value._id}`,
          userid: du._id,
          active: du.active,
          comment: [],
          like: [],
          isfollow: postFollowed
        }
        user.post.push(con)

      })

    }

    user.post.forEach((value, index) => {
      commentDB.forEach(value1 => {
        if (String(value.postid) === String(value1.postid)) {

          user.post[index].comment.push(value1)
        }
      })
    })

    user.post.forEach((value, index) => {
      likeDB.forEach(value1 => {
        if (String(value.postid) === String(value1.postid)) {
          user.post[index].like.push(value1)
          likecount = likecount + 1
        }
      })
    })

    user.likecount = likecount

    return res.status(200).json({
      "ok": true,
      "message": `All Post`,
      profile: user
    })
  } catch (err) {
    return res.status(500).json({
      "ok": false,
      'message': `${err.message}!`
    });
  }
}

module.exports = readProfile
