const pushdb = require("../../Creators/pushnotifydb")

let updatepush = async(req,res)=>{

    let userid = req.body.userid
    let subinfo = req.body.subinfo

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'Invalid  ID!!'})
    }

    // Handle DELETE request (unsubscribe)
    if(req.method === 'DELETE'){
        try {
            await pushdb.deleteOne({userid:userid}).exec()
            return res.status(200).json({"ok":true,'message': 'push notification subscription removed!!'})
        } catch (err) {
            return res.status(500).json({"ok":false,'message': 'Error removing subscription!!'})
        }
    }

    // Handle POST request (subscribe/update)
    if(!subinfo){
        return res.status(400).json({"ok":false,'message': 'Invalid subscription info!!'})
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