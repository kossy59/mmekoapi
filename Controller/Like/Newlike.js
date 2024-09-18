// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const likedata = require("../../Models/like")
const createLike = async (req,res)=>{

    const userid = req.body.userid;
    let sharedid = req.body.sharedid;
    const postid = req.body.postid;
   
    if(!userid  && !postid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')
    //let data = await connectdatabase()

    try{
        console.log('untop like db')
       // let  dupplicate = await data.databar.listDocuments(data.dataid,data.likeCol)

        // console.log('untop like db')
        // let du = dupplicate.documents.find(value=>{

        //     return value.uesrid === uesrid  && value.postid === postid
        //    })

           let du = likedata.find({userid:userid}).exec()
           let du1 = (await du).find(value => value.postid === postid)
    
           console.log('untop delete db')
           if(du1){
            await likedata.deleteOne({_id:du1._id})
           // data.databar.deleteDocument(data.dataid,data.likeCol,du.$id)
            return res.status(409).json({"ok":false,'message': 'ulike post success!!'});
    
           }
      

        if(!sharedid){
            sharedid = ""
        }

        console.log("like user id "+userid)
       
           
           let like =     {
                    userid,
                    sharedid,
                    postid,
                    
                }
            
                console.log('untop asign db')
            //data.databar.createDocument(data.dataid,data.likeCol,sdk.ID.unique(),like)
            await likedata.create(like)

            console.log('number of like '+(await likedata.find()).length)
            return res.status(200).json({"ok":true,"message":`like post Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike