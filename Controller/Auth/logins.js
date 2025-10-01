const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userdb = require("../../Models/userdb");
const baneddb = require("../../Models/admindb");
require("dotenv").config();
const handleLogin = async (req, res) => {
  const { nickname, password } = req.body;

  // Log payload with sensitive data masked
  console.log("Incoming login payload:", {
    nickname,
    password,
  });

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
      const refreshToken = jwt.sign(
        { UserInfo: { username: user.nickname, userId: user._id.toString() } },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      const accessToken = jwt.sign(
        { UserInfo: { username: user.nickname, userId: user._id.toString() } },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      console.log("ACCESS:", process.env.ACCESS_TOKEN_SECRET);
      console.log("REFRESH:", process.env.REFRESH_TOKEN_SECRET);
      // Update user's refresh token
      user.refreshtoken = refreshToken;
      await user.save();
      // await fixUserFields();

      // Set cookies
      res.cookie("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        ok: true,
        message: "Login Success",
        isAdmin: user.admin,
        userId: user._id,
        accessToken,
        token: refreshToken,
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
//           Model_Application_status: "none",
//           Model_Application: false,
//         },
//         $unset: {
//           Model_Applicatio_status: "",
//         },
//       },
//       { upsert: false }
//     );
//     console.log("Users updated:", result.modifiedCount);
//   } catch (err) {
//     console.error("Error updating users:", err);
//   }
// }
