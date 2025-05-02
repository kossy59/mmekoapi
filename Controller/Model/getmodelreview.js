const reviewdb = require("../../Models/review")
const userdb = require("../../Models/userdb")
const userphotodb = require("../../Models/usercomplete")

const createLike = async (req,res)=>{

    const modelid = req.body.modelid

    if( !modelid){
        return res.status(400).json({"ok":false,'message': 'please provide user and model ID!!'})
    }
    console.log('untop init db')

    //let data = await connectdatabase()

    try{

         let review = await reviewdb.find({modelid:modelid}).exec()

         if(!review[0]){
              return res.status(200).json({"ok":true,"message":` Success`, reviews:[]})

         }

        let reviews = []

        for(let i = 0; i < review.length; i++){
            let username = await userdb.findOne({_id:review[i].userid}).exec()
            let image = await userphotodb.findOne({useraccountId:review[i].userid}).exec()

            reviews.push({
                content : review[i].content,
                posttime : review[i].posttime,
                userid : review[i].userid,
                id : review[i]._id,
                name : username.firstname,
                photolink : image.photoLink

            })


        }

            return res.status(200).json({"ok":true,"message":` Success`, reviews:reviews})


       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike
