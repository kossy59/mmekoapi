// // const {userdb} = require('../../Model/userdb');
// // const {connectdatabase} = require('../../config/connectDB');
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const userdb = require("../../Models/userdb");
// const baneddb = require("../../Models/admindb");

// const handleNewUser = async (req, res) => {
//   const email = req.body.email;
//   const password = req.body.password;
//   //    console.log('untop connecting to database')
//   //     let data = await connectdatabase()
//   if (!email && !password) {
//     return res
//       .status(400)
//       .json({ ok: false, message: "Email OR Password Empty" });
//   }
//   let Email = email.toLowerCase().trim();

//   let emailbaned = await baneddb.findOne({ email: Email }).exec();

//   if (emailbaned) {
//     if (emailbaned.delete === true) {
//       return res
//         .status(400)
//         .json({ ok: false, message: "You account have been banned" });
//     }

//     if (emailbaned.suspend === true) {
//       let CDate = Date.now();
//       let endDate = new Date(Number(emailbaned.end_date));
//       let current_date = new Date(Number(CDate));

//       if (current_date.getTime() >= endDate.getTime()) {
//         await baneddb.deleteOne({ email: Email });
//       }

//       if (current_date.getTime() < endDate.getTime()) {
//         const diffTime = Math.abs(endDate - current_date);
//         const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//         return res.status(400).json({
//           ok: false,
//           message: `your account is suspended for ${diffDays}-Days`,
//         });
//       }
//     }
//   }

//   try {
//     //console.log('untop getting  database')

//     //  let mail = email.toLowerCase()

//     let du = await userdb.findOne({ email: Email }).exec();

//     //      let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

//     //     let du = dupplicate.documents.filter(value=>{
//     //     return value.email === email
//     //    })

//     // console.log('untop checking  database email '+mail.toLowerCase())
//     // console.log('untop checking  database email1 '+du)

//     if (du) {
//       if (du.emailconfirm !== "verify") {
//         res.status(401).json({ ok: false, message: "notverify" });
//         await forgetHandler(req, res, email);
//       }
//       const match = await bcrypt.compare(password, du.password);

//       if (match) {
//         const refreshToken = jwt.sign(
//           {
//             UserInfo: {
//               username: du.email,
//             },
//           },
//           process.env.refreshToken,
//           { expiresIn: "30d" }
//         );

//         //  console.log('untop updating  database')
//         // await data.databar.updateDocument(
//         //     data.dataid,
//         //     data.colid,
//         //      du[0].$id,
//         //      {
//         //         refreshtoken:refreshToken
//         //      }
//         //  )
//         du.refreshtoken = refreshToken;
//         du.save();

//         res.status(200).json({
//           ok: true,
//           message: "Login Success",
//           id: du._id,
//           token: refreshToken,
//           modelId: du.modelId,
//           isModel: du.isModel,
//         });
//       } else {
//         res.status(401).json({ ok: false, message: "Password mismatch" });
//       }
//     } else {
//       return res.status(400).json({ ok: false, message: "User Not Register" });
//     }
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ ok: false, message: `${err}!` });
//   }
// };

// module.exports = handleNewUser;

// const {userdb} = require('../../Model/userdb');
// const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userdb = require("../../Models/userdb");
const baneddb = require("../../Models/admindb");

const handleNewUser = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
     console.log({email, password})
  //     let data = await connectdatabase()
  if (!email && !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Email OR Password Empty" });
  }
  let Email = email.toLowerCase().trim();

  let emailbaned = await baneddb.findOne({ email: Email }).exec();

  if (emailbaned) {
    if (emailbaned.delete === true) {
      return res
        .status(400)
        .json({ ok: false, message: "Your account have been banned" });
    }

    if (emailbaned.suspend === true) {
      let CDate = Date.now();
      let endDate = new Date(Number(emailbaned.end_date));
      let current_date = new Date(Number(CDate));

      if (current_date.getTime() >= endDate.getTime()) {
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
    //console.log('untop getting  database')

    //  let mail = email.toLowerCase()

    let du = await userdb.findOne({ email: Email }).exec();

    //      let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //     let du = dupplicate.documents.filter(value=>{
    //     return value.email === email
    //    })

    // console.log('untop checking  database email '+mail.toLowerCase())
    // console.log('untop checking  database email1 '+du)

    if (du) {
      if (du.emailconfirm !== "verify") {
        res.status(401).json({ ok: false, message: "notverify" });
        await forgetHandler(req, res, email);
      }
      const match = await bcrypt.compare(password, du.password);

      if (match) {
        const refreshToken = jwt.sign(
          {
            UserInfo: {
              username: du.email,
            },
          },
          process.env.refreshToken,
          { expiresIn: "30d" }
        );
        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: du.email,
              userId: du._id.toString() 
            },
          },
          process.env.accessToken,  // secret key for access token
          { expiresIn: "30d" }       // shorter life
        );

        du.refreshtoken = refreshToken;
        du.save();

        console.log({accessToken})

        const allowedOrigins = [
          "http://localhost:3000",
          "https://mmeko.com",
          "https://mmekowebsite.onrender.com",
        ];

        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        }
        res.status(200)
        .cookie('auth_token', accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          path: '/',
        })
        .json({
          ok: true,
          message: "Login Success",
          user: du
        });
      } else {
        res.status(401).json({ ok: false, message: "Password mismatch" });
      }
    } else {
      return res.status(400).json({ ok: false, message: "User Not Registered" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err}!` });
  }
};

module.exports = handleNewUser;
