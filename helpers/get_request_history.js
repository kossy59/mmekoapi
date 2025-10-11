let bookdb = require("../Creators/book")

 let request_history = async (creator_portfolio_id, userid)=>{

    // Get requests where user is creator (receiving requests) - only if creator_portfolio_id exists
    let creatorRequests = [];
    if (creator_portfolio_id) {
      creatorRequests = await bookdb.find({creator_portfolio_id:creator_portfolio_id}).exec();
    }
    
    // Get requests where user is fan (making requests)
    let fanRequests = await bookdb.find({userid:userid}).exec()

    //from today
   
    let first1 = Date.now()

  
    let first = new Date(Number(first1))

    
    let first2 = new Date(Number(first1))

    

   
    //back to 28 days ago
    let last = new Date( first2.setDate(first2.getDate() - 28 ) )
    

    let request_count = 0;

   // console.log("request list "+request)

    // Count creator requests
    creatorRequests.forEach(value =>{

       
        if( new Date(value._id.getTimestamp()).getTime() <= first.getTime() && new Date(value._id.getTimestamp()).getTime() > last.getTime()  ){
            request_count = request_count + 1
        }
    })
    
    // Count fan requests
    let fanRequestCount = 0;
    fanRequests.forEach(value =>{

       
        if( new Date(value._id.getTimestamp()).getTime() <= first.getTime() && new Date(value._id.getTimestamp()).getTime() > last.getTime()  ){
            fanRequestCount = fanRequestCount + 1
        }
    })
    
    request_count = request_count + fanRequestCount;

    return request_count

}

module.exports = request_history