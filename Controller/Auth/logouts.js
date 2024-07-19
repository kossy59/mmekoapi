const {userdb} = require('../../Model/userdb');
const {memko_socialDB,database} = require('../../config/connectDB');

const handleNewUser = async (req,res)=>{

    const email = req.body.email;

    if(!email){
        return res.status(400).json({"ok":false,'message': 'Email Empty'})
    }

    try{
        let  dupplicate = await database.getDocument(memko_socialDB,userdb,Query.equal('email',[`${email}`]))
 
        if(String(dupplicate.$email)){
            
            
            if(match){
        
               
                await database.updateDocument(
                    memko_socialDB,
                    userdb,
                    String(dupplicate.$id),
                    {
                        refreshtoken : ""
                    }
                )
        
        
                   res.status(200).json({"ok":true,"message": "Logout Success","token":refreshToken})
            }else{
                res.status(401).json({"ok":false,"message": "User Already Logged Out"})
            }
    
              
        
 
        }else{
            return res.status(400).json({"ok":false,'message': 'User Already Logged Out'})
        }
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err.message}!`});
     }

}

module.exports = handleNewUser;