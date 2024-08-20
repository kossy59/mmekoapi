require('dotenv').config()
const cookieParser = require('cookie-parser')
const credentials = require('./Middleware/credentials')
const corsOptions = require('./config/corsOptions')
const connect = require('./config/DBInitalizer')
const handleRefresh = require('./Middleware/refresh')
const verifyJwt = require('./Middleware/verify')
const checkuser = require('./utiils/useractive')
const userdisconnect = require('./utiils/userdisconnect')
const PORT = process.env.PORT || 3500
const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors')
app.use(cors());
const io = new Server(server, {
    cors: {origin:"http://localhost:3000", methods: ["GET", "POST"]},
});

app.use(credentials)

app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());

connect()


app.use('/', require('./routes/api/post/getpost'))

app.use('/getallpost',require('./routes/api/post/getpost'))
app.use('/getalluserpost',require('./routes/api/post/getalluserPost'))
app.use('/getallcomment',require('./routes/api/comment/Getallcomment'))
app.use('/getalllike',require('./routes/api/like/alllike'))
app.use('/getallsharepost',require('./routes/api/share/getallsharedpost'))
app.use('/getsharepost',require('./routes/api/share/getsharepost'))
app.use('/getprofile',require('./routes/api/profile/Profile'))
app.use('/getmoreprofile',require('./routes/api/Profilemore/getProfilemore'))


io.on('connection', (socket) => {
  socket.on('online',async (userid)=>{
    if(userid){
       
       await checkuser(userid)
       socket.id = userid
       console.log('a user connected '+ socket.id);
    }
  })

  socket.on('disconnect',async()=>{
   await userdisconnect(socket.id)
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
 

  


   
    server.listen(PORT, () => {
   
   
      console.log('listening on *:3500');
    });


  
  