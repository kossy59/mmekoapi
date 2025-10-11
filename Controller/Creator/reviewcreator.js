const reviewdb = require("../../Creators/review")

const createLike = async (req,res)=>{
    
    const userid = req.body.userid
    const creator_portfoliio_Id = req.body.creator_portfoliio_Id
    const content = req.body.content
    
    
   
    if(!userid && !creator_portfoliio_Id){
        return res.status(400).json({"ok":false,'message': 'please provide user and creator ID!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         let review = {
            userid,
            content,
            creator_portfoliio_Id,
            posttime : `${Date.now().toString()}`
         }

         let id = await reviewdb.create(review)
            return res.status(200).json({"ok":true,"message":` Success`, id:id._id})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike