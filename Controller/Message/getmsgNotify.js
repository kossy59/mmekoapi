// const {connectdatabase} = require('../../config/connectDB')
// const sdk = require("node-appwrite");

const messagedb = require("../../Models/message")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const models = require("../../Models/models")
const deleteOldChats = require("../../utiils/Deletes/deletemessage")

const MsgNotify = async(req,res)=>{

    let userid = req.body.userid;


    
      console.log("getting message in all")
      let unfiterd_my_MSG = await messagedb.find({fromid:userid}).exec()
      let fiterd_my_MSG = unfiterd_my_MSG.filter(value=>{
         return value.notify === false || value.notify === true 
      })

      console.log("getting message in all 1")
      let unfiterd_rv_MSG = await messagedb.find({toid:userid}).exec()
      let fiterd_rv_MSG = unfiterd_rv_MSG.filter(value=>{
        return value.notify === false
      })

      let my_messgae_per_user = []

      let fiter_mymsg_A = fiterd_my_MSG.sort((a,b)=>b._id.getTimestamp().getTime() - a._id.getTimestamp().getTime())
      let fiter_mymsg_B = fiterd_my_MSG.sort((a,b)=>b._id.getTimestamp().getTime() - a._id.getTimestamp().getTime())

     
      for(let i = 0; i < fiter_mymsg_A.length; i++){
       
        if(fiter_mymsg_A[i].toid === fiter_mymsg_B[i].toid){
         // console.log("TIME STAMP "+fiter_mymsg_B[i]._id.getTimestamp())
          if(fiter_mymsg_A[i]._id.getTimestamp().getTime() > fiter_mymsg_B[i]._id.getTimestamp().getTime()){
            console.log("resemble by time1")
            let canpush = my_messgae_per_user.find(index=>index._id === fiter_mymsg_A[i]._id)
            if(!canpush){
              my_messgae_per_user.push(fiter_mymsg_A[i])
            }
          }else if(fiter_mymsg_B[i]._id.getTimestamp().getTime() > fiter_mymsg_A[i]._id.getTimestamp().getTime()){
           
            let canpush = my_messgae_per_user.find(index=>index.toid === fiter_mymsg_B[i].toid)
            if(!canpush){
              my_messgae_per_user.push(fiter_mymsg_B[i])
            }
          }else if(fiter_mymsg_B[i]._id.getTimestamp().getTime() === fiter_mymsg_A[i]._id.getTimestamp().getTime()){
            
            let canpush = my_messgae_per_user.find((index)=>{
              return index.toid === fiter_mymsg_A[i].toid
            })
           
            if(!canpush){
              my_messgae_per_user.push(fiter_mymsg_A[i])
            }
          }
        }else{
         
          let canpush = my_messgae_per_user.find(index=>index.toid === fiter_mymsg_A[i].toid)

          if(!canpush){
            my_messgae_per_user.push(fiter_mymsg_A[i])
          }
        }
      }

      console.log("my message length "+my_messgae_per_user.length)
     
     


      let recv_messgae_per_user = []

      let fiter_tome_A = fiterd_rv_MSG.sort((a,b)=>b._id.getTimestamp().getTime() - a._id.getTimestamp().getTime())
      let fiter_tome_B = fiterd_rv_MSG.sort((a,b)=>b._id.getTimestamp().getTime() - a._id.getTimestamp().getTime())

      for(let i = 0; i < fiter_tome_A.length; i++){
        if(fiter_tome_A[i].fromid === fiter_tome_B[i].fromid){
          if(fiter_tome_A[i]._id.getTimestamp().getTime() > fiter_tome_B[i]._id.getTimestamp().getTime()){
            let canpush = recv_messgae_per_user.find(index=>index.fromid === fiter_tome_A[i].fromid)
            if(!canpush){
              recv_messgae_per_user.push(fiter_tome_A[i])
            }
          }else if(fiter_tome_B[i]._id.getTimestamp().getTime() > fiter_tome_A[i]._id.getTimestamp().getTime()){
            let canpush = recv_messgae_per_user.find(index=>index.fromid === fiter_tome_B[i].fromid)
            if(!canpush){
              recv_messgae_per_user.push(fiter_tome_B[i])
            }
          }else if(fiter_tome_B[i]._id.getTimestamp().getTime() === fiter_tome_A[i]._id.getTimestamp().getTime()){
            let canpush = recv_messgae_per_user.find(index=>index.fromid === fiter_tome_A[i].fromid)
            if(!canpush){
              recv_messgae_per_user.push(fiter_tome_A[i])
            }
          }
        }else{
          let canpush = recv_messgae_per_user.find(index=>index._id === fiter_tome_A[i]._id)

          if(!canpush){
            recv_messgae_per_user.push(fiter_tome_A[i])
          }
        }
      }

      let tome_and_fromme_per_user = []
      
      if(my_messgae_per_user.length === 0 && recv_messgae_per_user.length > 0 ){
        console.log("transfaring recive message")
        tome_and_fromme_per_user = recv_messgae_per_user
      }

      if(recv_messgae_per_user.length === 0 && my_messgae_per_user.length > 0 ){
        console.log("transfaring recive message")
        tome_and_fromme_per_user = my_messgae_per_user
      }
      
     
    
      if(recv_messgae_per_user.length > 0 && my_messgae_per_user.length > 0 ){
       // console.log("getting message in all 4 lengths "+recv_messgae_per_user.length +""+ my_messgae_per_user.length)
         // we sort the my_messages to contain both the rev message too just one per me and sender, if my own is earliest use it 
      // if not use sender own as recent messge
      for(let i = 0; i < my_messgae_per_user.length; i++){

        if(recv_messgae_per_user.findIndex((value)=>{
          if(value.fromid === my_messgae_per_user[i].toid){
            return true
          }
        }) === -1){
          console.log("not find1")
          tome_and_fromme_per_user.push(my_messgae_per_user[i])

        }else if(recv_messgae_per_user.findIndex((value)=>{
          if(value.fromid === my_messgae_per_user[i].toid && value._id.getTimestamp().getTime() < my_messgae_per_user[i]._id.getTimestamp().getTime()){
            return true
          }
        }) !== -1){
          console.log("not find2")
          tome_and_fromme_per_user.push(my_messgae_per_user[i])
        }

      }

      for(let i = 0; i < recv_messgae_per_user.length; i++){

        if(my_messgae_per_user.findIndex((value)=>{
          if(value.toid === recv_messgae_per_user[i].fromid){
            return true
          }
        }) === -1){
          console.log("not find 3")
          tome_and_fromme_per_user.push(recv_messgae_per_user[i])

        }else if(my_messgae_per_user.findIndex((value)=>{
          if(value.toid === recv_messgae_per_user[i].fromid && value._id.getTimestamp().getTime() < recv_messgae_per_user[i]._id.getTimestamp().getTime()){
            return true
          }
        }) !== -1){
          console.log("not find 4")
          tome_and_fromme_per_user.push(recv_messgae_per_user[i])
        }

      }

      

      my_messgae_per_user.forEach(value=>{
        let ischeck = tome_and_fromme_per_user.find((index)=> {
          return index.toid === value.fromid || index.toid === value.toid 
        })
        if(!ischeck){
          tome_and_fromme_per_user.push(value)
        }
      })

      recv_messgae_per_user.forEach(value=>{
        let ischeck = tome_and_fromme_per_user.find((index)=> {
          return index.fromid === value.toid || index.fromid === value.fromid
        })
        if(!ischeck){
          tome_and_fromme_per_user.push(value)
        }
      })


      console.log("getting message in all 4 length last "+tome_and_fromme_per_user.length)
       
      }

      
      let allCurrent_MSG = unfiterd_rv_MSG.filter(value=>{
        return value.notify === true  && value.toid === userid
      }) 

      //console.log("notificatin is in "+allCurrent_MSG.length)

      

      let allRecent_A = allCurrent_MSG.sort((a,b)=>b._id.getTimestamp().getTime() - a._id.getTimestamp().getTime())
      let allRecent_B = allCurrent_MSG.sort((a,b)=>b._id.getTimestamp().getTime() - a._id.getTimestamp().getTime())

      let fiterd_notify_msg = [] // list of newest unread messages per user

     // console.log("notificatin is in "+allRecent_A.length)
     let count = 1;
     for(i = 0; i < allRecent_A.length; i++){
      
      if(allRecent_A[i].fromid === allRecent_B[i].fromid){
        count = count + 1
        console.log("count "+count)
        if(fiter_tome_A[i]._id.getTimestamp().getTime() > allRecent_B[i]._id.getTimestamp().getTime()){
          
          let canpush = fiterd_notify_msg.findIndex(index=>index.fromid === allRecent_A[i].fromid)
          if(canpush !== -1){
            console.log("pushing data1")
            fiterd_notify_msg.splice(canpush,1)
            
          }
          let data = allRecent_A[i].toObject()
            data.count = count
            fiterd_notify_msg.push(data)
        }else if(allRecent_B[i]._id.getTimestamp().getTime() > allRecent_A[i]._id.getTimestamp().getTime()){
          
          let canpush = fiterd_notify_msg.findIndex(index=>index.fromid === allRecent_B[i].fromid)
          if(canpush !== -1){
            console.log("pushing data2")
            fiterd_notify_msg.splice(canpush,1)
           
          }
          let data = allRecent_B[i].toObject()
          data.count = count
          fiterd_notify_msg.push(data)
        }else {
          
          let canpush = fiterd_notify_msg.findIndex(index=>index.fromid === allRecent_A[i].fromid)
          if(canpush !== -1){
            console.log("pushing data3")
            fiterd_notify_msg.splice(canpush,1)
           
          }
          let data = allRecent_A[i].toObject()
          data.count = count
          fiterd_notify_msg.push(data)
        }
      }else{
        

        let canpush = fiterd_notify_msg.find(index=>index.fromid === allRecent_A[i].fromid)

        if(!canpush){
         
          let data = allRecent_A[i].toObject()
          count = 1
          data.count = count
          fiterd_notify_msg.push(data)
          count = 0

        }
      }

    }

     let recent_message_without_uread = [] // this users dont have any new uread meassge just plain recent read messages

    

     tome_and_fromme_per_user.forEach(value=>{
      let isIn = fiterd_notify_msg.find((index)=>{
       return (index.fromid === value.toid && value.fromid === userid) || (index.fromid === value.fromid && value.toid === userid)
      })

      if(!isIn){
        console.log("message IDS "+value._id)
        recent_message_without_uread.push(value)
      }
     })


     let sorted_unread = [] // we contain the unread messages with thier complete data

     
     for(let i = 0; i < fiterd_notify_msg.length; i++){
      let userINfo = await userdb.findOne({_id:fiterd_notify_msg[i].fromid}).exec()
      if(userINfo){
        let photolink = ""
       let photo = await completedb.findOne({useraccountId:userINfo._id}).exec()
       if(photo.photoLink){
        photolink = photo.photoLink
       }
        let data = {
          username :`${userINfo.firstname} ${userINfo.lastname} `,
          photolink:photolink,
          content:fiterd_notify_msg[i].content,
          fromid:fiterd_notify_msg[i].fromid,
          toid:fiterd_notify_msg[i].toid,
          date:fiterd_notify_msg[i].date,
          messagecount:fiterd_notify_msg[i].count,
          id:fiterd_notify_msg[i]._id,
          value:"unread",
          online:userINfo.active
        }

        sorted_unread.push(data)
      }
     }

     sorted_unread.sort((a,b)=>b.id.getTimestamp().getTime() - a.id.getTimestamp().getTime())


     let sorted_recent = []
     
     for(let i = 0; i < recent_message_without_uread.length; i++){
      if(recent_message_without_uread[i].toid === userid){
        // we get fromid infomation
        
        let userINfo = await userdb.findOne({_id:recent_message_without_uread[i].fromid}).exec()
        if(userINfo){
          
          let photolink = ""
          let photo = await completedb.findOne({useraccountId:userINfo._id}).exec()
          if(photo.photoLink){
            photolink = photo.photoLink
          }
          let data ={
            fromid:recent_message_without_uread[i].fromid,
            toid:recent_message_without_uread[i].toid,
            content:recent_message_without_uread[i].content,
            name:`${userINfo.firstname} ${userINfo.lastname}`,
            photolink:photolink,
            id:recent_message_without_uread[i]._id,
            value:"recent",
            online:userINfo.active,
            date:recent_message_without_uread[i].date
          }
          sorted_recent.push(data)
        }

      }else if(recent_message_without_uread[i].fromid === userid){
        // we get toid infomation
        
        let userINfo = await userdb.findOne({_id:recent_message_without_uread[i].toid}).exec()
        if(userINfo){
          console.log("indide my info")
          let photolink = ""
          let photo = await completedb.findOne({useraccountId:userINfo._id}).exec()
          if(photo.photoLink){
            photolink = photo.photoLink
          }
          let data ={
            fromid:recent_message_without_uread[i].fromid,
            toid:recent_message_without_uread[i].toid,
            content:recent_message_without_uread[i].content,
            name:`${userINfo.firstname} ${userINfo.lastname}`,
            photolink:photolink,
            id:recent_message_without_uread[i]._id,
            value:"recent",
            online:userINfo.active,
            date:recent_message_without_uread[i].date
          }
          sorted_recent.push(data)
        }

      }

     }

     sorted_recent.sort((a,b)=>b.id.getTimestamp().getTime() - a.id.getTimestamp().getTime())

     let allData = []

     console.log("getting message in all 10")
     sorted_unread.forEach(value=>{
      allData.push(value)
     })

     console.log("getting message in all 11")
     sorted_recent.forEach(value=>{
      allData.push(value)
     })

     console.log("array list success "+allData.length)

     return res.status(200).json({"ok":true,"message":`successfully`,lastchat:allData})

    

    // catch(err){

    //     console.log(err.message+"  inside recent message")
    //     return []
    // }

}

module.exports = MsgNotify;