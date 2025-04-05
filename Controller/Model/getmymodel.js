// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const models = require("../../Models/models")

const createModel = async (req,res)=>{

    const userid = req.body.userid;
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

   // let data = await connectdatabase()

    try{
      
          //  let userdb = data.databar.listDocuments(data.dataid,data.modelCol)
          //  let currentuser = (await userdb).documents.filter(value=>{
          //   return value.userid === userid
          //  })

          let currentuser = await models.findOne({userid:userid}).exec()

           if(!currentuser){
            return res.status(200).json({"ok":false,"message":`user host empty`,host:[]})
           }

          
              
            
           let myhost =
               {
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
                 document: currentuser.document

              }

              let host = [myhost]
          


            return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,host})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel