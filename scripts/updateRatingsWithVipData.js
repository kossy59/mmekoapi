const mongoose = require('mongoose');
const reviewdb = require('../Creators/review');
const userdb = require('../Creators/userdb');
const creatorsdb = require('../Creators/creators');

// Script to update existing ratings with VIP data
async function updateRatingsWithVipData() {
  try {
    console.log('🔄 [Migration] Starting to update ratings with VIP data...');
    
    // Find all ratings that don't have VIP data
    const ratingsWithoutVip = await reviewdb.find({
      $or: [
        { fanIsVip: { $exists: false } },
        { creatorIsVip: { $exists: false } },
        { fanIsVip: null },
        { creatorIsVip: null }
      ]
    });
    
    console.log(`📊 [Migration] Found ${ratingsWithoutVip.length} ratings without VIP data`);
    
    let updatedCount = 0;
    
    for (const rating of ratingsWithoutVip) {
      console.log(`🔄 [Migration] Processing rating ${rating._id}...`);
      
      try {
        // Get fan user data
        let fanUser = await userdb.findOne({ _id: rating.fanId });
        if (!fanUser) {
          console.log(`⚠️ [Migration] Fan user not found: ${rating.fanId}`);
          continue;
        }
        
        // Get creator user data
        let creatorUser = await userdb.findOne({ _id: rating.creatorId });
        if (!creatorUser) {
          // Try creators collection as fallback
          creatorUser = await creatorsdb.findOne({ _id: rating.creatorId });
          if (creatorUser) {
            // Get from userdb if available
            const creatorFromUserdb = await userdb.findOne({ _id: rating.creatorId });
            if (creatorFromUserdb) {
              creatorUser = creatorFromUserdb;
            }
          }
        }
        
        if (!creatorUser) {
          console.log(`⚠️ [Migration] Creator user not found: ${rating.creatorId}`);
          continue;
        }
        
        // Update the rating with VIP data
        const updateData = {
          fanIsVip: fanUser.isVip || false,
          fanVipEndDate: fanUser.vipEndDate || null,
          creatorIsVip: creatorUser.isVip || false,
          creatorVipEndDate: creatorUser.vipEndDate || null
        };
        
        await reviewdb.updateOne(
          { _id: rating._id },
          { $set: updateData }
        );
        
        console.log(`✅ [Migration] Updated rating ${rating._id}:`, {
          fanIsVip: updateData.fanIsVip,
          creatorIsVip: updateData.creatorIsVip,
          fanName: rating.fanName,
          creatorName: rating.creatorName
        });
        
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ [Migration] Error updating rating ${rating._id}:`, error.message);
      }
    }
    
    console.log(`🎉 [Migration] Completed! Updated ${updatedCount} out of ${ratingsWithoutVip.length} ratings`);
    
  } catch (error) {
    console.error('❌ [Migration] Error:', error);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('📡 [Migration] Connected to MongoDB');
    updateRatingsWithVipData().then(() => {
      console.log('🏁 [Migration] Migration completed, closing connection...');
      mongoose.connection.close();
    });
  }).catch((error) => {
    console.error('❌ [Migration] MongoDB connection error:', error);
  });
}

module.exports = { updateRatingsWithVipData };
