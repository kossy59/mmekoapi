const mongoose = require('mongoose');
require('dotenv').config();

// Database connection
const MONGODB_URI = process.env.DB || process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';

async function testWithRealData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Find a post that has likes
    const postWithLikes = await db.collection('posts').aggregate([
      {
        $lookup: {
          from: "likes",
          let: { postId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$postid", "$$postId"] }
              }
            }
          ],
          as: "likes"
        }
      },
      {
        $match: {
          "likes.0": { $exists: true }
        }
      },
      { $limit: 1 }
    ]).toArray();

    if (postWithLikes.length === 0) {
      console.log('❌ No posts with likes found');
      return;
    }

    const post = postWithLikes[0];
    console.log('📄 Post with likes:');
    console.log('Post ID:', post._id);
    console.log('Likes count:', post.likes.length);

    // Test the full aggregation pipeline
    console.log('\n🔍 Testing full aggregation pipeline:');
    const fullAggregation = await db.collection('posts').aggregate([
      { $match: { _id: post._id } },
      {
        $lookup: {
          from: "userdbs",
          let: { userId: { $toObjectId: "$userid" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userId"] }
              }
            }
          ],
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "likes",
          let: { postId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$postid", "$$postId"] }
              }
            }
          ],
          as: "likes"
        }
      },
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
      {
        $lookup: {
          from: "comments",
          let: { postId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$postid", "$$postId"] }
              }
            }
          ],
          as: "comments"
        }
      },
      {
        $project: {
          _id: 1,
          userid: 1,
          content: 1,
          postfilelink: 1,
          posttime: 1,
          posttype: 1,
          likeCount: 1,
          likedBy: 1,
          comments: 1,
          user: {
            _id: 1,
            firstname: 1,
            lastname: 1,
            nickname: 1
          }
        }
      }
    ]).toArray();

    console.log('Full aggregation result:');
    console.log('Post ID:', fullAggregation[0]?._id);
    console.log('Like Count:', fullAggregation[0]?.likeCount);
    console.log('Liked By:', fullAggregation[0]?.likedBy);
    console.log('Comments Count:', fullAggregation[0]?.comments?.length);
    console.log('User:', fullAggregation[0]?.user?.nickname);

  } catch (error) {
    console.error('❌ Error testing with real data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testWithRealData();
