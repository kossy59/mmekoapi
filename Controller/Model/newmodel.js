// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const models = require("../../Models/models")
const userdb = require("../../Models/userdb")

const createModel = async (req,res)=>{

    const userid = req.body.userid;
    let photolink = req.body.photolink
    let name = req.body.name
    let age = req.body.age
    let location = req.body.location
    let price = req.body.price
    let duration = req.body.duration
    let bodytype = req.body.bodytype
    let smoke = req.body.smoke
    let interestedin = req.body.interestedin
    let height = req.body.height
    let weight = req.body.weight
    let description = req.body.description
    let gender = req.body.gender
    let timeava = req.body.timeava
    let daysava = req.body.daysava
    let drink = req.body.drink
    let document = req.body.document
    let hosttype = req.body.hosttype
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    //let data = await connectdatabase()

    try{
      
          //  let userdb = data.databar.listDocuments(data.dataid,data.colid)
          //  let currentuser = (await userdb).documents.find(value=>{
          //   return value.$id === userid
          //  })

          console.log("ontop checking user")
           let currentuser = await userdb.findOne({_id:userid}).exec()

           if(!currentuser){
             console.log("user faild ")
            return res.status(409).json({"ok":false,"message":`user can not create model`})
           }

          let model =  {
            userid,
            photolink,
            verify:'notlive',
            name,
            age,
            location,
            price,
            duration,
            bodytype,
            smoke,
            drink,
            interestedin,
            height,
            weight,
            description,
            gender,
            timeava,
            daysava,
            document,
            hosttype

            }

             console.log("under model user")
            

            //await data.databar.createDocument(data.dataid,data.modelCol,sdk.ID.unique(),model)

            await models.create(model)


            return res.status(200).json({"ok":true,"message":`Model Hosted successfully`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel