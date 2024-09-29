const bookingdb = require("../../Models/book")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")

const createLike = async (req,res)=>{
     
    const modelid = req.body.modelid;
     console.log('inside getting model notification '+modelid)
    
   
    if(!modelid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         const users = await bookingdb.find({modelid:modelid}).exec()

         let user = users.filter(value =>{
            return String(value.status) === "pending"
         })

         

         

         if(!user[0]) {
             return res.status(200).json({"ok":false,'message': 'you have 0 pending request!!',notify:[]})
         }

         let listinfos = []

        
         for(let i = 0; i < user.length; i++){

            const client = await userdb.findOne({_id:user[i].userid}).exec()
            const clientphoto = await completedb.findOne({useraccountId:user[i].userid}).exec()
            

               listinfos.push(
                    { 
                    name : client.firstname,
                    type : user[i].type,
                    date : user[i].date,
                    time : user[i].time,
                    photolink : clientphoto.photoLink,
                    clientid : client._id,
                    place: user[i].place 
                    }
               )
   
            
         }
         

       
            return res.status(200).json({"ok":true,"message":` Success`,notify:listinfos})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike