//const {userdb} = require('../../Creator/userdb');
//const {connectdatabase} = require('../../config/connectDB');
//const { Query } = require('node-appwrite');
//const sdk = require("node-appwrite");
//const forgetHandler = require("../../helpers/sendemailAuth");
// const mongoose = require("mongoose");
// const userdb = require("../../Creators/userdb");
//const baneddb = require("../../Creators/admindb");
// const usercompletedb = require("../../Creators/usercomplete");
// let pushdb = require("../../Creators/settingsdb");

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const userdb = require("../../Creators/userdb");
const usercompletedb = require("../../Creators/usercomplete");
const pushdb = require("../../Creators/settingsdb");

const handleNewUser = async (req, res) => {
  console.log("Incoming registration payload:", req.body);

  const { firstname, lastname, gender, nickname, password, age, country, dob, secretPhrase } = req.body;

  // Validate required fields
  if (
    !firstname ||
    !lastname ||
    !gender ||
    !password ||
    !age ||
    !country ||
    !nickname ||
    !dob ||
    !secretPhrase ||
    !Array.isArray(secretPhrase) ||
    secretPhrase.length !== 12
  ) {
    return res.status(400).json({
      ok: false,
      message: "Registration not complete! All fields including 12-word secret phrase are required."
    });
  }

  // Check DB connection
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      ok: false,
      message: "Database not connected. Please try again later."
    });
  }

  try {
    // Ensure nickname is unique
    const existingNickname = await userdb.findOne({ nickname }).exec();
    if (existingNickname) {
      return res.status(400).json({
        ok: false,
        message: "Nickname already taken!"
      });
    }

    // 🔐 Hash password
    const hashPwd = await bcrypt.hash(password, 10);

    // 🔐 Hash secret phrase (join into one string before hashing)
    const phraseString = secretPhrase.join(" ");
    const hashSecretPhrase = await bcrypt.hash(phraseString, 10);

    // Create tokens
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6";
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4";
    
    const refreshToken = jwt.sign(
      { UserInfo: { username: nickname } },
      refreshTokenSecret,
      { expiresIn: "7d" }
    );

    let accessToken = jwt.sign(
      { UserInfo: { username: nickname, userId: "" } },
      accessTokenSecret,
      { expiresIn: "15m" }
    );

    // Create user in DB
    const user = await userdb.create({
      firstname,
      lastname,
      gender,
      nickname,
      password: hashPwd,
      secretPhraseHash: hashSecretPhrase,
      active: true,
      country,
      refreshtoken: refreshToken,
      accessToken,
      age,
      admin: false,
      passcode: "",
      balance: "0",
      dob,
    });

    // Update access token with user ID
    accessToken = jwt.sign(
      { UserInfo: { username: nickname, userId: user._id.toString() } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    user.accessToken = accessToken;
    await user.save();

    // Create user profile + settings
    await usercompletedb.create({
      useraccountId: user._id.toString(),
      interestedIn: "Nothing",
      details: "Hey, I am using our platform",
    });

    await pushdb.create({
      emailnot: false,
      pushnot: true,
      userid: user._id.toString(),
    });

    // Set cookies
    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      userId: user._id,
      accessToken,
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    return res.status(500).json({
      ok: false,
      message: `Registration error: ${err.message}`,
    });
  }
};

module.exports = handleNewUser;
