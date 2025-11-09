const month_list = require("./current_month")
const earningdb = require("../Creators/mainbalance")

let monthly_earning = async (userid)=>{

 let earning = await earningdb.find({userid : userid}).exec()
 
 //let earning = []
 let list_month = month_list()

 for(let i = 0; i < earning.length; i++){
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

                let total = income - spend

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