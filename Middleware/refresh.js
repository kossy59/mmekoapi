const jwt = require('jsonwebtoken');
const {connectdatabase} = require('../config/connectDB');

const handleRefresh = async (req,res,next)=>{
    let token  =  ''

    token = req.body.token
    let data = await connectdatabase()

    if(!token){
        return res.status(401).json({"message":`token not found!!!`})
    }
    const refreshToken = token.toString();

    try{

        let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

        let du = dupplicate.documents.filter(value=>{
        return value.refreshtoken === token
       })

       if(du[0]){


        jwt.verify(
            refreshToken,
            process.env.refreshToken,
            (err,decode)=>{
                if(err  || du[0].email !== decode.UserInfo.username){
                    return res.status(403).json({"message":`${err.message} please login again`})
                }
                const accessToken = jwt.sign(
                    {
                        "UserInfo":{
                            "username":du[0].email
                        }
                    },
                    process.env.accessToken,
                    {expiresIn : '30s'}
                )
    
                req.headers.authorization = 'Bearer '+accessToken
        
                next()
            }
        );
    
       

    }else{
        return res.status(401).json({"message":` token Expire log in please`})
    }

    }catch(err){

        return res.status(401).json({"message":` ${err.message} log in please`})
    }
  

}

module.exports = handleRefresh;