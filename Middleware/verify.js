const jwt = require('jsonwebtoken');

const verifyJwt = (req,res,next)=>{
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if(!authHeader?.startsWith('Bearer ')){
        return res.status(401).json({"message":"Unauthorized"})

    }

    const token = authHeader.split(' ')[1];



    jwt.verify(
        token,
        process.env.accessToken,
        (err,decode)=>{
            if(err){
                return res.status(403).json({"message":err.message})
            }
            req.user = decode.UserInfo.username;
            next()
        }
    );
}

module.exports = verifyJwt;