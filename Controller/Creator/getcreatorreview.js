const reviewdb = require("../../Creators/review")
const userdb = require("../../Creators/userdb")
const userphotodb = require("../../Creators/usercomplete")

const createLike = async (req,res)=>{

    const creator_portfolio_id = req.body.creator_portfolio_id

    if( !creator_portfolio_id){
        return res.status(400).json({"ok":false,'message': 'please provide user and creator ID!!'})
    }
    console.log('untop init db')

    //let data = await connectdatabase()

    try{

         let review = await reviewdb.find({creator_portfolio_id:creator_portfolio_id}).exec()

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
