let giftdb = require("../Creators/gift")

  let gift_history = async (creatorid)=>{


    let gift = await giftdb.find({creatorid : creatorid}).exec() 

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