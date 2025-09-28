const jwt = require("jsonwebtoken");
require("dotenv").config();
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4";
  jwt.verify(token, accessTokenSecret, (err, decode) => {
    if (err) {
      return res.status(403).json({ message: err.message });
    }
    // req.user = decode.UserInfo.username;
    req.userId = decode.UserInfo.userId;
    req.isAdmin = decode.UserInfo.isAdmin;
    next();
  });
};

module.exports = verifyJwt;
