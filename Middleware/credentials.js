const whitelist = require('../config/allowedOrigin') 

const credentials = (req,res,next)=>{
    const origin = req.headers.origin;
    if(whitelist.includes(origin)){
        req.header('Access-Control-Allow-Credentials',true)
    }
    next()
}

module.exports = credentials;