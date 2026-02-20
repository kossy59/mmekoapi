const userdb = require("../../Creators/userdb");
const messagedb = require("../../Creators/message"); // Verify this path matches getcurrentChat.js require
const completedb = require("../../Creators/usercomplete");
const postdb = require("../../Creators/post");
const likedb = require("../../Creators/like");
const followdb = require("../../Creators/followers");
const { pushMessageNotification, pushAdminNotification } = require("../../utiils/sendPushnot");
const sendEmail = require("../../utiils/sendEmailnot");
const admindb = require("../../Creators/admindb");
const balancehistorydb = require("../../Creators/mainbalance");

// 1. User Requests PPV Feature
const requestPPV = async (req, res) => {
    const { userid } = req.body;

    if (!userid) {
        return res.status(400).json({ ok: false, message: "User ID is required" });
    }

    try {
        const user = await userdb.findById(userid);
        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        if (user.ppvStatus === "approved") {
            return res.status(400).json({ ok: false, message: "Already approved" });
        }

        if (user.ppvStatus === "pending") {
            return res.status(400).json({ ok: false, message: "Request already pending" });
        }

        user.ppvStatus = "pending";
        await user.save();

        // Notify Admins
        // const admins = await userdb.find({ admin: true });
        // for (const admin of admins) {
        //   await pushAdminNotification(admin._id, `New Pay Per View Request from ${user.username || user.firstname}`);
        // }

        return res.status(200).json({ ok: true, message: "Request submitted successfully" });
    } catch (error) {
        console.error("Error asking for PPV:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// 2. Admin Gets Pending Requests
const getPPVRequests = async (req, res) => {
    try {
        const pendingUsers = await userdb.find({ ppvStatus: "pending" });

        const enrichedRequests = await Promise.all(pendingUsers.map(async (user) => {
            const followersCount = await followdb.countDocuments({ userid: user._id });
            const followingCount = await followdb.countDocuments({ followerid: user._id });

            // Fetch likes count: find all posts by user, then count likes for those posts
            const userPosts = await postdb.find({ userid: user._id }, '_id');
            const postIds = userPosts.map(p => p._id);
            const likesCount = await likedb.countDocuments({ postid: { $in: postIds } });

            let photolink = user.photolink;
            if (!photolink) {
                const completeProfile = await completedb.findOne({ useraccountId: user._id });
                photolink = completeProfile ? completeProfile.photoLink : "";
            }

            return {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                photolink: photolink,
                followersCount,
                followingCount,
                likesCount,
                hasPortfolio: !!user.creator_portfolio_id,
                status: user.ppvStatus
            };
        }));

        return res.status(200).json({ ok: true, requests: enrichedRequests });

    } catch (error) {
        console.error("Error getting PPV requests:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// 3. Admin Approves/Declines Request
const actionPPVRequest = async (req, res) => {
    const { userid, action } = req.body; // action: "approve" | "decline"

    if (!userid || !action) {
        return res.status(400).json({ ok: false, message: "User ID and action required" });
    }

    try {
        const user = await userdb.findById(userid);
        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        if (action === "approve") {
            user.ppvStatus = "approved";
            user.ppvEnabled = true;
            user.creator_verified = true; // Auto verify creator if approved for PPV? Maybe not.
            await user.save();

            const message = "Your Pay Per View request has been APPROVED! Go to settings to set your price.";

            // 1. Database Notification
            await admindb.create({
                userid: userid,
                message: message,
                title: "PPV Approved",
                seen: false
            });

            // 2. Push Notification
            await pushMessageNotification(userid, message, "System");

        } else if (action === "decline") {
            user.ppvStatus = "declined";
            user.ppvEnabled = false;
            await user.save();

            const message = "Your Pay Per View request was declined.";

            // 1. Database Notification
            await admindb.create({
                userid: userid,
                message: message,
                title: "PPV Declined",
                seen: false
            });

            // 2. Push Notification
            await pushMessageNotification(userid, message, "System");
        } else {
            return res.status(400).json({ ok: false, message: "Invalid action" });
        }

        return res.status(200).json({ ok: true, message: `Request ${action}d successfully` });

    } catch (error) {
        console.error("Error processing PPV action:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// 4. User Updates PPV Settings (Price/Toggle)
const updatePPVSettings = async (req, res) => {
    const { userid, price, enabled } = req.body;

    if (!userid) {
        return res.status(400).json({ ok: false, message: "User ID required" });
    }

    try {
        const user = await userdb.findById(userid);
        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        if (user.ppvStatus !== "approved") {
            return res.status(403).json({ ok: false, message: "Feature not approved for this user" });
        }

        if (price !== undefined) user.ppvPrice = Number(price);
        if (enabled !== undefined) user.ppvEnabled = Boolean(enabled);

        await user.save();

        return res.status(200).json({ ok: true, message: "Settings updated", ppvPrice: user.ppvPrice, ppvEnabled: user.ppvEnabled });

    } catch (error) {
        console.error("Error updating PPV settings:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// 5. Unlock Message
const unlockMessage = async (req, res) => {
    const { userid, messageid } = req.body; // userid is the one PAYING (viewer)

    if (!userid || !messageid) {
        return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    try {
        const message = await messagedb.findById(messageid);
        if (!message) {
            return res.status(404).json({ ok: false, message: "Message not found" });
        }

        if (!message.isPPV) {
            return res.status(400).json({ ok: false, message: "Not a PPV message" });
        }

        // Check if unlocked
        if (message.unlockedBy.includes(userid)) {
            return res.status(200).json({ ok: true, message: "Already unlocked", content: message.content, files: message.files });
        }

        // Check if user is the sender 
        if (message.fromid === userid) {
            return res.status(200).json({ ok: true, message: "You are the sender", content: message.content, files: message.files });
        }

        const viewer = await userdb.findById(userid);
        if (!viewer) return res.status(404).json({ ok: false, message: "Viewer not found" });

        const price = message.ppvPrice;
        const currentBalance = parseFloat(viewer.balance || "0");

        if (currentBalance < price) {
            return res.status(400).json({ ok: false, message: `Insufficient balance. You need ${price} gold.`, code: "INSUFFICIENT_FUNDS" });
        }

        // Deduct from Viewer
        const newViewerBalance = currentBalance - price;
        viewer.balance = newViewerBalance.toString();
        await viewer.save();

        // Credit Creator (Sender)
        const sender = await userdb.findById(message.fromid);
        if (sender) {
            const currentSenderBalance = parseFloat(sender.balance || "0");

            sender.balance = (currentSenderBalance + price).toString();
            sender.earnings = (sender.earnings || 0) + price;

            await sender.save();

            // Create Transaction History & Notifications
            const date = Date.now().toString();

            // 1. Transaction for Viewer (Buyer)
            await balancehistorydb.create({
                userid: userid,
                details: `Purchased PPV message from ${sender.username || sender.firstname}`,
                spent: price.toString(),
                date: date
            });

            // 2. Transaction for Sender (Seller)
            await balancehistorydb.create({
                userid: message.fromid,
                details: `Earning from PPV message sale to ${viewer.username || viewer.firstname}`,
                income: price.toString(),
                date: date
            });

            // 3. Database Notification for Sender
            await admindb.create({
                userid: message.fromid,
                message: `${viewer.username || viewer.firstname} purchased your PPV message`,
                seen: false
            });

            // 4. Send Push Notification to Sender
            await pushMessageNotification(
                message.fromid,
                `${viewer.username || viewer.firstname} purchased your PPV message`,
                viewer.username || viewer.firstname
            );
        }

        // Mark as unlocked
        message.unlockedBy.push(userid);
        await message.save();

        return res.status(200).json({ ok: true, message: "Message unlocked successfully", content: message.content, files: message.files });

    } catch (error) {
        console.error("Error unlocking message:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
}

module.exports = {
    requestPPV,
    getPPVRequests,
    actionPPVRequest,
    updatePPVSettings,
    unlockMessage
};
