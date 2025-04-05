const documentdb = require("../../Models/document")
const admindb = require("../../Models/admindb")

const createModel = async (req,res)=>{

    // {} object field names
    const userid = req.body.userid;
    let firstname = req.body.firstName
    let lastname = req.body.lastName
    let email = req.body.email
    let dob = req.body.dob
    let country = req.body.country
    let city = req.body.city
    let address = req.body.address
    let documentType = req.body.documentType
    let holdingIdPhoto = req.body.holdingIdPhoto
    let idPhoto = req.body.idPhoto
    let idexpire = req.body.idexpire
  
    
   
    if(!userid && !firstname && !lastname && !email && !dob && !country && !city && !address && !documentType && !holdingIdPhoto && !idPhoto && !idexpire){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    console.log("doc type "+documentType)

   

    try{
      
         

           let document =  {
            userid,
            firstname,
            lastname,
            email,
            dob,
            country,
            city,
            address,
            documentType,
            holdingIdPhoto,
            idPhoto,
            idexpire
            
            }

           

            await documentdb.create(document)

            let respond = {
                userid:userid,
                message:`Your Model Application is under review`,
                seen:true
            }
        
            await admindb.create(respond)

            // returns ok true if succefully posted
            return res.status(200).json({"ok":true,"message":`successfully`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel