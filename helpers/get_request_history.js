let bookdb = require("../Models/book")

 let request_history = async (modelid)=>{

    console.log("request list")

    let request = await bookdb.find({modelid:modelid}).exec() 

    console.log("request list "+request)

    //from today
    console.log("request date now")
    let first1 = Date.now()

    console.log("request first date")
    let first = new Date(Number(first1))

    console.log("request second date")
    let first2 = new Date(Number(first1))

    

    console.log("request list "+request)
    //back to 28 days ago
    let last = new Date( first2.setDate(first2.getDate() - 28 ) )
    console.log("date first "+first)
     console.log("date first "+last)

    let request_count = 0;

   // console.log("request list "+request)

    request.forEach(value =>{

        console.log("date reqeust "+new Date(value._id.getTimestamp()))
        if( new Date(value._id.getTimestamp()).getTime() <= first.getTime() && new Date(value._id.getTimestamp()).getTime() > last.getTime()  ){
            request_count = request_count + 1
        }
    })

    return request_count

}

module.exports = request_history