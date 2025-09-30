const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJwtBody = (req, res, next) => {
  
  // Try to get token from request body first
  let token = req.body.token;
  
  // If no token in body, try headers as fallback
  if (!token) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }


  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4";
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6";
  
  // Try to verify with access token secret first
  jwt.verify(token, accessTokenSecret, (err, decode) => {
    if (err) {
      
      // If access token fails, try refresh token secret
      jwt.verify(token, refreshTokenSecret, (refreshErr, refreshDecode) => {
        if (refreshErr) {
          return res.status(403).json({ message: refreshErr.message });
        }
        
        req.userId = refreshDecode.UserInfo.userId;
        req.isAdmin = refreshDecode.UserInfo.isAdmin;
        next();
      });
    } else {
      req.userId = decode.UserInfo.userId;
      req.isAdmin = decode.UserInfo.isAdmin;
      next();
    }
  });
};

module.exports = verifyJwtBody;
