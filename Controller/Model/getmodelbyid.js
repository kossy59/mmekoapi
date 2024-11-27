// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const models = require("../../Models/models")
let crushdb = require("../../Models/crushdb")
const createModel = async (req,res)=>{

    const hostid = req.body.hostid;
    const userid = req.body.userid
    let added = false
   
   
    if(!hostid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    //let data = await connectdatabase()

    try{
      
          //  let userdb = data.databar.listDocuments(data.dataid,data.modelCol)
          //  let currentuser = (await userdb).documents.find(value=>{
          //   return value.$id === hostid
          //  })

           let currentuser = await models.findOne({_id:hostid}).exec()

           let istrue = await crushdb.findOne({userid:userid}).exec()

           if(istrue){
            added = true
           }

           if(!currentuser){
            return res.status(409).json({"ok":false,"message":`user host empty`})
           }


            let host =  {
                 hostid: currentuser._id,
                 photolink: currentuser.photolink,
                 verify: currentuser.verify,
                 name : currentuser.name,
                 age : currentuser.age,
                 location : currentuser.location,
                 price : currentuser.price,
                 duration : currentuser.duration,
                 bodytype : currentuser.bodytype,
                 smoke: currentuser.smoke,
                 drink : currentuser.drink,
                 interestedin : currentuser.interestedin,
                 height : currentuser.height,
                 weight : currentuser.weight,
                 description : currentuser.description,
                 gender:currentuser.gender,
                 timeava:currentuser.timeava,
                 daysava : currentuser.daysava,
                 hosttype : currentuser.hosttype,
                 userid: currentuser.userid,
                 document:currentuser.document,
                 add : added

              }
        


            return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,host})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel