const {userdb} = require('../../Model/userdb');
const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require('bcrypt');
const { Query } = require('node-appwrite');
const sdk = require("node-appwrite");
const forgetHandler = require('../../helpers/sendemailAuth');

const handleNewUser = async (req,res)=>{

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const gender = req.body.gender;
    let nickname = req.body.nickname;
    const email = req.body.email;
    const password = req.body.password;
    const state = req.body.state;
    const age = req.body.age;
    const country = req.body.country;

   let data = await connectdatabase()
    
    if(!firstname && !lastname && !gender && !email && !password && !state && !age && country ){
        return res.status(400).json({"ok":false,'message': 'Registeration not complete!!'})
    }
    //let dupplicate;
    try{
       let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

       let du = dupplicate.documents.filter(value=>{
        return value.email === email
       })

       if(du[0]){
        return res.status(409).json({"ok":false,'message': 'User Already Register!!'});

       }
    }catch(err){
        return res.status(500).json({"ok":false,'message': `${err.message}! search dublicate`});
    }

    if(!nickname){
        nickname = "";
    }
    
    try{

       const hashPwd = await bcrypt.hash(password,10);

        var db = {

            firstname:firstname,
            lastname:lastname,
            gender:gender,
            nickname:nickname,
            email:email,
            password:hashPwd,
            emailconfirm:"not",
            emailconfirmtime:"not",
            active:false,
            state:state,
            country:country,
            refreshtoken:"",
            age:age,
            admin:false,
            passcode:''
        }

        
  
        await data.databar.createDocument(data.dataid,data.colid,sdk.ID.unique(),db)
        await forgetHandler(req,res,email,data.dataid,data.colid,data.databar)

    }catch(err){
        return res.status(500).json({'ok':false,'message':  `${err.message} register`});

    }

    

}


module.exports = handleNewUser;