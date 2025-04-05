let Name_Months = [
   "January", "February", "March", "April", "May", "June",
     "July", "August", "September", "October", "November", "December",
]
let get_yearly_earning =  ()=>{
   

    let date = Date.now()

    let Month = {}

    let mut_date = new Date(Number(date))

    let now_date = new Date(date)

  
   for(let i = 0; i < 11; i++){

    if(i === 0){
        let current_month = new Date( mut_date.setMonth(mut_date.getMonth() - 0))
        let latest_month = Name_Months[current_month.getMonth()]
         let latest_year = current_month.getFullYear()
         let now_month = current_month.getMonth()

        Month[`${latest_month}`] = {
            earning : [],
            total: 0,
            year: latest_year,
            month : now_month
         };

    }
    let current_month = new Date( mut_date.setMonth(mut_date.getMonth() - 1))
     
    //  console.log("current date "+mut_date)

     let latest_month = Name_Months[current_month.getMonth()]
     let latest_year = current_month.getFullYear()
     let now_month = current_month.getMonth()

        Month[`${latest_month}`] = {
            earning : [],
            total: 0,
            year: latest_year,
            month : now_month
         };

     
   }

  return Month



}

module.exports = get_yearly_earning