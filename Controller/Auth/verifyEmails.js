const PendingUser = require("../../Models/pendingUser");
const userdb = require("../../Models/userdb");
const usercompletedb = require("../../Models/usercomplete");
let pushdb = require("../../Models/settingsdb");
const handleNewUser = async (req, res) => {
  const code = req.body.code;
  const email = req.body.email;
  let match = undefined;

  if (!code && !email) {
    return res
      .status(400)
      .json({ ok: false, message: "Please enter authentication code!!" });
  }

  let Email = email.toLowerCase().trim();
  try {
    match = await PendingUser.findOne({ email: Email }).exec();

    if (match) {
      if (Number(match.emailconfirm) === Number(code)) {
        match.emailconfirm = `verify`;

        // create tokens
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
        )

        var db = {
          firstname: match.firstname,
          lastname: match.lastname,
          gender: match.gender,
          nickname: match.nickname,
          email: match.email,
          password: match.password,
          emailconfirm: match.emailconfirm,
          emailconfirmtime: "not",
          active: false,
          country: match.country,
          refreshtoken: refreshToken,
          accessToken: accessToken,
          age: match.age,
          admin: false,
          passcode: match.passcode,
          balance: match.balance,
          dob: match.dob,
        };
        const user = await userdb.create(db);
        var moreuser = {
          useraccountId: user._id,
          interestedIn: "Nothing",
          details: "Hey, I am using Mmeko",
        };

        await usercompletedb.create(moreuser);

        let notification = {
          emailnot: true,
          pushnot: true,
          userid: user._id,
        };

        await pushdb.create(notification);
        await match.deleteOne();

        return res.status(200)
        .cookie('auth_token', accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          path: '/',
        })
        .json({
          ok: true,
          message: `${user.firstname} ${user.lastname} Account Created Success`,
          ID: `${match._id}`,
        });
      } else {
        return res
          .status(409)
          .json({ ok: false, message: `Authentication code mismatch` });
      }
    } else {
      return res
        .status(409)
        .json({ ok: false, message: `email code mismatch` });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = handleNewUser;
