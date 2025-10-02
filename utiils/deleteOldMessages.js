const mongoose = require("mongoose");

// Function to delete messages older than 60 days
const deleteOldMessages = async () => {
  try {
    // Calculate date 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    console.log(`🗑️ [MessageCleanup] Deleting messages older than ${sixtyDaysAgo.toISOString()}`);
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    // Get the messages collection
    const db = mongoose.connection.db;
    const messagesCollection = db.collection('messages');
    
    // Delete messages older than 60 days
    const result = await messagesCollection.deleteMany({
      date: { $lt: sixtyDaysAgo.getTime().toString() }
    });
    
    console.log(`✅ [MessageCleanup] Deleted ${result.deletedCount} old messages`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate: sixtyDaysAgo.toISOString()
    };
    
  } catch (error) {
    console.error("❌ [MessageCleanup] Error deleting old messages:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to schedule automatic message cleanup
const scheduleMessageCleanup = () => {
  // Run cleanup immediately on startup
  deleteOldMessages();
  
  // Schedule cleanup to run every 24 hours
  setInterval(() => {
    console.log("🔄 [MessageCleanup] Running scheduled cleanup...");
    deleteOldMessages();
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
  
  console.log("⏰ [MessageCleanup] Scheduled automatic message cleanup every 24 hours");
};

module.exports = {
  deleteOldMessages,
  scheduleMessageCleanup
};
