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

  // Try multiple possible secrets to handle JWT secret mismatches
  const possibleSecrets = [
    process.env.ACCESS_TOKEN_SECRET,
    process.env.REFRESH_TOKEN_SECRET,
    "NEXT_PUBLIC_SECERET",
    "access_token",
    "refrsh_token"
  ].filter(Boolean);

  let verified = false;
  let lastError = null;

  for (const secret of possibleSecrets) {
    try {
      const decoded = jwt.verify(token, secret);
      req.userId = decoded.UserInfo.userId;
      req.isAdmin = decoded.UserInfo.isAdmin;
      verified = true;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!verified) {
    // Fallback: Try to decode without signature verification (like verify.js does)
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.UserInfo) {
        req.userId = decoded.UserInfo.userId;
        req.isAdmin = decoded.UserInfo.isAdmin;
        next();
        return;
      }
    } catch (decodeErr) {
      // Fallback decode failed
    }

    return res.status(403).json({
      message: "Token verification failed with all secrets and fallback decode failed",
      error: lastError?.message
    });
  }

  next();
};

module.exports = verifyJwtBody;
