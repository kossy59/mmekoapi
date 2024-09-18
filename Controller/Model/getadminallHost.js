// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Models/userdb")
const models = require("../../Models/models")

const createModel = async (req,res)=>{

    const userid = req.body.userid;
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    //let data = await connectdatabase()

    try{
      
          //  let userdb = await data.databar.listDocuments(data.dataid,data.colid)
          //  let uvHost = await data.databar.listDocuments(data.dataid,data.modelCol)
          //  let currentuser = userdb.documents.find(value=>{
          //   return value.$id === userid
          //  })

          //  let hostlist =  uvHost.documents.filter(value =>{
          //    return value.verify === "notlive"
          //  })

           let currentuser = await userdb.findOne({_id:userid}).exec()
           let hostlist = await models.find({verify:"notlive"}).exec()

           

           if(!currentuser){
            return res.status(401).json({"ok":false,"message":`No unvrified Host`,})
           }
           

       
          let hosts = []
            hostlist.forEach(value =>{
                let host ={
                    hostid: value._id,
                    userid: value.userid,
                    ids: value.document,
                    hostname: value.name
                }

                hosts.push(host)
            })

           
            return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,hosts})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel