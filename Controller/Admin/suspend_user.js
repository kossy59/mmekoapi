const userdb = require("../../Models/userdb")
const admin = require("../../Models/admindb")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const end_date = req.body.end_date;




    console.log("end date "+end_date)


    if(!userid && !end_date){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    try{


               let du = await userdb.findOne({_id:userid}).exec()
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not access this info!!'});
        
               }

                let data = {
                    userid : userid,
                    email : du.email,
                    suspend:true,
                    end_date : end_date
                }

                await admin.create(data)



            return res.status(200).json({"ok":true,"message":`account suspeded Successfully`,profile:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost