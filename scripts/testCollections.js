const mongoose = require('mongoose');
require('dotenv').config();

// Database connection
const MONGODB_URI = process.env.DB || process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';

async function testCollections() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // List all collections
    console.log('📊 Available collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Test posts collection
    console.log('\n📄 Testing posts collection:');
    const postsCount = await db.collection('posts').countDocuments();
    console.log(`Posts count: ${postsCount}`);

    // Test likes collection
    console.log('\n❤️ Testing likes collection:');
    const likesCount = await db.collection('likes').countDocuments();
    console.log(`Likes count: ${likesCount}`);
    
    if (likesCount > 0) {
      const sampleLike = await db.collection('likes').findOne();
      console.log('Sample like:', {
        postid: sampleLike.postid,
        userid: sampleLike.userid,
        postidType: typeof sampleLike.postid
      });
    }

    // Test comments collection
    console.log('\n💬 Testing comments collection:');
    const commentsCount = await db.collection('comments').countDocuments();
    console.log(`Comments count: ${commentsCount}`);
    
    if (commentsCount > 0) {
      const sampleComment = await db.collection('comments').findOne();
      console.log('Sample comment:', {
        postid: sampleComment.postid,
        userid: sampleComment.userid,
        postidType: typeof sampleComment.postid
      });
    }

    // Test a simple aggregation
    if (postsCount > 0) {
      console.log('\n🔍 Testing aggregation:');
      const testAggregation = await db.collection('posts').aggregate([
        { $limit: 1 },
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
            likeCount: { $size: "$likes" }
          }
        }
      ]).toArray();

      console.log('Test aggregation result:', {
        postId: testAggregation[0]?._id,
        likeCount: testAggregation[0]?.likeCount,
        likes: testAggregation[0]?.likes?.length
      });
    }

  } catch (error) {
    console.error('❌ Error testing collections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCollections();
