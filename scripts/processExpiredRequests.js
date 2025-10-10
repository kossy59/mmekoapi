const mongoose = require('mongoose');
const bookingdb = require('../Creators/book');
const userdb = require('../Creators/userdb');
const historydb = require('../Creators/mainbalance');
let sendEmail = require('../utiils/sendEmailnot');
let sendpushnote = require('../utiils/sendPushnot');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmekosocial');
    console.log('MongoDB connected for expired requests processing');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const processExpiredRequests = async () => {
  try {
    console.log('Starting expired requests processing...');
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

    // Find all accepted Fan Call requests that are older than 48 hours
    const expiredFanCallRequests = await bookingdb.find({
      status: "accepted",
      type: "Fan Call",
      createdAt: { $lt: fortyEightHoursAgo }
    }).exec();

    // Find all accepted non-Fan Call requests that are older than 7 days
    const expiredOtherRequests = await bookingdb.find({
      status: "accepted",
      type: { $ne: "Fan Call" },
      createdAt: { $lt: sevenDaysAgo }
    }).exec();

    // Combine all accepted requests that should be expired
    const expiredAcceptedRequests = [...expiredFanCallRequests, ...expiredOtherRequests];

    // Find all pending requests that have expired (existing logic)
    const expiredPendingRequests = await bookingdb.find({
      status: "request",
      expiresAt: { $lt: new Date() }
    }).exec();

    const allExpiredRequests = [...expiredAcceptedRequests, ...expiredPendingRequests];
    console.log(`Found ${allExpiredRequests.length} expired requests (${expiredFanCallRequests.length} Fan Call 48h, ${expiredOtherRequests.length} other 7d, ${expiredPendingRequests.length} pending)`);

    for (const booking of allExpiredRequests) {
      try {
        console.log(`Processing expired booking ${booking._id}`);
        
        // Update booking status to expired
        booking.status = "expired";
        await booking.save();

        // Refund the user - move money from pending back to balance
        const user = await userdb.findOne({ _id: booking.userid }).exec();
        if (user) {
          let userBalance = parseFloat(user.balance) || 0;
          let userPending = parseFloat(user.pending) || 0;
          let refundAmount = parseFloat(booking.price);

          // Only refund if there's pending money to refund
          if (userPending >= refundAmount) {
            user.balance = String(userBalance + refundAmount);
            user.pending = String(userPending - refundAmount);
            await user.save();

            // Create refund history with dynamic host type
            const hostType = booking.type || "Fan meet";
            const refundHistory = {
              userid: booking.userid,
              details: `${hostType} request expired - automatic refund processed`,
              spent: "0",
              income: `${refundAmount}`,
              date: `${Date.now().toString()}`
            };
            await historydb.create(refundHistory);

            // Send notifications with dynamic host type
            await sendEmail(booking.userid, `Your ${hostType.toLowerCase()} request has expired and been refunded`);
            await sendpushnote(booking.userid, `Your ${hostType.toLowerCase()} request has expired and been refunded`, "fanicon");
            
            await sendEmail(booking.creatorid, `A ${hostType.toLowerCase()} request has expired`);
            await sendpushnote(booking.creatorid, `A ${hostType.toLowerCase()} request has expired`, "creatoricon");
            
            console.log(`Refunded ${refundAmount} to user ${booking.userid} for ${hostType} request`);
          }
        }
      } catch (err) {
        console.error(`Error processing expired booking ${booking._id}:`, err);
      }
    }

    console.log(`Completed processing ${allExpiredRequests.length} expired requests`);
  } catch (err) {
    console.error("Error processing expired requests:", err);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await processExpiredRequests();
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  runScript();
}

module.exports = { processExpiredRequests };
