const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createModel = async (req,res)=>{
   
    let data = await connectdatabase()

    try{
      
           let userdb = await data.databar.listDocuments(data.dataid,data.modelCol)
           let currentuser = userdb.documents.filter(value=>{
            return value.verify === "live"
           })

            let useronline = await data.databar.listDocuments(data.dataid,data.colid)
          

           if(!currentuser[0]){
            return res.status(200).json({"ok":false,"message":`user host empty`,host:[]})
           }

          

          let host = []

          for(let i = 0; i < useronline.documents.length; i++){
            for(let j = 0; j < currentuser.length; j++){
                if(currentuser[j].userid === useronline.documents[i].$id){

                 listofhost = {

                 hostid: currentuser[j].$id,
                 photolink: currentuser[j].photolink,
                 verify: currentuser[j].verify,
                 name : currentuser[j].name,
                 age : currentuser[j].age,
                 location : currentuser[j].location,
                 price : currentuser[j].price,
                 duration : currentuser[j].duration,
                 bodytype :  currentuser[j].bodytype,
                 smoke: currentuser[j].smoke,
                 drink : currentuser[j].drink,
                 interestedin : currentuser[j].interestedin,
                 height : currentuser[j].height,
                 weight : currentuser[j].weight,
                 description : currentuser[j].description,
                 gender:currentuser[j].gender,
                 timeava:currentuser[j].timeava,
                 daysava : currentuser[j].daysava,
                 hosttype : currentuser[j].hosttype,
                 online:useronline.documents[i].active,
                 userid:currentuser[j].userid,
                 amount:currentuser[j].price

                 }

                 host.push(listofhost)

                }
            }
          }
            

          

         return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,host})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel