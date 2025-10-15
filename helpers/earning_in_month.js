const month_list = require("./current_month")
const earningdb = require("../Creators/mainbalance")

let monthly_earning = async (userid)=>{

    console.log("🔍 [DEBUG] Fetching earnings for userid:", userid)
    console.log("🔍 [DEBUG] Query filter:", { userid: userid })
    
 let earning = await earningdb.find({userid : userid}).exec()
 
 console.log("📊 [DEBUG] Total fan request transactions found:", earning.length)
 if (earning.length > 0) {
     console.log("📋 [DEBUG] Sample fan request transaction structure:", {
         id: earning[0]._id,
         userid: earning[0].userid,
         details: earning[0].details,
         income: earning[0].income,
         spent: earning[0].spent,
         date: earning[0].date,
         createdAt: earning[0].createdAt
     })
 } else {
     console.log("⚠️ [DEBUG] No fan request transactions found for this user!")
 }

 //let earning = []
 let list_month = month_list()
 console.log("📅 [DEBUG] Fan request month list structure:", JSON.stringify(list_month, null, 2))

 for(let i = 0; i < earning.length; i++){
    console.log(`\n🔄 [DEBUG] Processing transaction ${i + 1}/${earning.length}`)
    console.log("📄 [DEBUG] Fan request transaction details:", {
        id: earning[i]._id,
        userid: earning[i].userid,
        details: earning[i].details,
        income: earning[i].income,
        spent: earning[i].spent,
        date: earning[i].date
    })

    let earning_date = new Date(earning[i]._id.getTimestamp())
        console.log("📅 [DEBUG] Fan request transaction date:", earning_date)

    let month = earning_date.getMonth()
    let year = earning_date.getFullYear()
    console.log("📊 [DEBUG] Extracted fan request month:", month, "year:", year)

    for(let values in list_month){
        console.log(`🔍 [DEBUG] Checking fan request month ${values}:`, {
            month: list_month[values].month,
            year: list_month[values].year,
            matches: list_month[values].month === month && list_month[values].year === year
        })
        
        if( list_month[values].month === month && list_month[values].year === year ){
            console.log("✅ [DEBUG] Fan request month match found! Processing transaction...")

            if(list_month[values].earning.length === 0){
                console.log("🆕 [DEBUG] First fan request transaction for this month")
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

                let total = income - spend
                console.log("💰 [DEBUG] Fan request transaction amounts:", { income, spend, total })

                list_month[values].earning.push(prices)
                list_month[values].total = total;
                console.log("📊 [DEBUG] Fan request month total updated to:", total)


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

                let total = income - spend

               

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
    console.log(`\n📊 [DEBUG] Processing fan request month ${index}:`, list_month[index])
    
    // Check if there are fan request transactions (any host type)
    let hasFanRequestTransactions = list_month[index].earning.some(earning => 
        earning.detail && earning.detail.includes("completed - payment received")
    );
    
    console.log("🎯 [DEBUG] Has fan request transactions:", hasFanRequestTransactions)
    console.log("🎯 [DEBUG] Has fan request transactions:", hasFanRequestTransactions)
    console.log("🎯 [DEBUG] Has fan request transactions:", hasFanRequestTransactions)

    // For fan request transactions, don't convert to USD (show gold amount)
    // For other transactions, apply the 0.05 conversion
    let totalAmount = parseFloat(list_month[index].total);
    let displayTotal = hasFanRequestTransactions ? totalAmount : totalAmount * 0.05;
    
    console.log("💰 [DEBUG] Total amount:", totalAmount, "Display total:", displayTotal)
    
    let data = {
        month :index,
        data :list_month[index],
        total: `${displayTotal}`,
        isFanRequest: hasFanRequestTransactions
    }

    console.log("📋 [DEBUG] Final month data:", data)
    month_List.push(data)
 }



 console.log("\n🎉 [DEBUG] Final fan request earnings data being returned:")
 console.log("📊 [DEBUG] Total months processed:", month_List.length)
 console.log("📋 [DEBUG] Complete month list:", JSON.stringify(month_List, null, 2))
 
 return month_List

}

module.exports = monthly_earning