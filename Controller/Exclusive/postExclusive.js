let exclusivedb = require("../../Models/exclusivedb")
const postexclusive = async(req,res)=>{

    let userid = req.body.userid;
    let content_type = req.body.content_type;
    let contentlink = req.body.contentlink;
    let contentname = req.body.contentname;
    let price = req.body.price;

   
    if(!userid || !content_type || !contentlink || !contentname || !price){
        return res.status(400).json({"ok":false,'message': 'Invalid post details!!'})
    }

    let data = {
        userid,
        content_type,
        contentlink,
        contentname,
        price
    }

    await exclusivedb.create(data)


    return res.status(200).json({"ok":true,'message': 'exclusive post successfully!!'})

}

module.exports = postexclusive;