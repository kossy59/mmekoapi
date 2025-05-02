const reviewdb = require("../../Models/review")

const createLike = async (req,res)=>{
    const id = req.body.id

    if(!id){
        return res.status(400).json({"ok":false,'message': 'please provide review ID!!'})
    }

    console.log('untop init db')

    //let data = await connectdatabase()
    try{
        let review = await reviewdb.findOne({_id:id}).exec()

        if(!review){
             return res.status(400).json({"ok":false,"message":` invalid review ID`})
        }

        await reviewdb.deleteOne({_id:id}).exec()

        return res.status(200).json({"ok":true,"message":` Success`, id})


       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike
