const reviewdb = require("../../Models/review")

const createLike = async (req,res)=>{
    
    const userid = req.body.userid
    const modelid = req.body.modelid
    const content = req.body.content
    
    
   
    if(!userid && !modelid){
        return res.status(400).json({"ok":false,'message': 'please provide user and model ID!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         let review = {
            userid,
            content,
            modelid,
            posttime : `${Date.now().toString()}`
         }

         let id = await reviewdb.create(review)
            return res.status(200).json({"ok":true,"message":` Success`, id:id._id})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike