let exclusivedb = require("../../Models/exclusivedb")
let exclusive_purshaseDB = require("../../Models/exclusivePurshase")
const postexclusive = async(req,res)=>{

    let userid = req.body.userid;
    let exclusiveid = req.body.exclusiveid;
    let price = req.body.price;
   
    
    

    if(!userid || !exclusiveid || !price){
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }

    let content_price = await exclusivedb.findOne({_id:exclusiveid}).exec()

    if(content_price){
       let price_enable = parseFloat(content_price.price)

       let myprice = parseFloat(price)
       if(myprice <= 0){
        return res.status(400).json({"ok":false,'message': 'price invalid!!'})
       }else if(myprice >= price_enable){
        let data = {
            userid,
            exclusiveid,
            price,
            paid:true
        }  

        await exclusive_purshaseDB.create(data)

        return res.status(200).json({"ok":true,'message': 'purshase successful!!'})

       }
       
    }else{
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }


    return res.status(200).json({"ok":true,'message': 'exclusive post successfully!!'})

}

module.exports = postexclusive;