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
    
    // Find all pending requests that have expired
    const expiredRequests = await bookingdb.find({
      status: "request",
      expiresAt: { $lt: new Date() }
    }).exec();

    console.log(`Found ${expiredRequests.length} expired requests`);

    for (const booking of expiredRequests) {
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

          user.balance = String(userBalance + refundAmount);
          user.pending = String(userPending - refundAmount);
          await user.save();

          // Create refund history
          const refundHistory = {
            userid: booking.userid,
            details: "Fan meet request expired - automatic refund processed",
            spent: "0",
            income: `${refundAmount}`,
            date: `${Date.now().toString()}`
          };
          await historydb.create(refundHistory);

          // Send notifications
          await sendEmail(booking.userid, "Your fan meet request has expired and been refunded");
          await sendpushnote(booking.userid, "Your fan meet request has expired and been refunded", "fanicon");
          
          await sendEmail(booking.creatorid, "A fan meet request has expired");
          await sendpushnote(booking.creatorid, "A fan meet request has expired", "creatoricon");
          
          console.log(`Refunded ${refundAmount} to user ${booking.userid}`);
        }
      } catch (err) {
        console.error(`Error processing expired booking ${booking._id}:`, err);
      }
    }

    console.log(`Completed processing ${expiredRequests.length} expired requests`);
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
