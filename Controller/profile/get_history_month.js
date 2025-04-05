const gethistory = require("../../helpers/earning_in_month")

const Monthly_history = async (req,res)=>{

    const userid = req.body.userid;
   
    console.log('inside monthly history')

    if(!userid){
        return res.status(409).json({"ok":false,"message":`Invalid user ID`,})
    }

    try{

        let Month = await gethistory(userid)

          
            return res.status(200).json({"ok":true,"message":`All Post`,Month})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = Monthly_history