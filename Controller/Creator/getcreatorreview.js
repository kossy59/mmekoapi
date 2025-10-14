const reviewdb = require("../../Creators/review")
const userdb = require("../../Creators/userdb")
const userphotodb = require("../../Creators/usercomplete")

const createLike = async (req,res)=>{

    const creator_portfolio_id = req.body.creator_portfolio_id

    if( !creator_portfolio_id){
        return res.status(400).json({"ok":false,'message': 'please provide user and creator ID!!'})
    }
    console.log('🔍 [GETREVIEWS] Looking for reviews with creator_portfolio_id:', creator_portfolio_id)

    try{
         // Debug: Check all ratings in database
         let allRatings = await reviewdb.find({}).exec()
         console.log('🔍 [GETREVIEWS] All ratings in database:', allRatings.map(r => ({ 
           creatorId: r.creatorId, 
           fanName: r.fanName, 
           rating: r.rating,
           bookingId: r.bookingId,
           hostType: r.hostType
         })))
         
         // Fetch 5-star ratings from request cards for this creator
         let ratings = await reviewdb.find({creatorId: creator_portfolio_id}).sort({createdAt: -1}).exec()
         console.log('🔍 [GETREVIEWS] Found ratings for creator:', ratings.length)
         console.log('🔍 [GETREVIEWS] Creator portfolio ID being searched:', creator_portfolio_id)
         console.log('🔍 [GETREVIEWS] Ratings found:', ratings.map(r => ({
           creatorId: r.creatorId,
           fanName: r.fanName,
           rating: r.rating,
           feedback: r.feedback,
           bookingId: r.bookingId
         })))

         if(!ratings[0]){
              return res.status(200).json({"ok":true,"message":` Success`, reviews:[]})

         }

        let reviews = []

        for(let i = 0; i < ratings.length; i++){
            // Get fan details (fallback if not stored in rating)
            let fan = await userdb.findOne({_id: ratings[i].fanId}).exec()
            let image = await userphotodb.findOne({useraccountId: ratings[i].fanId}).exec()

            reviews.push({
                content : ratings[i].feedback,
                posttime : ratings[i].createdAt.getTime().toString(),
                userid : ratings[i].fanId,
                id : ratings[i]._id,
                name : ratings[i].fanName || (fan ? fan.firstname : "Unknown"),
                photolink : ratings[i].fanPhoto || (image ? image.photoLink : ""),
                rating : ratings[i].rating,
                hostType : ratings[i].hostType,
                bookingId : ratings[i].bookingId
            })
        }

            return res.status(200).json({"ok":true,"message":` Success`, reviews:reviews})


       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike
