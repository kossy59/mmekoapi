var sdk = require("node-appwrite");

var UsersDB = undefined


async function initalizeDB(memko_socialDB,database){

    UsersDB = await database.createCollection(
        memko_socialDB,
        sdk.ID.unique(),
        'userDB'
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'firstname',
        255,true
    )
    
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'lastname',
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
        'username',
        255,false
    
    )
    
    // await database.createStringAttribute(
    //     memko_socialDB,
    //     UsersDB.$id,
    //     'email',
    //     255,true
    
    // )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'password',
        255,true
    
    )
    
    // await database.createStringAttribute(
    //     memko_socialDB,
    //     UsersDB.$id,
    //     'emailconfirm',
    //     255,false
    
    // )
    
    // await database.createStringAttribute(
    //     memko_socialDB,
    //     UsersDB.$id,
    //     'emailconfirmtime',
    //     255,false
    
    // )
    
    await database.createBooleanAttribute(
        memko_socialDB,
        UsersDB.$id,
        'active',
         true
    
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'state',
        255,true
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'country',
        255,true
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'refreshtoken',
        255,false
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'age',
        255,true
    
    )
    
    await database.createBooleanAttribute(
        memko_socialDB,
        UsersDB.$id,
        'admin',
        false
    
    
    )
    
    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'passcode',
        255,false
    
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'balance',
        255,false
    
    )

    await database.createStringAttribute(
        memko_socialDB,
        UsersDB.$id,
        'secretPhraseHash',
        255,true
    )

    await database.createIntegerAttribute(
        memko_socialDB,
        UsersDB.$id,
        'pending',
        false
    )

    await database.createIntegerAttribute(
        memko_socialDB,
        UsersDB.$id,
        'earnings',
        false
    )
    
   return UsersDB ;
}



module.exports = {initalizeDB}

