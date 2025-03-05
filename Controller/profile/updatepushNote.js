const pushdb = require("../../Models/pushnotifydb")

let updatepush = async(req,res)=>{

    let userid = req.body.userid
    let subinfo = req.body.subinfo

    if(!userid || !subinfo){
        return res.status(400).json({"ok":false,'message': 'Invalid  ID!!'})
    }

    let pushinfo = await pushdb.findOne({userid:userid}).exec()

    if(pushinfo){
        pushinfo.subinfo = subinfo
        pushinfo.save()
        return res.status(200).json({"ok":true,'message': 'push notification success!!'})
    }else{
        let datainfos = {
            userid:userid,
            subinfo:subinfo
        }

        await pushdb.create(datainfos)
        return res.status(200).json({"ok":true,'message': 'push notification success!!'})
    }

}

module.exports = updatepush