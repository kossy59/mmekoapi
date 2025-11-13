const month_list = require("./current_month")
const earningdb = require("../Creators/mainbalance")

let monthly_earning = async (userid)=>{

 let earning = await earningdb.find({userid : userid}).exec()
 
 //let earning = []
 let list_month = month_list()

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

 for(let i = 0; i < earning.length; i++){
    // Skip balance transactions - only include earnings transactions
    if (!isEarningsTransaction(earning[i].details)) {
      continue;
    }
    
    let earning_date = new Date(earning[i]._id.getTimestamp())

    let month = earning_date.getMonth()
    let year = earning_date.getFullYear()

    for(let values in list_month){
        if( list_month[values].month === month && list_month[values].year === year ){

            if(list_month[values].earning.length === 0){
                let prices = {
                    income : earning[i].income,
                    spend : earning[i].spent,
                    date : earning[i].date,
                    userid : earning[i].userid,
                    detail : earning[i].details,
                    id : earning[i]._id

                }

                let income = parseFloat(earning[i].income)
                let spend = parseFloat(earning[i].spent)

                // Only count income as earnings (money received), not spent
                let total = income

                list_month[values].earning.push(prices)
                list_month[values].total = total;


            }else{

                  let prices = {
                    income : earning[i].income,
                    spend : earning[i].spent,
                    date : earning[i].date,
                    userid : earning[i].userid,
                    detail : earning[i].details,
                    id : earning[i]._id

                }

                let income = parseFloat(earning[i].income)
                let spend = parseFloat(earning[i].spent)

                // Only count income as earnings (money received), not spent
                let total = income

               

                let old_total = parseFloat(list_month[values].total)

                total = total + old_total

                list_month[values].earning.push(prices)
                list_month[values].total = total;
            }

        }
    }
 }

 let month_List = []

 for(let index in list_month){
    // Check if there are fan request transactions (any host type)
    let hasFanRequestTransactions = list_month[index].earning.some(earning => 
        earning.detail && earning.detail.includes("completed - payment received")
    );

    // For fan request transactions, don't convert to USD (show gold amount)
    // For other transactions, apply the 0.05 conversion
    let totalAmount = parseFloat(list_month[index].total);
    let displayTotal = hasFanRequestTransactions ? totalAmount : totalAmount * 0.05;
    
    let data = {
        month :index,
        data :list_month[index],
        total: `${displayTotal}`,
        isFanRequest: hasFanRequestTransactions
    }

    month_List.push(data)
 }

 return month_List

}

module.exports = monthly_earning