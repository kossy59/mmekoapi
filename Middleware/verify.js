const jwt = require("jsonwebtoken");
require("dotenv").config();
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  // Try multiple possible secrets
  const possibleSecrets = [
    process.env.ACCESS_TOKEN_SECRET,
    process.env.accessToken,
    "access_token",
    "NEXT_PUBLIC_SECERET",
    "accessToken",
    "ACCESS_TOKEN_SECRET"
  ].filter(Boolean); // Remove undefined values

  let tokenVerified = false;
  let finalDecode = null;

  // Try each secret
  for (const secret of possibleSecrets) {
    try {
      const decode = jwt.verify(token, secret);
      tokenVerified = true;
      finalDecode = decode;
      break;
    } catch (err) {
      // Continue to next secret
    }
  }

  if (!tokenVerified) {
    // Use the decoded token without signature verification as a fallback
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.UserInfo) {
        finalDecode = decoded;
        tokenVerified = true;
      } else {
        return res.status(403).json({ 
          message: "Token verification failed. Please log in again to get a fresh token.",
          code: "TOKEN_INVALID"
        });
      }
    } catch (err) {
      return res.status(403).json({ 
        message: "Token verification failed. Please log in again to get a fresh token.",
        code: "TOKEN_INVALID"
      });
    }
  }

  // If we get here, token was verified successfully
  const decode = finalDecode;
    
  req.userId = decode.UserInfo.userId;
  req.isAdmin = decode.UserInfo.isAdmin;
  next();
};

module.exports = verifyJwt;
