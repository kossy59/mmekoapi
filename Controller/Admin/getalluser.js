const userdb = require("../../Models/userdb")
let admindb = require("../../Models/admindb")
let userphoto = require("../../Models/usercomplete")

const updatePost = async (req,res)=>{
    

    try{


               let du = await userdb.find({}).exec()
               let admin = await admindb.find({}).exec()
               let photos = await userphoto.find({}).exec()

               const date = Date.now()

               const current_date = new Date(Number(date))

               let suppend_user = []

               admin.forEach(value =>{
                 let suppend_date = new Date(Number(value.end_date))
                 if(current_date.getTime() > suppend_date.getTime()){
                    let user = {
                        userid:value.userid
                    }
                    suppend_user.push(user)
                 }
               })

               let list_user = []

               du.forEach(value1 => {
                 if(suppend_user.length > 0){
                    suppend_user.forEach(value =>{
                        if(String(value1.userid) !== String(value.userid)){
                            list_user.push(value1)
                        }
                    })
                 }else{
                    list_user.push(value1)
                 }
               })

               let alluser = []

               list_user.forEach(value1=>{
                photos.forEach(value2 =>{
                  if(String(value1._id) === String(value2.useraccountId)){
                    let obj = value1.toObject()
                    obj.photolink = value2.photoLink
                    alluser.push(obj)
                  }
                })
               })



               

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,users:alluser})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost