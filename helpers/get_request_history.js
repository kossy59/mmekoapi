let bookdb = require("../Models/book")

 let request_history = async (modelid)=>{

  

    let request = await bookdb.find({modelid:modelid}).exec() 

  

    //from today
   
    let first1 = Date.now()

  
    let first = new Date(Number(first1))

    
    let first2 = new Date(Number(first1))

    

   
    //back to 28 days ago
    let last = new Date( first2.setDate(first2.getDate() - 28 ) )
    

    let request_count = 0;

   // console.log("request list "+request)

    request.forEach(value =>{

       
        if( new Date(value._id.getTimestamp()).getTime() <= first.getTime() && new Date(value._id.getTimestamp()).getTime() > last.getTime()  ){
            request_count = request_count + 1
        }
    })

    return request_count

}

module.exports = request_history