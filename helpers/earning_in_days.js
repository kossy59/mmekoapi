let earningdb = require("../Creators/mainbalance")
let creatordb = require("../Creators/creators")
let userdb = require("../Creators/creators")

 let earning_history = async (creatorid)=>{

   // let user = await creatordb.findOne({_id : creatorid}).exec()

    let earning = await earningdb.find({userid : creatorid}).exec() 

    let first1 =  Date.now()

    let first = new Date(Number(first1))

    let first2 = new Date(Number(first1))
     
     

    let last = new Date( first2.setDate(first2.getDate() - 28 ) )
  
    let earning_count = 0;

    earning.forEach(value =>{

        
        if( new Date(value._id.getTimestamp()).getTime() <= first.getTime() && new Date(value._id.getTimestamp()).getTime() > last.getTime()  ){
            earning_count = earning_count + parseFloat(value.income)
        }
    })

    return earning_count * 0.05

}

module.exports = earning_history