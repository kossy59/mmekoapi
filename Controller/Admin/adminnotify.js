const admindb = require("../../Creators/admindb");

const updatePost = async (req, res) => {
  const userid = req.body.userid;


  if (!userid) {
    return res.status(400).json({ ok: false, message: "invalid userID!!" });
  }

  try {
    let adminMSG = await admindb.find({ userid: userid }).exec();

    if (!adminMSG) {
      return res
        .status(200)
        .json({
          ok: true,
          message: "add users!!",
          notifyme: false,
          notifycount: 0,
        });
    }

    let notifyme = false;
    let notifycount = 0;

    adminMSG.forEach((value) => {
      if (!value.seen) {
        notifyme = true;
        notifycount++;
      }
    });

    return res
      .status(200)
      .json({ ok: true, message: `Successfully`, notifycount, notifyme });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = updatePost;
