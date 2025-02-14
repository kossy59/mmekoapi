const blockuserdb = require("../../Models/BlockedDB")

let deleteAcc = async(req, res)=>{
    let id = req.body.id

    if(!id){
        return res.status(400).json({"ok":false,'message': 'Invalid  ID!!'})
    }

    await blockuserdb.deleteOne({_id:id}).exec()

    return res.status(200).json({"ok":true,'message': 'Account Removed Success'})


}

module.exports = deleteAcc;