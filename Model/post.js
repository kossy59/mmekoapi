var sdk = require("node-appwrite");

var UsersDB = undefined

async function initalizePost(memko_socialDB,database){

    UsersDB = await database.createCollection(
        memko_socialDB,
        sdk.ID.unique(),
        'Post'
    )
    
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'userid',
        255,true
    
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'postlink',
        255,false
    
    )
    
   

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'posttime',
        255,true
    
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
        'posttype',
        255,true
    
    )
    return UsersDB
}

module.exports = {initalizePost}