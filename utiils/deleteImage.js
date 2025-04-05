const sdk = require("node-appwrite")

const client = new sdk.Client()
.setEndpoint("https://cloud.appwrite.io/v1") // Your API Endpoint
.setProject("668f9f8c0011a761d118")
.setKey("standard_fbd7281db90f58951bb0ca146bfa7cc47c4307892be077e95a7d16983a006e694428a355ce72ea99fea67a0e204f227f193f2f8c401c142424dbf6ff6a831348aabbb281a502bc1f8ea116f95b0d2ecf16ee5dc8d4e003855073d9cbfd4ac3ddbdc7623e1946163ad65b46f1a75757846e74cda7a4ac91fd6e026fe637c32ab2")

const storage = new sdk.Storage(client)

const removeimg = async(bucket,photolink)=>{
    
    await storage.deleteFile(bucket,photolink)
}

module.exports = removeimg