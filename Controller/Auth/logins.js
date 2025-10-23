const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userdb = require("../../Creators/userdb");
const baneddb = require("../../Creators/admindb");
require("dotenv").config();
const handleLogin = async (req, res) => {
  const { nickname, password } = req.body;


  // Validate required fields
  if (!nickname || !password) {
    return res.status(400).json({
      ok: false,
      message: "Nickname and password are required.",
    });
  }

  const normalizedNickname = nickname.toLowerCase().trim();

  // Check if the nickname is banned or suspended
  let nicknameBanned = await baneddb
    .findOne({ nickname: normalizedNickname })
    .exec();

  if (nicknameBanned) {
    if (nicknameBanned.delete === true) {
      return res.status(400).json({
        ok: false,
        message: "Your account has been banned.",
      });
    }

    if (nicknameBanned.suspend === true) {
      let currentDate = Date.now();
      let endDate = new Date(Number(nicknameBanned.end_date));
      let current_date = new Date(currentDate);

      if (current_date.getTime() >= endDate.getTime()) {
        await baneddb.deleteOne({ nickname: normalizedNickname });
      } else {
        const diffTime = Math.abs(endDate - current_date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return res.status(400).json({
          ok: false,
          message: `Your account is suspended for ${diffDays} days.`,
        });
      }
    }
  }

  try {
    // Find user by nickname
    const user = await userdb.findOne({ nickname: normalizedNickname }).exec();

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "User not registered.",
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // Create tokens
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "NEXT_PUBLIC_SECERET";
      const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "NEXT_PUBLIC_SECERET";
      
      const refreshToken = jwt.sign(
        { UserInfo: { username: user.nickname, userId: user._id.toString(), isAdmin: user.admin } },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30d" }
      );

      const accessToken = jwt.sign(
        { UserInfo: { username: user.nickname, userId: user._id.toString(), isAdmin: user.admin } },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
      );
      // Update user's refresh token
      user.refreshtoken = refreshToken;
      await user.save();
      // await fixUserFields();

      // Set cookies
      res.cookie("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.status(200).json({
        ok: true,
        message: "Login Success",
        isAdmin: user.admin,
        userId: user._id,
        accessToken,
        token: refreshToken,
        // Include VIP status
        isVip: user.isVip || false,
        vipStartDate: user.vipStartDate || null,
        vipEndDate: user.vipEndDate || null,
        // Include all user information
        user: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          nickname: user.nickname,
          bio: user.bio,
          photolink: user.photolink,
          photoID: user.photoID,
          gender: user.gender,
          age: user.age,
          country: user.country,
          dob: user.dob,
          balance: user.balance,
          withdrawbalance: user.withdrawbalance,
          coinBalance: user.coinBalance,
          earnings: user.earnings,
          pending: user.pending,
          creator_verified: user.creator_verified,
          creator_portfolio: user.creator_portfolio,
          creator_portfolio_id: user.creator_portfolio_id,
          Creator_Application_status: user.Creator_Application_status,
          followers: user.followers,
          following: user.following,
          isVip: user.isVip,
          vipStartDate: user.vipStartDate,
          vipEndDate: user.vipEndDate,
          vipAutoRenewal: user.vipAutoRenewal,
          vipCelebrationViewed: user.vipCelebrationViewed,
          active: user.active,
          admin: user.admin,
          passcode: user.passcode,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } else {
      return res.status(401).json({
        ok: false,
        message: "Password mismatch.",
      });
    }
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({
      ok: false,
      message: `Login error: ${err.message}`,
    });
  }
};

module.exports = handleLogin;

// update all user
// async function fixUserFields() {
//   try {
//     const result = await userdb.updateMany(
//       {},
//       {
//         $set: {
//           Creator_Application_status: "none",
//           Creator_Application: false,
//         },
//         $unset: {
//           Creator_Applicatio_status: "",
//         },
//       },
//       { upsert: false }
//     );
//     console.log("Users updated:", result.modifiedCount);
//   } catch (err) {
//     console.error("Error updating users:", err);
//   }
// }
