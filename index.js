const cors = require('cors')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 3500
const express = require('express')
const app = express();
const http = require('http')
const server = http.createServer(app)
const {Server} = require('socket.io')
const io = new Server(server)
const credentials = require('./middleware/credentials')
const corsOptions = require('./config/corsOptions')
const connect = require('./config/DBInitalizer')
const handleRefresh = require('./Middleware/refresh')
const verifyJwt = require('./middleware/verify')


connect();
app.use(credentials)
app.use(cors(corsOptions));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());



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
    console.log('a user connected');
  });

  app.use('/verifyemail',require('./routes/Auth/verifyEmail'))
  app.use('/register',require('./routes/Auth/register'))
  app.use('/logout',require('./routes/Auth/logout'))
  app.use('/login',require('./routes/Auth/login'))
  app.use('/forgetpassword',require('./routes/Auth/forgetpassword'))
  app.use('/completeregister',require('./routes/Auth/completeregister'))
  app.use('/comfirmpasscode',require('./routes/Auth/comfirmpasscode'))
  app.use('/changepassword',require('./routes/Auth/changepassword'))
  app.use(handleRefresh);

  app.use(verifyJwt)

  app.use('/post',require('./routes/api/post/Post'))
  app.use('/comment',require('./routes/api/comment/Comment'))
  app.use('/like',require('./routes/api/like/Like'))
  app.use('/sharepost',require('./routes/api/share/share'))
  app.use('/editprofile',require('./routes/api/profile/Editprofile'))
  app.use('/editmoreprofile',require('./routes/api/Profilemore/editprofilemore'))
 
  
  server.listen(PORT, () => {
   
   
    console.log('listening on *:3500');
  });