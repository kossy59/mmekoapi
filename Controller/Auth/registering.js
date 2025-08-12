//const {userdb} = require('../../Model/userdb');
//const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require("bcrypt");
//const { Query } = require('node-appwrite');
//const sdk = require("node-appwrite");
const forgetHandler = require("../../helpers/sendemailAuth");
const userdb = require("../../Models/userdb");
const baneddb = require("../../Models/admindb");
const usercompletedb = require("../../Models/usercomplete");
let pushdb = require("../../Models/settingsdb");
const PendingUser = require("../../Models/pendingUser");

const handleNewUser = async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const gender = req.body.gender;
  let username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const age = req.body.age;
  const country = req.body.country;
  const dob = req.body.dob;

  //let data = await connectdatabase()

  if (
    !firstname &&
    !lastname &&
    !gender &&
    !email &&
    !password &&
    !age &&
    country &&
    !username &&
    !dob
  ) {
    return res
      .status(400)
      .json({ ok: false, message: "Registeration not complete!!" });
  }
  //let dupplicate;
  let Email = email.toLowerCase().trim();
  console.log({body: req.body})

  let emailbaned = await baneddb.findOne({ email: Email }).exec();
  let user_uncon = await userdb.findOne({ email: Email }).exec();

  let existingUser = await userdb.find({nickname: username}).exec();

  if (existingUser.nickname) {
    return res
      .status(400)
      .json({ ok: false, message: "Nickname already taken!!" });
  }

  if (user_uncon) {
    if (user_uncon.emailconfirm !== "verify") {
      await userdb.deleteOne({ _id: user_uncon._id });
      await usercompletedb.deleteOne({ useraccountId: user_uncon._id });
      await pushdb.deleteOne({ userid: user_uncon._id });
    }
  }

  if (emailbaned) {
    if (emailbaned.delete === true) {
      return res
        .status(400)
        .json({ ok: false, message: "You account have been banned" });
    }

    if (emailbaned.suspend === true) {
      let CDate = Date.now();
      let endDate = new Date(Number(emailbaned.end_date));
      let current_date = new Date(Number(CDate));

      if (current_date.getTime() > endDate.getTime()) {
        await baneddb.deleteOne({ email: Email });
      }

      if (current_date.getTime() < endDate.getTime()) {
        const diffTime = Math.abs(endDate - current_date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return res.status(400).json({
          ok: false,
          message: `your account is suspended for ${diffDays}-Days`,
        });
      }
    }
  }

  try {
    let dublicate = await userdb
      .findOne({
        email: Email,
      })
      .exec();
    //let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //    let du = dupplicate.documents.filter(value=>{
    //     return value.email === email
    //    })

    if (dublicate) {
      return res
        .status(409)
        .json({ ok: false, message: "User Already Register!!" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: `${err.message}! search dublicate` });
  }

  // if (!username) {
  //   username = "";
  // }

  try {
    const hashPwd = await bcrypt.hash(password, 10);

    var db = {
      firstname,
      lastname,
      gender,
      nickname: username,
      email,
      password: hashPwd,
      emailconfirm: "not",
      emailconfirmtime: "not",
      active: false,
      country: country,
      refreshtoken: "",
      age: age,
      admin: false,
      passcode: "",
      balance: "",
      dob: dob,
    };

    await PendingUser.create(db);

    //await data.databar.createDocument(data.dataid,data.colid,sdk.ID.unique(),db)
    // await forgetHandler(req, res, Email);
    //await forgetHandler(req,res,)
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: ` register: ${err}` });
  }
};

module.exports = handleNewUser;
