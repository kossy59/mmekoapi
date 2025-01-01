const documentdb = require("../../Models/document")

const createModel = async (req,res)=>{

    // {} object field names
    const userid = req.body.userid;
    let firstname = req.body.firstname
    let lastname = req.body.lastname
    let email = req.body.email
    let dob = req.body.dob
    let country = req.body.country
    let city = req.body.city
    let resident_address = req.body.resident_address
    let document_type = req.body.document_type
    let photolinkid = req.body.photolinkid
    let userphotolink = req.body.userphotolink
    let id_expiredate = req.body.id_expiredate
    let expireable = req.body.expireable
    
   
    if(!userid && !firstname && !lastname && !email && !dob && !country && !city && !resident_address && !document_type && !photolinkid && !userphotolink && !id_expiredate && !expireable){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

   

    try{
      
         

           let document =  {
            userid,
            firstname,
            lastname,
            email,
            dob,
            country,
            city,
            resident_address,
            document_type,
            photolinkid,
            userphotolink,
            id_expiredate,
            expireable

            }

           

            await documentdb.create(document)


            // returns ok true if succefully posted
            return res.status(200).json({"ok":true,"message":`Model Hosted successfully`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel