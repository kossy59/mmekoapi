const crushdb = require("../../Creators/crushdb")
const creatordb = require("../../Creators/creators")

const createCreator = async (req,res)=>{

    const userid = req.body.userid;
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
     
     //let data = await connectdatabase()

    try{
      

           //let userdb = await data.databar.listDocuments(data.dataid,data.creatorCol)
          
          //  let currentuser = userdb.documents.find(value=>{
          //   return value.$id === hostid
          //  })

           let currentuser = await crushdb.find({userid:userid}).exec()

          

           if(!currentuser){
            return res.status(200).json({"ok":true,"message":`successfully`,crushlist:[]})
           }

           let addlist = []

           for(let i = 0; i < currentuser.length; i++){
            let creator = await creatordb.findOne({_id:currentuser[i].creator_portfoliio_Id})
            
            if(creator){
              let mycreator = {
                photolink : creator.photolink,
                name : creator.name,
                id : creator._id
            }

            addlist.push(mycreator)
            }

            
           }

            return res.status(200).json({"ok":true,"message":`successfully`,crushlist:addlist})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createCreator