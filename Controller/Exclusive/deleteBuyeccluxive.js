let exclusivedb = require("../../Models/exclusivePurshase")
const postexclusive = async(req,res)=>{

    let id = req.body.id;
    

    if(!id){
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }

   
    await exclusivedb.deleteOne({_id:id}).exec()


    return res.status(200).json({"ok":true,'message': 'exclusive post successfully!!'})

}

module.exports = postexclusive;