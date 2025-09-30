// const {connectdatabase} = require('../config/connectDB')
// const sdk = require("node-appwrite");

const creators = require("../Creators/creators");
const userdb = require("../Creators/userdb");
const completedb = require("../Creators/usercomplete");

const MYID = async (ID) => {
  //let data = await connectdatabase();

  try {
    //  let name = Listofusername.documents.find(value =>{
    //     return ID === value.$id
    //  })

    let name = await userdb.findOne({ _id: ID }).exec();

    //  let clientPhoto = Listofuserphoto.documents.find(value =>{
    //     return value.useraccountId === ID
    //  })

    let clientPhoto = await completedb.findOne({ useraccountId: ID }).exec();

    //  let creatorInfo = Listofcreator.documents.find(value =>{
    //     return value.$id === ID
    //  })

    let creatorInfo = await creators.findOne({ _id: ID }).exec();

    if (creatorInfo) {
      let image = creatorInfo.photolink.split(",");
      return {
        name: creatorInfo.name,
        photolink: image[0],
      };
    } else if (name) {
      return {
        name: name.firstname,
        photolink: clientPhoto?.photoLink || "",
      };
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
};

module.exports = MYID;
