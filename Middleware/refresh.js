const jwt = require("jsonwebtoken");
//const {connectdatabase} = require('../config/connectDB');
const userdb = require("../Creators/userdb");

const handleRefresh = async (req, res, next) => {
  let token = "";

  // Try to get refresh token from multiple locations to be robust for multipart/form-data
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

  token = req.body?.token || req.headers["x-refresh-token"] || bearerToken || "";
  //let data = await connectdatabase()

  // console.log("Token is: ", token, req.body);

  if (!token) {
    return res.status(401).json({ message: `token not found!!!` });
  }
  const refreshToken = token.toString();

  try {
    //     let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //     let du = dupplicate.documents.filter(value=>{
    //     return value.refreshtoken === token
    //    })

    let du = await userdb.findOne({ refreshtoken: token }).exec();

    if (du) {
      jwt.verify(refreshToken, process.env.refreshToken, (err, decode) => {
        if (err || du.email !== decode.UserInfo.username) {
          return res
            .status(403)
            .json({ message: `${err.message} please login again` });
        }
        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: du.email,
            },
          },
          process.env.accessToken,
          { expiresIn: "30d" }
        );

        req.headers.authorization = "Bearer " + accessToken;

        next();
      });
    } else {
      return res.status(401).json({ message: ` token Expire log in please` });
    }
  } catch (err) {
    return res.status(401).json({ message: ` ${err.message} log in please` });
  }
};

module.exports = handleRefresh;
