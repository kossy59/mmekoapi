const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJwtBody = (req, res, next) => {
  
  // Try to get token from request body first
  let token = req.body.token;
  
  // If no token in body, try headers as fallback
  if (!token) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log("🔍 [VERIFYBODY] Auth header:", authHeader);
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("🔍 [VERIFYBODY] Token from header:", token);
    }
  } else {
    console.log("🔍 [VERIFYBODY] Token from body:", token);
  }


  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "NEXT_PUBLIC_SECERET";
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "NEXT_PUBLIC_SECERET";
  
  console.log("🔍 [VERIFYBODY] Token length:", token?.length);
  console.log("🔍 [VERIFYBODY] Token preview:", token?.substring(0, 20) + "...");
  
  // Try to verify with access token secret first
  jwt.verify(token, accessTokenSecret, (err, decode) => {
    if (err) {
      console.log("❌ [VERIFYBODY] Access token verification failed:", err.message);
      
      // If access token fails, try refresh token secret
      jwt.verify(token, refreshTokenSecret, (refreshErr, refreshDecode) => {
        if (refreshErr) {
          console.log("❌ [VERIFYBODY] Refresh token verification failed:", refreshErr.message);
          return res.status(403).json({ message: refreshErr.message });
        }
        
        console.log("✅ [VERIFYBODY] Refresh token verified successfully");
        req.userId = refreshDecode.UserInfo.userId;
        req.isAdmin = refreshDecode.UserInfo.isAdmin;
        next();
      });
    } else {
      console.log("✅ [VERIFYBODY] Access token verified successfully");
      req.userId = decode.UserInfo.userId;
      req.isAdmin = decode.UserInfo.isAdmin;
      next();
    }
  });
};

module.exports = verifyJwtBody;
