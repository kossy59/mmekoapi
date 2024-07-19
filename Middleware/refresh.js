const resgisterUser = require('../model/userRegister.js');
const jwt = require('jsonwebtoken');

const handleRefresh = async (req,res,next)=>{
    let token  = 

    token = req.body.token

    if(!token){
        return res.status(401).json({"message":`token not found!!!`})
    }
    const refreshToken = token.toString();

    const foundUser = await resgisterUser.findOne({refreshToken:refreshToken}).exec()

    if(!foundUser){
        return res.status(401).json({"message":` token Expire log in please`})
    }

    jwt.verify(
        refreshToken,
        process.env.refreshToken,
        (err,decode)=>{
            if(err  || foundUser.email !== decode.UserInfo.username){
                return res.status(403).json({"message":`${err.message} login again`})
            }
            const accessToken = jwt.sign(
                {
                    "UserInfo":{
                        "username":foundUser.email
                    }
                },
                process.env.accessToken,
                {expiresIn : '30s'}
            )

            req.headers.authorization = 'Bearer '+accessToken
    
            next()
        }
    );


}

module.exports = handleRefresh;