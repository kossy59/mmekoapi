const userdb = require("../../Models/userdb")
const historydb = require("../../Models/mainbalance")

const createLike = async (req,res)=>{
    
    const userid = req.body.userid
    
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         const users = await userdb.findOne({_id:userid}).exec()
         const history = await historydb.find({userid:userid})

          //console.log('under user pending')
         

         if(!users) {
             return res.status(409).json({"ok":false,'message': 'user not found!!'})
         }

         let accwitdraw = parseFloat(users.withdrawbalance);
         if(!accwitdraw){
            accwitdraw = 0
         }

         let spendbal = parseFloat(users.balance)
          if(!spendbal){
            spendbal = 0
         }
          let mystats = {
            Witdrawable : `${accwitdraw}`,
            Spendable : `${spendbal}`,
            historylist : []
          }

          if(!history[0]){
             return res.status(200).json({"ok":false,'message': 'Success!!', historystat : mystats})
          }
       
          history.forEach(value =>{
            mystats.historylist.push(value)
          })
            return res.status(200).json({"ok":true,"message":` Success`,historystat : mystats})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike