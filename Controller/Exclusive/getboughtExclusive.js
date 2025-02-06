let exclusivePdb = require("../../Models/exclusivePurshase")
const crushdb = require("../../Models/crushdb")
const modeldb = require("../../Models/models")

const postexclusive = async(req,res)=>{

    let userid = req.body.userid;
    

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }

    let allcrush = []
    let allContent = []

    let mycrush =  await crushdb.find({userid:userid}).exec()
    let modelDetail =  await modeldb.find({}).exec()

    let myContent = await exclusivePdb.find({userid:userid}).exec()

    for(let i = 0 ; i< mycrush.length; i++){
       let modelInfo = modelDetail.find(value=>mycrush[i].modelid  === value._id )
       if(modelInfo){
        let data = {

            photolink : modelInfo.photolink,
            name : modelInfo.name,
            id : modelInfo._id
        }

        allcrush.push(data)
       }
    }

    myContent.forEach(value=>{
        let data = {
            exclusiveid:value.exclusiveid,
            name:value.exclusivename,
            id:value._id,
            exclusivelink:value.exclusivelink
        }
        allContent.push(data)
    })


    return res.status(200).json({"ok":true,'message': 'exclusive post successfully!!',data:{allcrush:allcrush, allcontent:allContent}})

}

module.exports = postexclusive;