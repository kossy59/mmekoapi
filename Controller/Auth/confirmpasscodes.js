const {userdb} = require('../../Model/userdb');
const {memko_socialDB,database} = require('../../config/connectDB');
const { Query } = require('node-appwrite');
const sdk = require("node-appwrite");

const comfarm = async (req,res)=>{

    const code = req.body.code;
    let match = undefined;

    if(!code){
        return res.status(400).json({"ok":false,'message': 'Please enter authentication code!!'})
    }

    try{
        const d = await database.getDocument(memko_socialDB,userdb,Query.equal('emailconfirm',[`${code}`]))

        if(d){
            match = String(d.$id);

            await database.updateDocument(
                memko_socialDB,
                userdb,
                match,
                {
                    passcode:`${code}`
                }
            )


            return res.status(200).json({"ok":true,"message":`Authentication Code sent To your Email`})

        }else{
            return res.status(409).json({"ok":false,"message":`Authentication code mismatch`})
        }
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = comfarm