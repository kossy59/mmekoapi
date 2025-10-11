let exclusivePdb = require("../../Creators/exclusivePurshase")
const crushdb = require("../../Creators/crushdb")
const creatordb = require("../../Creators/creators")
const userdb = require("../../Creators/userdb")

const postexclusive = async (req, res) => {

    let userid = req.body.userid;

    if (!userid) {
        return res.status(400).json({ "ok": false, 'message': 'Invalid exclusive ID!!' })
    }

    let allcrush = []
    let allContent = []

    let mycrush = await crushdb.find({ userid: userid }).exec()
    let creatorDetail = await creatordb.find({}).exec()
    let creatorUser = await userdb.find({}).exec()

    let myContent = await exclusivePdb.find({ userid: userid }).exec()


    for (let i = 0; i < mycrush.length; i++) {
        let creatorInfo = creatorDetail.find(value => mycrush[i].creator_portfolio_id === String(value._id))
       
        if (creatorInfo) {
            let onlineuser = creatorUser.find(value => creatorInfo.userid === String(value._id))
            let image = creatorInfo.creatorfiles[0].creatorfilelink;

            const data = {
                photolink: image,
                name: creatorInfo.name,
                id: mycrush[i]._id,
                userid: creatorInfo.userid,
                hosttype: creatorInfo.hosttype,
                creator_portfolio_id: creatorInfo._id,
                location: creatorInfo.location,
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