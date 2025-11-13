let earningdb = require("../Creators/mainbalance")
let creatordb = require("../Creators/creators")
let userdb = require("../Creators/creators")

 let earning_history = async (creator_portfolio_id)=>{

   // let user = await creatordb.findOne({_id : creator_portfolio_id}).exec()

    let earning = await earningdb.find({userid : creator_portfolio_id}).exec() 

    let first1 =  Date.now()

    let first = new Date(Number(first1))

    let first2 = new Date(Number(first1))
     
     

    let last = new Date( first2.setDate(first2.getDate() - 28 ) )
  
    // Helper function to check if transaction is an earnings transaction (not balance transaction)
    const isEarningsTransaction = (details) => {
      if (!details) return false;
      const detailsLower = details.toLowerCase();
      
      // Include earnings-related transactions
      const isEarnings = 
        details.includes("completed - payment received") ||
        details.includes("completed - payment transferred") ||
        details.includes("Fan call - payment received") ||
        details.includes("Fan call - payment for") ||
        details.includes("exclusive post sale") ||
        details.includes("exclusive post") ||
        details.includes("exclusive content sale") ||
        details.includes("exclusive content") ||
        details.includes("exclusive sale") ||
        detailsLower.includes("withdrawal") ||
        detailsLower.includes("withdraw") ||
        detailsLower.includes("earnings") ||
        details.includes("hosting service completed");
      
      // Exclude balance-related transactions
      const isBalance = 
        details.includes("refund") ||
        details.includes("expired") ||
        details.includes("cancelled") ||
        details.includes("declined") ||
        details.includes("balance") ||
        details.includes("purchase") ||
        details.includes("top up") ||
        details.includes("top-up") ||
        details.includes("deposit");
      
      return isEarnings && !isBalance;
    };

    let earning_count = 0;

    earning.forEach(value =>{
        // Only count earnings transactions, not balance transactions
        if (!isEarningsTransaction(value.details)) {
          return; // Skip balance transactions
        }
        
        if( new Date(value._id.getTimestamp()).getTime() <= first.getTime() && new Date(value._id.getTimestamp()).getTime() > last.getTime()  ){
            earning_count = earning_count + parseFloat(value.income || 0)
        }
    })

    return earning_count * 0.05

}

module.exports = earning_history