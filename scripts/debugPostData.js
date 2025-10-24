const mongoose = require('mongoose');
require('dotenv').config();

// Database connection
const MONGODB_URI = process.env.DB || process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';

async function debugPostData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get a sample post
    const samplePost = await db.collection('posts').findOne();
    if (!samplePost) {
      console.log('❌ No posts found in database');
      return;
    }

    console.log('📄 Sample post:');
    console.log('Post ID:', samplePost._id);
    console.log('Post ID type:', typeof samplePost._id);
    console.log('Post ID string:', samplePost._id.toString());

    // Get likes for this post
    const likes = await db.collection('likes').find({ 
      postid: samplePost._id.toString() 
    }).toArray();
    
    console.log('\n❤️ Likes for this post:');
    console.log('Likes count:', likes.length);
    if (likes.length > 0) {
      console.log('Sample like:', likes[0]);
    }

    // Get comments for this post
    const comments = await db.collection('comments').find({ 
      postid: samplePost._id.toString() 
    }).toArray();
    
    console.log('\n💬 Comments for this post:');
    console.log('Comments count:', comments.length);
    if (comments.length > 0) {
      console.log('Sample comment:', comments[0]);
    }

    // Test the aggregation pipeline
    console.log('\n🔍 Testing aggregation pipeline:');
    const aggregationResult = await db.collection('posts').aggregate([
      { $match: { _id: samplePost._id } },
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
      }
    ]).toArray();

    console.log('Aggregation result:');
    console.log('Post ID:', aggregationResult[0]?._id);
    console.log('Like Count:', aggregationResult[0]?.likeCount);
    console.log('Liked By:', aggregationResult[0]?.likedBy);
    console.log('Comments Count:', aggregationResult[0]?.comments?.length);
    console.log('Comments:', aggregationResult[0]?.comments?.slice(0, 2));

  } catch (error) {
    console.error('❌ Error debugging post data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the debug
debugPostData();
