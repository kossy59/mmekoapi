const userdb = require("../../Models/userdb");
const usercom = require("../../Models/usercomplete");

let deleteAcc = async (req, res) => {
  let list_of_users = await userdb.find({}).exec();
  let user_photos = await usercom.find({}).exec();

  let users = [];

  if (list_of_users.length > 0) {
    list_of_users.forEach((value) => {
      let photo = "";
      let photos = user_photos.find(
        (value1) => String(value._id) === String(value1.useraccountId)
      );
      if (photos?.photoLink) {
        photo = photos?.photoLink || "";
      }

      let data = {
        name: `${value.firstname} ${value.lastname}`,
        nickname: value.nickname,
        userid: value._id,
        photolink: photo,
        country: value.country,
        gender: value.gender,
        age: value.age,
      };

      users.push(data);
    });
    return res
      .status(200)
      .json({ ok: true, message: "Fectch Success", users: users });
  } else {
    return res
      .status(200)
      .json({ ok: true, message: "Fectch Success", users: [] });
  }
};

module.exports = deleteAcc;
