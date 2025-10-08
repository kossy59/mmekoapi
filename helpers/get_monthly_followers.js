const followerdb = require("../Creators/followers");

let get_monthly_followers = async (userid) => {
  
  try {
    // Get all followers for this user
    let followers = await followerdb.find({ userid: userid }).exec();
    
    // Get current date and 28 days ago
    let now = Date.now();
    let currentDate = new Date(now);
    let pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 28);
    
    
    // Count followers in the last 28 days
    let monthlyFollowers = 0;
    
    followers.forEach(follower => {
      // Use the _id timestamp to determine when the follower was added
      let followerDate = new Date(follower._id.getTimestamp());
      
      if (followerDate >= pastDate && followerDate <= currentDate) {
        monthlyFollowers++;
      }
    });
    
    
    return monthlyFollowers;
    
  } catch (error) {
    return 0;
  }
};

module.exports = get_monthly_followers;
