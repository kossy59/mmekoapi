// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const postdbs = require("../../Creators/post");
const userdbs = require("../../Creators/userdb");
const creatorDB = require("../../Creators/creators");
const comdbs = require("../../Creators/usercomplete");
const commentdbs = require("../../Creators/comment");
const likedbs = require("../../Creators/like");
const alldelete = require("../../utiils/Deletes/deleteAcceptsBook");
const followdb = require("../../Creators/followers");
const { filterBlockedComments } = require("../../utiils/blockFilter");
const { filterBlockedPosts } = require("../../utiils/blockingUtils");

const readPost = async (req, res) => {
  // let data = await connectdatabase()

  const userid = req.body.userid;

  // console.log(`📄 [BACKEND] Fetching all posts`);


  try {
    //let  postdb = await data.databar.listDocuments(data.dataid,data.postCol)

    //let  userdb = await data.databar.listDocuments(data.dataid,data.colid)

    //let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)

    //let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)

    // let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)

    // Get user's following list for post prioritization
    let followingList = [];
    if (userid) {
      try {
        const followingFromDB = await followdb.find({ followerid: userid }).exec();
        followingList = followingFromDB.map(f => f.userid);
      } catch (err) {
        console.error(`❌ [BACKEND] Error fetching following list for user ${userid}:`, err);
        followingList = [];
      }
    }

    // Get all posts without pagination

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
          from: "likes", // your Like creator collection
          localField: "_id",
          foreignField: "postid",
          as: "likes",
        },
      },
      // Add likeCount and likedBy
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          likedBy: {
            $map: {
              input: "$likes",
              as: "like",
              in: "$$like.userid"
            }
          }
        }
      },

      // join with comments
      {
        $lookup: {
          from: "comments", // your Comment creator collection
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
          likeCount: 1,
          likedBy: 1,
          comments: 1,
          isFollowingAuthor: 1,
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
            creator_portfolio: 1,
            creator_portfolio_id: 1,
            creator_verified: 1,
            photolink: 1,
            photoID: 1,
            isVip: 1,
            vipStartDate: 1,
            vipEndDate: 1,
          },
        },
      },
      // Sort by newest first initially
      { $sort: { createdAt: -1 } }
    ]);
    
    // Custom sort: prioritize followed users only if they have recent posts, otherwise sort by date globally
    const sortedPosts = posts.sort((a, b) => {
      const aIsFollowing = followingList.includes(a.userid);
      const bIsFollowing = followingList.includes(b.userid);
      
      const aDate = new Date(a.createdAt || a.posttime || 0);
      const bDate = new Date(b.createdAt || b.posttime || 0);
      
      // If both posts are from followed users, sort by date (newest first)
      if (aIsFollowing && bIsFollowing) {
        return bDate.getTime() - aDate.getTime();
      }
      
      // If both posts are from non-followed users, sort by date (newest first)
      if (!aIsFollowing && !bIsFollowing) {
        return bDate.getTime() - aDate.getTime();
      }
      
      // If one is followed and one isn't, prioritize followed only if it's recent (within last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      if (aIsFollowing && !bIsFollowing) {
        // If followed user's post is recent, prioritize it
        if (aDate > sevenDaysAgo) {
          return -1;
        }
        // If followed user's post is old, sort by date normally
        return bDate.getTime() - aDate.getTime();
      }
      
      if (!aIsFollowing && bIsFollowing) {
        // If followed user's post is recent, prioritize it
        if (bDate > sevenDaysAgo) {
          return 1;
        }
        // If followed user's post is old, sort by date normally
        return bDate.getTime() - aDate.getTime();
      }
      
      // Fallback: sort by date
      return bDate.getTime() - aDate.getTime();
    });
    
    
    // let userdb = await userdbs.find().exec();
    // let comdb = await comdbs.find().exec();
    // let commentdb = await commentdbs.find().exec();
    // let likedb = await likedbs.find().exec();
    // let following = await followdb.find({}).exec();

    alldelete();
    
    // Filter out posts from blocked users
    const filteredPosts = await filterBlockedPosts(sortedPosts, userid);
    
    // Filter comments from blocked users in each post
    const postsWithFilteredComments = await Promise.all(
      filteredPosts.map(async (post) => {
        if (post.comments && post.comments.length > 0) {
          const filteredComments = await filterBlockedComments(post.comments, userid);
          return { ...post, comments: filteredComments };
        }
        return post;
      })
    );
    
    
    return res
      .status(200)
      .json({ 
        ok: true, 
        message: `Posts fetched successfully`, 
        post: postsWithFilteredComments
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readPost;
