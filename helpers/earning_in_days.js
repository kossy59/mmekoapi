let earningdb = require("../Models/mainbalance")
let modeldb = require("../Models/models")

 let earning_history = async (modelid)=>{

    let user = await modeldb.findOne({_id : modelid}).exec()

    let earning = await earningdb.find({userid : user.userid}).exec() 

    let first1 =  Date.now()

    let first = new Date(Number(first1))

    let first2 = new Date(Number(first1))
     
     

    let last = new Date( first2.setDate(first2.getDate() - 28 ) )
    console.log("first "+first.getTime())
     console.log("last "+last.getTime())
    
    let earning_count = 0;

    earning.forEach(value =>{

        console.log("incomes date "+new Date(value._id.getTimestamp()).getTime())
        
        if( new Date(value._id.getTimestamp()).getTime() <= first.getTime() && new Date(value._id.getTimestamp()).getTime() > last.getTime()  ){
            earning_count = earning_count + parseFloat(value.income)
        }
    })

    return earning_count * 0.05

}

module.exports = earning_history