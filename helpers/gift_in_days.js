let giftdb = require("../Creators/gift")

  let gift_history = async (creator_portfolio_id)=>{


    let gift = await giftdb.find({creator_portfolio_id : creator_portfolio_id}).exec() 

    let first1 = Date.now()

    let first = new Date(Number(first1))

    let first2 = new Date(Number(first1))


    let last = new Date( first2.setDate(first2.getDate() - 28 ) )

    let gift_count = 0;

    gift.forEach(value =>{

        if( new Date(value._id.getTimestamp()).getTime() <= first && new Date(value._id.getTimestamp()).getTime() > last  ){
            gift_count++
        }
        
    })

    return gift_count

}

module.exports = gift_history