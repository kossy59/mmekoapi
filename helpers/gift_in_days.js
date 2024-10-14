let giftdb = require("../Models/gift")

  let gift_history = async (modelid)=>{


    let gift = await giftdb.find({modelid : modelid}).exec() 

    let first1 = Date.now()

    let first = new Date(Number(first1))

    let first2 = new Date(Number(first1))


    let last = new Date( first2.setDate(first2.getDate() - 28 ) )

    let gift_count = 0;

    gift.forEach(value =>{

        if( new Date(parseInt(value._id.getTimestamp())) <= first && new Date(parseInt(value._id.getTimestamp())) > last  ){
            gift_count++
        }
        
    })

    return gift_count

}

module.exports = gift_history