let deleteaccount = require("../../utiils/Deletes/deleteaccount")

let deleteAcc = async(req, res)=>{
    let userid = req.body.userid

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }

    await deleteaccount(userid)

    return res.status(200).json({"ok":true,'message': 'Account Delete Success'})


}

module.exports = deleteAcc;