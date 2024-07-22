const {userdb} = require('../../Model/userdb');
const information = require('../../Model/usercomplete')
const {connectdatabase} = require('../../config/connectDB');
var sdk = require("node-appwrite");


const handleNewUser = async (req,res)=>{

    const interestedIn = req.body.interestedIn;
    let photoLink = req.body.photoLink;
    const relationshipType = req.body.relationshipType;
    const details = req.body.details;
    const useraccountId = req.body.useraccountId;
    
    let data = await connectdatabase()
    
    if(!interestedIn  && !relationshipType && !details && !useraccountId){
        return res.status(400).json({"ok":false,'message': 'Registeration not complete!!'})
    }

    let imglink;

    try{
        const d = await data.databar.listDocuments(data.dataid,data.userincol)

        let du = d.documents.filter(value=>{
            return value.useraccountId === useraccountId
           })

           
        
           if(du[0]){
            return res.status(409).json({"ok":false,'message': 'User Already Register!!'});
    
           }

        if(!photoLink){
            photoLink = ""
        }

     
            var moreuser ={
                useraccountId,
                interestedIn,
                photoLink:`${imglink}`,
                relationshipType,
                details
            }

            await data.databar.createDocument(data.dataid,data.userincol,sdk.ID.unique(),moreuser)
            return res.status(200).json({"ok":true,'message': `Account Created Successful`})

      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }

}

module.exports = handleNewUser;