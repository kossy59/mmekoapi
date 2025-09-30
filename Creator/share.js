var sdk = require("node-appwrite");

var UsersDB = undefined

async function initalizeShare(memko_socialDB,database){

    UsersDB = await database.createCollection(
        memko_socialDB,
        sdk.ID.unique(),
        'Share'
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'uesrid',
        255,true
    
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'postid',
        255,false
    
    )
    
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'content',
        255,false
    
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'sharetime',
        255,false
    
    )

    return UsersDB
}

module.exports = {initalizeShare}