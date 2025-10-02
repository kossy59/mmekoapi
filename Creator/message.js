var UsersDB = undefined
var sdk = require("node-appwrite");

async function initalizeMessage(memko_socialDB,database){

    UsersDB = await database.createCollection(
        memko_socialDB,
        sdk.ID.unique(),
        'Message'
    )

   
    await database.createBooleanAttribute(
        memko_socialDB,
        UsersDB.$id,
        'client',
         true
    
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'fromid',
        255,true
    
    )
    await database.createBooleanAttribute(
        memko_socialDB,
        UsersDB.$id,
        'notify',
        true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'content',
        1000,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'favourite',
        true
    
    )

      await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'date',
        255,true
    
    )

      await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'toid',
        255,true
    
    )
 
}

module.exports = {initalizeMessage}