const {userdb} = require('../../Model/userdb');
const information = require('../../Model/usercomplete')
const {memko_socialDB,database} = require('../../config/connectDB');

const handleNewUser = async (req,res)=>{

    const interestedIn = req.body.interestedIn;
    const photoLink = req.body.photoLink;
    const relationshipType = req.body.relationshipType;
    const details = req.body.details;
    

    
    if(!interestedIn  && !relationshipType && !details ){
        return res.status(400).json({"ok":false,'message': 'Registeration not complete!!'})
    }


    try{
        const d = await database.getDocument(memko_socialDB,userdb,Query.equal('email',[`${email}`]))

        if(!photoLink){
            photoLink = ""
        }

        if(String(d.$id)){
            

           
            var moreuser ={
                useraccountId:`${d.$id}`,
                interestedIn,
                photoLink,
                relationshipType,
                details
            }

            await database.createDocument(memko_socialDB,information,sdk.ID.unique(),moreuser)
            return res.status(200).json({"ok":true,'message': `${d.$firstname}  ${d.$lastname} Account Created Success`})

        }else{
            return res.status(409).json({"ok":false,"message":`Authentication code mismatch`})
        }
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }

}

module.exports = handleNewUser;