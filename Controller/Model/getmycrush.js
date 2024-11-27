const crushdb = require("../../Models/crushdb")
const modeldb = require("../../Models/models")

const createModel = async (req,res)=>{

    const userid = req.body.userid;
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
     
     //let data = await connectdatabase()

    try{
      

           //let userdb = await data.databar.listDocuments(data.dataid,data.modelCol)
          
          //  let currentuser = userdb.documents.find(value=>{
          //   return value.$id === hostid
          //  })

           let currentuser = await crushdb.find({userid:userid}).exec()

          

           if(!currentuser){
            return res.status(200).json({"ok":true,"message":`successfully`,crushlist:[]})
           }

           let addlist = []

           for(let i = 0; i < currentuser.length; i++){
            let model = await modeldb.findOne({_id:currentuser[i].modelid})
            
            if(model){
              let mymodel = {
                photolink : model.photolink,
                name : model.name,
                id : model._id
            }

            addlist.push(mymodel)
            }

            
           }

            return res.status(200).json({"ok":true,"message":`successfully`,crushlist:addlist})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel