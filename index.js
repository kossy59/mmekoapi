require('dotenv').config()
const cookieParser = require('cookie-parser')
// const credentials = require('./Middleware/credentials')
// const corsOptions = require('./config/corsOptions')
const mongoose = require('mongoose')
const connect = require('./config/connectdataBase')
const handleRefresh = require('./Middleware/refresh')
const verifyJwt = require('./Middleware/verify')
const checkuser = require('./utiils/useractive')
const userdisconnect = require('./utiils/userdisconnect')
const Livechats = require('./utiils/createlivechat')
const getnotify = require("./utiils/getnotification")
const MYID = require("./utiils/Getmyname")
const PORT = process.env.PORT || 3500
const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors')
const { setInterval } = require('timers')
let {Check_caller, deletebyClient ,deletebyCallerid, check_connected} = require("./utiils/check_caller")

let myurl = "https://mmekosocial.onrender.com"
//let myurl = "http://localhost:3000"

const corsOptions = {
    credentials: true,
    origin: [`${myurl}`] // Whitelist the domains you want to allow
};

app.use(cors(corsOptions));
// 
//


// app.use(credentials)
// app.use(cors(corsOptions));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());



const io = new Server(server, {
    cors: {origin:"*", methods: ["GET", "POST"]}
});



connect()

const IDS = {}


app.use('/', require('./routes/api/post/getpost'))

app.use('/getallpost',require('./routes/api/post/getpost'))
app.use('/getalluserpost',require('./routes/api/post/getalluserPost'))
app.use('/getallcomment',require('./routes/api/comment/Getallcomment'))
app.use('/getalllike',require('./routes/api/like/alllike'))
app.use('/getallsharepost',require('./routes/api/share/getallsharedpost'))
app.use('/getsharepost',require('./routes/api/share/getsharepost'))
app.use('/getprofile',require('./routes/api/profile/Profile'))
app.use('/getmoreprofile',require('./routes/api/Profilemore/getProfilemore'))
app.use('/messagenotification',require('./routes/api/chat/getNotificationmsg'))

io.on('connection', (socket) => {
  socket.on('online',async (userid)=>{
    if(userid){
       
       await checkuser(userid)
       socket.id = userid
       IDS.userid = userid
       console.log('a user connected '+ socket.id);
       socket.join("LiveChat")


    }
  })

  
    socket.on("message",async (data)=>{

         //console.log(data);
         await Livechats(data)
         let info = await MYID(data.fromid)
         let name ;
         let photolink;
         if(info){
           name = info.name;
           photolink = info.photolink;

          // console.log("name "+name+" photolink "+photolink)
          
         }
      
         //socket.to("LiveChat").emit(data)
         socket.broadcast.emit("LiveChat",{name,photolink,data:data})
         

    })

    socket.on("videocall",async (data)=>{
      let myid = data.caller_id
      let answerid = data.answer_id
      let video_user =  data.my_id
      let callname = data.name

      // set caller socket

      if(myid === video_user){

        let responds = await Check_caller(answerid, myid)
        if(data.answer_message === "reject"){
          await deletebyClient(myid)
          data.answer_message = "call ended"
          socket.broadcast.emit(answerid,{data:data})

        }else if(responds === "calling"){
          data.answer_message = "calling"
          data.message = `incomming caller ${callname}`
          //console.log("calling user "+data.answer_id)
          socket.broadcast.emit(answerid,{data:data})

        }else if(responds === "user_busy"){

          data.answer_message = "user busy"
          socket.broadcast.emit(myid,{data:data})

        }else if(responds === "store_sdb"){
           socket.broadcast.emit(answerid,{data:data})
        }
      }


      if(answerid === video_user){
        let responds = await check_connected(answerid)
        if(data.answer_message === "reject"){
          await deletebyCallerid(answerid)
          data.answer_message = "call ended"
          socket.broadcast.emit(myid,{data:data})
        }else if(responds === false){
          socket.broadcast.emit(myid,{data:data})
        }else if(responds === true){
          socket.broadcast.emit(myid,{data:data})
        }
      }

      

    })

  // socket.on('notify',async (data)=>{
  //  // console.log("Inside notification")
  //   if(data){
  //      console.log("Inside notification")
  //     setInterval(async ()=>{
  //       let note = await getnotify(data)
  //       console.log(note)
  //        socket.emit(data+`notify`,note)
  //     },20000)

  //   }
  // })

 

  socket.on('disconnect',async()=>{
   await userdisconnect(socket.id)
   socket.disconnect()
   console.log('user disconnected ' + socket.id)
  })
   
  });


  app.use('/verifyemail',require('./routes/Auth/verifyEmail'))
  app.use('/register',require('./routes/Auth/register'))
  app.use('/logout',require('./routes/Auth/logout'))
  app.use('/login',require('./routes/Auth/login'))
  app.use('/forgetpassword',require('./routes/Auth/forgetpassword'))
  app.use('/completeregister',require('./routes/Auth/completeregister'))
  app.use('/comfirmpasscode',require('./routes/Auth/comfirmpasscode'))
  app.use('/changepassword',require('./routes/Auth/changepassword'))
  app.use('/getpostcomment',require('./routes/api/comment/Getallcomment'))
  app.use('/getprofilebyid',require('./routes/api/profile/Profile'))
  app.use('/getverifymodel',require('./routes/api/model/getlivemodel'))
  app.use('/getmodelbyid',require('./routes/api/model/getmodelbyid'))
  app.use(handleRefresh);

  app.use(verifyJwt)
  app.use('/model',require('./routes/api/model/models'))
  app.use('/editmodel',require('./routes/api/model/editemodel'))
  app.use('/getadminhost',require('./routes/api/model/hostforadmin'))
  app.use('/deletemodel',require('./routes/api/model/deletemodel'))
  app.use('/post',require('./routes/api/post/Post'))
  app.use('/comment',require('./routes/api/comment/Comment'))
  app.use('/like',require('./routes/api/like/Like'))
  app.use('/sharepost',require('./routes/api/share/share'))
  app.use('/editprofile',require('./routes/api/profile/Editprofile'))
  app.use('/editmoreprofile',require('./routes/api/Profilemore/editprofilemore'))
  app.use('/rejectmodel',require('./routes/api/model/rejectmodel'))
  app.use('/verifymodel',require('./routes/api/model/verifymodel'))
  app.use('/getcurrentchat',require('./routes/api/chat/getchat'))
  app.use('/getmsgnotify',require('./routes/api/chat/getmsgnotify'))
  app.use('/updatenotify',require('./routes/api/chat/updatenotify'))
  app.use('/bookhost',require('./routes/api/booking/book'))
  app.use('/pendingrequest',require('./routes/api/booking/getpendingbook'))
  app.use('/cancelrequest',require('./routes/api/booking/cancelmyrequest'))
  app.use('/notifymodel',require('./routes/api/booking/notifybooking'))
  app.use('/acceptbook',require('./routes/api/booking/acceptbooking'))
  app.use('/declinebook',require('./routes/api/booking/declinebooking'))
  app.use('/getrequeststats',require('./routes/api/booking/requeststat'))
  app.use('/paymodel',require('./routes/api/booking/paymodel'))
  app.use('/allrequest',require('./routes/api/booking/allrequestroute'))
  app.use('/reviewmodel',require('./routes/api/model/reviewmodel'))
  app.use('/getreviews',require('./routes/api/model/getmodelreview'))
  app.use('/deletereview',require('./routes/api/model/deletereview'))
  app.use('/gethistory',require('./routes/api/profile/get_history'))
  app.use('/getmonthlyhistory',require('./routes/api/profile/get_historyByMonth'))
  app.use('/giftmodel',require('./routes/api/chat/giftGold'))
  app.use('/topup',require('./routes/api/profile/topup'))
  app.use('/getallusers',require('./routes/api/Admin/getallusers'))
  app.use('/deleteuser',require('./routes/api/Admin/deleteuser'))
  app.use('/suspenduser',require('./routes/api/Admin/suspenduser'))
  app.use('/sendmessages',require('./routes/api/Admin/sendmessage'))
  app.use('/recivemessage',require('./routes/api/Admin/recivemessage'))
  app.use('/adminnotify',require('./routes/api/Admin/adminnotify'))
  app.use('/useredit',require('./routes/api/Profilemore/getuseredit'))
  app.use('/addcrush',require('./routes/api/model/addcrush'))
  app.use('/getcrush',require('./routes/api/model/getcrush'))
  app.use('/deleteMsg',require('./routes/api/Admin/deleteMsg'))
  app.use('/deletecrush',require('./routes/api/model/deletecrush'))




 
 
  mongoose.connection.once("open",()=>{
    console.log("Database connected")
      server.listen(PORT, () => {   
      console.log('listening on *:3500');
    });
  })
  
  // server.listen(PORT, () => {   
  //     console.log('listening on *:3500');
  //   });

  
  