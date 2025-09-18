//const {userdb} = require('../../Model/userdb');
//const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require("bcrypt");
//const { Query } = require('node-appwrite');
//const sdk = require("node-appwrite");
//const forgetHandler = require("../../helpers/sendemailAuth");
// const mongoose = require("mongoose");
// const userdb = require("../../Models/userdb");
// const baneddb = require("../../Models/admindb");
// const usercompletedb = require("../../Models/usercomplete");
// let pushdb = require("../../Models/settingsdb");

//onst bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const userdb = require("../../Models/userdb");
const usercompletedb = require("../../Models/usercomplete");
const pushdb = require("../../Models/settingsdb");
const jwt = require("jsonwebtoken");

const handleNewUser = async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const gender = req.body.gender;
  const nickname = req.body.nickname;
  const password = req.body.password;
  const age = req.body.age;
  const country = req.body.country;
  const dob = req.body.dob;
  const secretPhrase = req.body.secretPhrase; // Array of 12 words from frontend

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

  // Fast-fail if DB is not connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      ok: false, 
      message: "Database not connected. Please try again later." 
    });
  }

  // Ensure nickname is unique
  try {
    const existingNickname = await userdb.findOne({ nickname: nickname }).exec();
    if (existingNickname) {
      return res.status(400).json({ 
        ok: false, 
        message: "Nickname already taken!" 
      });
    }
  } catch (err) {
    return res.status(500).json({ 
      ok: false, 
      message: `Error checking nickname: ${err.message}` 
    });
  }

  try {
    // Hash password only (secret phrase is stored as plain text for recovery)
    const hashPwd = await bcrypt.hash(password, 10);

    // Create tokens
    const refreshToken = jwt.sign(
      { UserInfo: { username: nickname } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    
    const accessToken = jwt.sign(
      { 
        UserInfo: { 
          username: nickname,
          userId: "" // Will be updated after user creation
        } 
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // Create user with plain text secret phrase (for recovery)
    const user = await userdb.create({
      firstname,
      lastname,
      gender,
      nickname,
      password: hashPwd,
      secretPhrase, // Store the 12 words as array (not hashed)
      secretPhraseHash: "", // Not needed since we're storing plain text
      active: true,
      country,
      refreshtoken: refreshToken,
      accessToken: accessToken,
      age,
      admin: false,
      passcode: "",
      balance: "0",
      dob,
    });

    // Update token with user ID
    const updatedAccessToken = jwt.sign(
      { 
        UserInfo: { 
          username: nickname,
          userId: user._id.toString()
        } 
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    
    // Update user with new token
    user.accessToken = updatedAccessToken;
    await user.save();

    // Create user profile and settings
    await usercompletedb.create({
      useraccountId: user._id,
      interestedIn: "Nothing",
      details: "Hey, I am using our platform",
    });

    await pushdb.create({
      emailnot: false,
      pushnot: true,
      userid: user._id,
    });

    // Set auth cookie
    res.cookie('auth_token', updatedAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ 
      ok: true, 
      message: "User registered successfully", 
      userId: user._id,
      accessToken: updatedAccessToken
    });

  } catch (err) {
    return res.status(500).json({ 
      ok: false, 
      message: `Registration error: ${err.message}` 
    });
  }
};

module.exports = handleNewUser;