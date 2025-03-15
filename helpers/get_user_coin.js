const userdb = require("../Models/userdb")

 let getcoin = async (userid)=>{
   let user = await userdb.findOne({_id:userid}).exec()
   
   if(!user){
    return undefined
   }

   let coin = parseFloat( user.withdrawbalance)

   console.log("your withdraw coin is "+user.withdrawbalance)

   if(!coin || coin === 0){
     coin = 0
   }

   return coin

}

module.exports = getcoin