require('dotenv').config()
const cookieParser = require('cookie-parser')
// const credentials = require('./Middleware/credentials')
// const corsOptions = require('./config/corsOptions')
const connect = require('./config/DBInitalizer')
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


const corsOptions = {
    credentials: true,
    origin: ['https://mmekosocial.onrender.com'] // Whitelist the domains you want to allow
};

app.use(cors(corsOptions));
//https://mmekosocial.onrender.com
//http://localhost:3000


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

         console.log(data);
         await Livechats(data)
         let info = await MYID(data.fromid)
         let name ;
         let photolink;
         if(info){
           name = info.name;
           photolink = info.photolink;
          
         }
      
         //socket.to("LiveChat").emit(data)
         socket.broadcast.emit("LiveChat",{name,photolink,data:data})
         

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
  app.use('/getverifymodel',require('./routes/api/model/getlivemodel'))
  app.use('/getcurrentchat',require('./routes/api/chat/getchat'))
  app.use('/getmsgnotify',require('./routes/api/chat/getmsgnotify'))
  app.use('/updatenotify',require('./routes/api/chat/updatenotify'))
 
 
    server.listen(PORT, () => {   
      console.log('listening on *:3500');
    });


  
  