const userdb = require("../../Models/userdb")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const amount = req.body.amount
    console.log("amount "+amount)
    console.log("userid "+userid)


    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


  
    try{


              console.log("amount "+amount)

               let du = await userdb.findOne({_id:userid}).exec()
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

               let Balance = parseFloat(du.balance);

               if(!Balance || Balance <= 0){
                Balance = 0
               }

               let total_amount = parseFloat(Balance) + parseFloat(amount)

               du.balance = `${total_amount}`
           
               du.save()

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost