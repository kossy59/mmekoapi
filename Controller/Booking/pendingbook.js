const bookingdb = require("../../Models/book")
const modeldb = require("../../Models/models")

const createLike = async (req,res)=>{
     
    const userid = req.body.userid;
    
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         const users = await bookingdb.find({userid:userid}).exec()

         let user = users.filter(value =>{
            return String(value.status) === "pending"
         })

         

         

         if(!user[0]) {
             return res.status(200).json({"ok":false,'message': 'you have 0 pending request!!',info:[]})
         }

         let listinfos = []

        
         for(let i = 0; i < user.length; i++){

            const modelid = await modeldb.findOne({_id:user[i].modelid}).exec()
             let image = modelid.photolink.split(",")

               listinfos.push(
                    { 
                    name : modelid.name,
                    type : user[i].type,
                    date : user[i].date,
                    time : user[i].time,
                    photolink : image[0],
                    modelid : modelid._id,
                    id: user[i]._id
                    }
               )
   
            
         }
         

        // console.log("modeil "+modelinfo)

         
      
       
            return res.status(200).json({"ok":true,"message":` Success`,info:listinfos})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike