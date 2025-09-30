// const {userdb} = require('../../Creator/userdb');
// const {memko_socialDB,database} = require('../../config/connectDB')
const userdb = require("../../Creators/userdb");

const handleNewUser = async (req, res) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({ ok: false, message: "Email Empty" });
  }

  try {
    let dupplicate = await userdb
      .findOne({ email: email.toLowerCase() })
      .exec();

    if (dupplicate) {
      dupplicate.refreshtoken = "";

      dupplicate.save();

      res
        .status(200)
        .json({ ok: true, message: "Logout Success", token: refreshToken });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = handleNewUser;
