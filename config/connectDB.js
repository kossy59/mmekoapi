const sdk = require("node-appwrite");
require('dotenv').config()
const client = new sdk.Client()
let memkodbID;
let memko_socialDB = ''
let colID = ''
let userCOL = ''
const {initalizeDB} = require('../Model/userdb')
const {initalizeer} = require('../Model/usercomplete')
client.setEndpoint("https://cloud.appwrite.io/v1")
.setProject(process.env.PROJECTID)
.setKey(process.env.APIKEY);
var database = new sdk.Databases(client);

async function connectdatabase(){

    if((await database.list()).databases.length <= 0){
        memkodbID = await database.create(
            sdk.ID.unique(),
            'memkosocialDB'
        )

       // database.createStringAttribute()
        await initalizeDB(memkodbID.$id,database)

        await initalizeer(memkodbID.$id,database)

        memko_socialDB = String(memkodbID.$id)


    }else{
        let db = (await database.list()).databases.filter(value=>{
            return value.name === "memkosocialDB"
        })
        memkodbID = db[0];
        memko_socialDB = String(db[0].$id)

        let coll = await database.listCollections(db[0].$id);
        let collection = coll.collections.filter(value=>{
            return value.name === "userDB"
        })

        colID = String(collection[0].$id)

        let userincol = await database.listCollections(db[0].$id);
        let userinfocollectin = userincol.collections.filter(value=>{
            return value.name === "userInfo"
        })

        userCOL = String(userinfocollectin[0].$id)

       // console.log(colID)
    }



   // console.log(memko_socialDB)
  // console.log(colID)

  return{
    colid:colID,
    dataid:memko_socialDB,
    databar:database,
    userincol:userCOL
  }


}






module.exports = {client,memko_socialDB,database,connectdatabase,colID}