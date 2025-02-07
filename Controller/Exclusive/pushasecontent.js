let exclusivedb = require("../../Models/exclusivedb")
let exclusive_purshaseDB = require("../../Models/exclusivePurshase")
let userdb = require("../../Models/userdb")
let historydb = require("../../Models/mainbalance")
const postexclusive = async(req,res)=>{

    let userid = req.body.userid;
    let exclusiveid = req.body.exclusiveid;
    let price = req.body.price;
    let pricebalance = req.body.pricebalance
    let exclusivename = req.body.exclusivename
    let exclusivelink = req.body.exclusivelink

    console.log("userid "+userid)
    console.log("exclusiveid "+exclusiveid)
    console.log("price "+price)
    console.log("pricebalance "+pricebalance)
   
    
    

    if(!userid || !exclusiveid || !price){
        console.log("failed to buy")
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }

    let content_price = await exclusivedb.findOne({_id:exclusiveid}).exec()
    let userprice = await userdb.findOne({_id:userid}).exec()

    if(content_price && userprice){
        let alreadybuy = await exclusive_purshaseDB.find({exclusiveid:exclusiveid}).exec()
        let bought = alreadybuy.find(value=> value.userid === userid)
        if(bought){
            console.log("already buy")
            return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
        }
       let price_enable = parseFloat(content_price.price)

       let myprice = parseFloat(userprice.balance)
       if(myprice <= 0){
        return res.status(400).json({"ok":false,'message': 'price invalid!!'})
       }else if(myprice >= price_enable){
        let data = {
            userid,
            exclusiveid,
            price,
            paid:true,
            exclusivename,
            exclusivelink
        }  

        userprice.balance = `${pricebalance}`
        userprice.save()
        await exclusive_purshaseDB.create(data)

        let clienthistory = {
            userid:userid,
            details: `purchase content @${price} successful`,
            spent: `${price}`,
            income: "0",
            date: `${Date.now().toString()}`
         }

        await historydb.create(clienthistory)

        console.log("buy completed")

        return res.status(200).json({"ok":true,'message': 'purshase successful!!'})

       }
       
    }else{
        console.log("no content price")
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }



}

module.exports = postexclusive;