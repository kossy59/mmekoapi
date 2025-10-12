const userdb = require("../../Creators/userdb")
const admindb = require("../../Creators/admindb");
const { pushActivityNotification } = require("../../utiils/sendPushnot");

const updatePost = async (req,res)=>{
    const data = req.body.data;
    const message = req.body.message

    if(!message){
        return res.status(400).json({"ok":false,'message': 'please input message!!'})
    }


    try{
               let userids = await userdb.find({}).exec()

               if(!data){
                return res.status(409).json({"ok":false,'message': 'add users!!'});
        
               }

               let verifyIDS = []

               userids.forEach(value =>{
                 data.forEach(value1 =>{
                    if(String(value._id) === String(value1)){
                        verifyIDS.push(value1)
                    }
                 })
               })

            

               for(let i = 0; i < verifyIDS.length; i++){
                let newdata = {
                    userid: verifyIDS[i],
                    message: message,
                    seen:true
                }

                await admindb.create(newdata)
                
                // Send push notification for activity
                await pushActivityNotification(verifyIDS[i], message, "admin_activity")
               }


           


            return res.status(200).json({"ok":true,"message":`message sent Successfully`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost