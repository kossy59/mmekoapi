var sdk = require("node-appwrite");

var userInfo;
let information;

async function initalizeer(memko_socialDB,database){
    userInfo = await database.createCollection(
        memko_socialDB,
        sdk.ID.unique(),
        'userInfo'
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        userInfo.$id,
        'useraccountId',
        255,true
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        userInfo.$id,
        'interestedIn',
        255,true
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        userInfo.$id,
        'photoLink',
        255,false
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        userInfo.$id,
        'relationshipType',
        255,true
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        userInfo.$id,
        'details',
        255,true
    
    )

    information = String(userInfo.$id)

}


module.exports = {information,initalizeer}