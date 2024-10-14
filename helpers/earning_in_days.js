let earningdb = require("../Models/mainbalance")
let modeldb = require("../Models/models")

 let earning_history = async (modelid)=>{

    let user = await modeldb.findOne({_id : modelid}).exec()

    let earning = await earningdb.find({userid : user.userid}).exec() 

    let first1 =  Date.now()

    let first = new Date(Number(first1))

    let first2 = new Date(Number(first1))
     
     

    let last = new Date( first2.setDate(first2.getDate() - 28 ) )
    
    let earning_count = 0;

    earning.forEach(value =>{
        
        if( new Date(parseInt(value._id.getTimestamp())).getTime() <= first.getTime() && new Date(parseInt(value._id.getTimestamp())).getTime() > last.getTime()  ){
            earning_count = earning_count + parseFloat(value.income)
        }
    })

    return earning_count * 0.05

}

module.exports = earning_history