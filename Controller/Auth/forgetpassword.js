const userdb = require("../../Models/userdb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const forgetpass = async (req, res) => {
  const { nickname, secretPhrase, newPassword } = req.body;

  if (!nickname || !secretPhrase || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: "Nickname, secret phrase and new password are required!",
    });
  }

  if (!Array.isArray(secretPhrase) || secretPhrase.length !== 12) {
    return res.status(400).json({
      ok: false,
      message: "Secret phrase must be 12 words",
    });
  }

  try {
    // 1️⃣ Find user
    const user = await userdb.findOne({ nickname }).exec();
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // 2️⃣ Verify secret phrase
    const phraseString = secretPhrase.join(" ");
    const isPhraseValid = await bcrypt.compare(
      phraseString,
      user.secretPhraseHash
    );

    if (!isPhraseValid) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid secret phrase" });
    }

    // 3️⃣ Update password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    // 4️⃣ Generate new tokens
    const refreshToken = jwt.sign(
      { UserInfo: { username: user.nickname } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    const accessToken = jwt.sign(
      { UserInfo: { username: user.nickname, userId: user._id.toString() } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    user.refreshtoken = refreshToken;
    user.accessToken = accessToken;
    await user.save();

    // 5️⃣ Set cookies
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

    return res.status(200).json({
      ok: true,
      message: "Password updated successfully",
      accessToken,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `Recovery error: ${err.message}`,
    });
  }
};

module.exports = forgetpass;
