var sdk = require("node-appwrite");

var UsersDB = undefined

async function initalizeCreator(memko_socialDB,database){

    UsersDB = await database.createCollection(
        memko_socialDB,
        sdk.ID.unique(),
        'Creator'
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'verify',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'drink',
        255,true
    
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'name',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'age',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'location',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'price',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'duration',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'bodytype',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'smoke',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'interestedin',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'height',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'weight',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'description',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'gender',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'timeava',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'daysava',
        255,true
    
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
        'photolink',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'hosttype',
        255,true
    
    )
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'document',
        255,true
    
    )
}

module.exports = {initalizeCreator}