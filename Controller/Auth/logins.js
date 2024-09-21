// const {userdb} = require('../../Model/userdb');
// const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userdb = require("../../Models/userdb")

const handleNewUser = async (req,res)=>{

    const email = req.body.email;
    const password = req.body.password;
//    console.log('untop connecting to database')
//     let data = await connectdatabase()
    if(!email && !password){
        return res.status(400).json({"ok":false,'message': 'Email OR Password Empty'})
    }
    let Email = email.toLowerCase().trim()

    try{
        //console.log('untop getting  database')

      //  let mail = email.toLowerCase()

        let du = await userdb.findOne({email:Email}).exec()

    //      let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //     let du = dupplicate.documents.filter(value=>{
    //     return value.email === email
    //    })

      // console.log('untop checking  database email '+mail.toLowerCase())
        console.log('untop checking  database email1 '+du)
 
        if(du){
            
               
            if(du.emailconfirm !== "verify"){

                res.status(401).json({"ok":false,"message": "notverify"})
                await forgetHandler(req,res,email)
            }
            const match = await bcrypt.compare(password,du.password);

            if(match){
        
                const refreshToken = jwt.sign(
                    {
                        "UserInfo":{
                            "username":du.email
                        }
                    },
                    process.env.refreshToken,
                    {expiresIn : '1d'}
                );

                console.log('untop updating  database')
                // await data.databar.updateDocument(
                //     data.dataid,
                //     data.colid,
                //      du[0].$id,
                //      {
                //         refreshtoken:refreshToken
                //      }
                //  )
                 du.refreshtoken = refreshToken;
                 du.save()
        
                
            
        
                   res.status(200).json({"ok":true,"message": "Login Success","id":du._id,"token":refreshToken})
            }else{
                res.status(401).json({"ok":false,"message": "Password mismatch"})
            }
    
              
        
 
        }else{
            return res.status(400).json({"ok":false,'message': 'User Not Register'})
        }
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err}!`});
     }

}

module.exports = handleNewUser;