const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createModel = async (req,res)=>{

    const userid = req.body.userid;
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    let data = await connectdatabase()

    try{
      
           let userdb = data.databar.listDocuments(data.dataid,data.modelCol)
           let currentuser = (await userdb).documents.filter(value=>{
            return value.userid === userid
           })

           if(!currentuser[0]){
            return res.status(200).json({"ok":false,"message":`user host empty`,host:[]})
           }

          

          let host = []
            

            host = currentuser.map(value=>{
              return {
                 hostid: value.$id,
                 photolink: value.photolink,
                 verify: value.verify,
                 name : value.name,
                 age : value.age,
                 location : value.location,
                 price : value.price,
                 duration : value.duration,
                 bodytype : value.bodytype,
                 smoke: value.smoke,
                 drink : value.drink,
                 interestedin : value.interestedin,
                 height : value.height,
                 weight : value.weight,
                 description : value.description,
                 gender:value.gender,
                 timeava:value.timeava,
                 daysava : value.daysava,
                 hosttype : value.hosttype

              }
            })


            return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,host})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel