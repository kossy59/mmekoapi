const {connectdatabase} = require('../config/connectDB')
const sdk = require("node-appwrite");

const MYID = async(ID)=>{
          
          let data = await connectdatabase();

           try{
             let Listofusername = await data.databar.listDocuments(data.dataid,data.colid)
             let Listofmodel = await data.databar.listDocuments(data.dataid,data.modelCol)
             let Listofuserphoto = await data.databar.listDocuments(data.dataid,data.userincol)
             let name = Listofusername.documents.find(value =>{
                return ID === value.$id
             })

             let clientPhoto = Listofuserphoto.documents.find(value =>{
                return value.useraccountId === ID
             })

             let modelInfo = Listofmodel.documents.find(value =>{
                return value.$id === ID
             })

             if (modelInfo){
                let image = modelInfo.photolink.split(",")
                return {
                    name:modelInfo.name,
                    photolink:image[0]
                }
             }else if(name){
                return{
                    name:name.firstname,
                    photolink:clientPhoto.photoLink
                }
             }else{
                return null
             }
           }catch(err){
            return null

           }

}

module.exports = MYID;