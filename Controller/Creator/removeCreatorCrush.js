const crushdb = require("../../Creators/crushdb")

const createCreator = async (req,res)=>{

    const creator_portfolio_id = req.body.creator_portfolio_id;
    const userid = req.body.userid;
   
   
    if(!creator_portfolio_id && !userid){
        return res.status(400).json({"ok":false,'message': 'user Id Or Creator Id invalid!!'})
    }
     
    //let data = await connectdatabase()

    try{
      

           //let userdb = await data.databar.listDocuments(data.dataid,data.creatorCol)
          
          //  let currentuser = userdb.documents.find(value=>{
          //   return value.$id === hostid
          //  })

           let currentuser = await crushdb.findOne({creator_portfolio_id:creator_portfolio_id}).exec()

           if(!currentuser){
            return res.status(409).json({"ok":false,"message":`creator crush not found`})
           }

          if(String(currentuser.userid) === String(userid)){
             await crushdb.deleteOne({_id:currentuser._id}).exec()
             return res.status(200).json({"ok":true,"message":`creator crush delete successfully`})
          }

            return res.status(409).json({"ok":false,"message":`Creator not found`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createCreator