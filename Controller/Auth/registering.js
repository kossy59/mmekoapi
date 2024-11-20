//const {userdb} = require('../../Model/userdb');
//const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require('bcrypt');
//const { Query } = require('node-appwrite');
//const sdk = require("node-appwrite");
const forgetHandler = require('../../helpers/sendemailAuth');
const userdb = require("../../Models/userdb")
const baneddb = require("../../Models/admindb")
const usercompletedb = require("../../Models/usercomplete")

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

   //let data = await connectdatabase()
    
    if(!firstname && !lastname && !gender && !email && !password && !state && !age && country ){
        return res.status(400).json({"ok":false,'message': 'Registeration not complete!!'})
    }
    //let dupplicate;
    let Email = email.toLowerCase().trim()

     let emailbaned = await baneddb.findOne({email:Email}).exec()
     let user_uncon = await userdb.findOne({email:Email}).exec()

     if(user_uncon){
        console.log("inside passcode")
       
       if(user_uncon.emailconfirm !== "verify"){
            await userdb.deleteOne({_id:user_uncon._id})
      }
     }

      

    if(emailbaned){
        if(emailbaned.delete === true){
            return res.status(400).json({"ok":false,'message': 'You account have been banned'})

        }

         if(emailbaned.suspend === true){
            let CDate = Date.now()
            let endDate = new Date(Number(emailbaned.end_date)) 
            let current_date = new Date(Number(CDate))

            if(current_date.getTime() > endDate.getTime()){
                await baneddb.deleteOne({email:Email})

            }

             if(current_date.getTime() < endDate.getTime()){
                const diffTime = Math.abs(endDate - current_date);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                return res.status(400).json({"ok":false,'message': `your account is suspended for ${diffDays}-Days`})

            }

        }
    }
  
    try{

        let dublicate = await userdb.findOne({
            email:Email
        }).exec()
       //let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //    let du = dupplicate.documents.filter(value=>{
    //     return value.email === email
    //    })
   
       

       if(dublicate){
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
            email:Email,
            password:hashPwd,
            emailconfirm:"not",
            emailconfirmtime:"not",
            active:false,
            state:state,
            country:country,
            refreshtoken:"",
            age:age,
            admin:false,
            passcode:'',
            balance:''
        }

        let user = await userdb.create(db);

         var moreuser = {
                useraccountId : user._id,
                interestedIn :"Nothing",
                details:"Hello am using Mmeko"
            }

            await usercompletedb.create(moreuser)
  
        //await data.databar.createDocument(data.dataid,data.colid,sdk.ID.unique(),db)
        await forgetHandler(req,res,Email)
        //await forgetHandler(req,res,)

    }catch(err){
        return res.status(500).json({'ok':false,'message':  `${err.message} register`});

    }

    

}


module.exports = handleNewUser;