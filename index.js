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
const {connectdatabase} = require('./config/connectDB.js')

//connect();
app.use(credentials)
app.use(cors(corsOptions));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());



app.get('/', async (req,res)=>{
  let data = await connectdatabase()
  console.log(data.databar)
  console.log(data.colid)
  console.log(data.dataid)
    res.status(200).json({ok:" express mounted"})
  

   
})



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
  

  io.on('connection', (socket) => {
    console.log('a user connected');
  });
  
  server.listen(PORT, () => {
   
   
    console.log('listening on *:3500');
  });