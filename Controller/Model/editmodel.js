// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const models = require("../../Models/models")

const createModel = async (req,res)=>{

    const hostid = req.body.hostid;
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
    let hosttype = req.body.hosttype
    let photolink = req.body.photolink
   
    if(!hostid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
     
    //let data = await connectdatabase()

    try{
      

           //let userdb = await data.databar.listDocuments(data.dataid,data.modelCol)
          
          //  let currentuser = userdb.documents.find(value=>{
          //   return value.$id === hostid
          //  })

           let currentuser = await models.findOne({_id:hostid}).exec()

          

           if(!currentuser){
            return res.status(409).json({"ok":false,"message":`user can not edit model`})
           }

           let age1 = currentuser.age
           let location1 = currentuser.location
           let price1 = currentuser.price
           let duration1 = currentuser.duration
           let bodytype1 = currentuser.bodytype
           let smoke1 = currentuser.smoke
           let interestedin1 = currentuser.interestedin
           let height1 = currentuser.height
           let weight1 = currentuser.weight
           let description1 = currentuser.description
           let gender1 = currentuser.gender
           let timeava1 = currentuser.timeava
           let daysava1 = currentuser.daysava
           let drink1 = currentuser.drink
           let hosttype1 = currentuser.hosttype

           if(!age){
            age = age1
           }

           if(!location1){
            location = location1
           }
           if(!price){
            price = price1
           }
           if(!duration){
            duration = duration1
           }
           if(!bodytype){
            bodytype = bodytype1
           }
           if(!smoke){
            smoke = smoke1
           }
           if(!interestedin){
            interestedin = interestedin1
           }
           if(!height){
            height = height1
           }
           if(!weight){
            weight = weight1
           }
           if(!description){
            description = description1
           }
           if(!gender){
            gender = gender1
           }
           if(!timeava){
            timeava = timeava1
           }
           if(!daysava){
            daysava = daysava1
           }
           if(!drink){
            drink = drink1
           }
           if(!hosttype){
            hosttype = hosttype1
           }

            currentuser.age = age;
            currentuser.location = location
            currentuser.price = price;
            currentuser.duration = duration
            currentuser.bodytype = bodytype;
            currentuser.smoke = smoke;
            currentuser.drink = drink;
            currentuser.interestedin = interestedin;
            currentuser.height = height;
            currentuser.weight = weight;
            currentuser.description = description
            currentuser.gender = gender;
            currentuser.timeava = timeava
            currentuser.daysava = daysava
            currentuser.hosttype = hosttype;
            currentuser.photolink = photolink
            currentuser.save()

            

           // await data.databar.updateDocument(data.dataid,data.modelCol,currentuser._id,currentuser)


            return res.status(200).json({"ok":true,"message":`Model Update successfully`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel