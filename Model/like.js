var sdk = require("node-appwrite");

var UsersDB = undefined

async function initalizeLike(memko_socialDB,database){

    UsersDB = await database.createCollection(
        memko_socialDB,
        sdk.ID.unique(),
        'Like'
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
        'sharedid',
        255,false
    
    )
    
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'postid',
        255,true
    
    )

    return UsersDB
}

module.exports = {initalizeLike}