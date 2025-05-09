let exclusivePdb = require("../../Models/exclusivePurshase")
const crushdb = require("../../Models/crushdb")
const modeldb = require("../../Models/models")
const userdb = require("../../Models/userdb")

const postexclusive = async (req, res) => {

    let userid = req.body.userid;

    console.log("my userID " + userid)
    

    if (!userid) {
        return res.status(400).json({ "ok": false, 'message': 'Invalid exclusive ID!!' })
    }

    let allcrush = []
    let allContent = []

    let mycrush = await crushdb.find({ userid: userid }).exec()
    let modelDetail = await modeldb.find({}).exec()
    let modelUser = await userdb.find({}).exec()

    let myContent = await exclusivePdb.find({ userid: userid }).exec()


    for (let i = 0; i < mycrush.length; i++) {
        let modelInfo = modelDetail.find(value => mycrush[i].modelid === String(value._id))
       
        if (modelInfo) {
            let onlineuser = modelUser.find(value => modelInfo.userid === String(value._id))
            let image = modelInfo.modelfiles[0].modelfilelink;

            const data = {
                photolink: image,
                name: modelInfo.name,
                id: mycrush[i]._id,
                userid: modelInfo.userid,
                hosttype: modelInfo.hosttype,
                modelid: modelInfo._id,
                location: modelInfo.location,
                online: onlineuser.active
            }

            allcrush.push(data)
        }
    }
   

    myContent.forEach(value => {
        const data = {
            exclusiveid: value.exclusiveid,
            name: value.exclusivename,
            id: value._id,
            exclusivelink: value.exclusivelink,
            contenttype: value.contenttype
        }
        allContent.push(data)
    })

    


    return res.status(200).json({ "ok": true, 'message': 'exclusive post successfully!!', data: { allcrush: allcrush, allcontent: allContent } })

}

module.exports = postexclusive;