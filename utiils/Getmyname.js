// const {connectdatabase} = require('../config/connectDB')
// const sdk = require("node-appwrite");

const models = require("../Models/models");
const userdb = require("../Models/userdb");
const completedb = require("../Models/usercomplete");

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

    //  let modelInfo = Listofmodel.documents.find(value =>{
    //     return value.$id === ID
    //  })

    let modelInfo = await models.findOne({ _id: ID }).exec();

    if (modelInfo) {
      let image = modelInfo.photolink.split(",");
      return {
        name: modelInfo.name,
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
