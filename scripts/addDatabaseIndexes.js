const mongoose = require('mongoose');
require('dotenv').config();

// Database connection
const MONGODB_URI = process.env.DB

async function addDatabaseIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Add indexes for posts collection
    console.log('📊 Adding indexes for posts collection...');
    await db.collection('posts').createIndex({ "createdAt": -1 });
    await db.collection('posts').createIndex({ "userid": 1, "createdAt": -1 });
    await db.collection('posts').createIndex({ "posttime": -1 });
    console.log('✅ Posts indexes added');

    // Add indexes for likes collection
    console.log('📊 Adding indexes for likes collection...');
    await db.collection('likes').createIndex({ "postid": 1 });
    await db.collection('likes').createIndex({ "userid": 1 });
    await db.collection('likes').createIndex({ "postid": 1, "userid": 1 });
    console.log('✅ Likes indexes added');

    // Add indexes for comments collection
    console.log('📊 Adding indexes for comments collection...');
    await db.collection('comments').createIndex({ "postid": 1, "commenttime": -1 });
    await db.collection('comments').createIndex({ "userid": 1 });
    await db.collection('comments').createIndex({ "commenttime": -1 });
    console.log('✅ Comments indexes added');

    // Add indexes for users collection
    console.log('📊 Adding indexes for users collection...');
    await db.collection('userdbs').createIndex({ "username": 1 });
    await db.collection('userdbs').createIndex({ "isVip": 1 });
    await db.collection('userdbs').createIndex({ "creator_verified": 1 });
    console.log('✅ Users indexes added');

    // Add indexes for followers collection
    console.log('📊 Adding indexes for followers collection...');
    await db.collection('followers').createIndex({ "followerid": 1 });
    await db.collection('followers').createIndex({ "userid": 1 });
    await db.collection('followers').createIndex({ "followerid": 1, "userid": 1 });
    console.log('✅ Followers indexes added');

    console.log('🎉 All database indexes added successfully!');
    console.log('📈 Performance should be significantly improved');

  } catch (error) {
    console.error('❌ Error adding indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
addDatabaseIndexes();
