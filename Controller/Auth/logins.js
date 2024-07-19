const {userdb} = require('../../Model/userdb');
const {memko_socialDB,database} = require('../../config/connectDB');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleNewUser = async (req,res)=>{

    const email = req.body.email;
    const password = req.body.password;

    if(!email && !password){
        return res.status(400).json({"ok":false,'message': 'Email OR Password Empty'})
    }

    try{
        let  dupplicate = await database.getDocument(memko_socialDB,userdb,Query.equal('email',[`${email}`]))
 
        if(String(dupplicate.$email)){
            
               

            const match = bcrypt.compare(password,dupplicate.$password);

            if(match){
        
                const refreshToken = jwt.sign(
                    {
                        "UserInfo":{
                            "username":foundUser.email
                        }
                    },
                    process.env.refreshToken,
                    {expiresIn : '1d'}
                );

                await database.updateDocument(
                    memko_socialDB,
                    userdb,
                    String(dupplicate.$id),
                    {
                        refreshtoken : refreshToken
                    }
                )
        
                
                //     registerUsers.splice(index,1)
                
        
                // registerUsers.push(foundUser);
        
                // await fs.writeFile(
                //     path.join(__dirname,'..','model','userRegister.json'),
                //     JSON.stringify(registerUsers)
                //    );
        
                  // res.cookie("jwt",refreshToken,{ httpOnly: true, secure: true ,sameSite:'None',maxAge:24*60*60*1000 });
        
                   res.status(200).json({"ok":true,"message": "Login Success","id":dupplicate.$id,"token":refreshToken})
            }else{
                res.status(401).json({"ok":false,"message": "Password mismatch"})
            }
    
              
        
 
        }else{
            return res.status(400).json({"ok":false,'message': 'User Not Register'})
        }
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err.message}!`});
     }

}

module.exports = handleNewUser;