
let likedb = require("../Models/like")

const likeDel = async(postid)=>{

  await likedb.deleteMany({postid:postid}).exec()

}

module.exports = likeDel