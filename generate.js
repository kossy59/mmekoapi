const crypto = require("crypto");

// Generate a 64-character hex string
const accessToken = crypto.randomBytes(32).toString("hex");   
const refreshToken = crypto.randomBytes(32).toString("hex");  

console.log("ACCESS TOKEN:", accessToken);
console.log("REFRESH TOKEN:", refreshToken);

