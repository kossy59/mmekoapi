const cors = require('cors')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 3000
const express = require('express')
const app = express();
const http = require('http')
const server = http.createServer(app)
const {Server} = require('socket.io')
const io = new Server(server)


app.get('/',(req,res)=>{
    res.status(200).json({ok:" express mounted"})
})

io.on('connection', (socket) => {
    console.log('a user connected');
  });
  
  server.listen(PORT, () => {
    console.log('listening on *:3000');
  });