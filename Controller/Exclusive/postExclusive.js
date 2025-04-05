let exclusivedb = require("../../Models/exclusivedb")
const postexclusive = async(req,res)=>{

    let userid = req.body.userid;
    let content_type = req.body.content_type;
    let contentlink = req.body.contentlink;
    let contentname = req.body.contentname;
    let price = req.body.price;
    let thumblink = req.body.thumblink;

   
    if(!userid || !content_type || !contentlink || !contentname || !price || !thumblink){
        return res.status(400).json({"ok":false,'message': 'Invalid post details!!'})
    }

    let data = {
        userid,
        content_type,
        contentlink,
        contentname,
        price,
        thumblink
    }

    await exclusivedb.create(data)


    return res.status(200).json({"ok":true,'message': 'exclusive post successfully!!'})

}

module.exports = postexclusive;