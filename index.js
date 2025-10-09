const express = require("express");
const http = require("http");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
const { setInterval } = require("timers");
const connect = require("./config/connectdataBase");
const handleRefresh = require("./Middleware/refresh");
const verifyJwt = require("./Middleware/verify");
const checkuser = require("./utiils/useractive");
const userdisconnect = require("./utiils/userdisconnect");
const Livechats = require("./utiils/createlivechat");
const getnotify = require("./utiils/getnotification");
let sendEmail = require("./utiils/sendEmailnot");
const MYID = require("./utiils/Getmyname");
let {
  Check_caller,
  deletebyClient,
  deletebyCallerid,
  check_connected,
  deletecallOffline,
} = require("./utiils/check_caller");
const pay_creator = require("./utiils/payclient_PCALL");
const updatebalance = require("./utiils/deductPVC");
const pushnotify = require("./utiils/sendPushnot");
const imageRoutes = require("./routes/imageRoutes");
const { scheduleMessageCleanup } = require("./utiils/deleteOldMessages");

const PORT = process.env.PORT || 3100;
const app = express();
const server = http.createServer(app);

// Define allowed origins for CORS
const allowedOrigins = [
  process.env.NEXT_PUBLIC_URL,
  "https://mmekowebsite.onrender.com",

  "https://mmekowebsite-eight.vercel.app", // Vercel deployment

  "http://localhost:3000", // Add localhost for development
].filter(Boolean); // Remove falsy values (e.g., undefined NEXT_PUBLIC_URL)

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl) or from allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || "*");
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Log requests for debugging
app.use((req, res, next) => {
  next();
});

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps) or from allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  // Additional production settings
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// Set the socket.io instance for utils
const { setSocketIO } = require('./utils/socket');
setSocketIO(io);

// Make io available to routes
app.set('io', io);

io.on("connection", (socket) => {
  socket.on("disconnect", (reason) => {
    // Handle disconnect
  });
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

connect();

const IDS = {};

// Routes
app.use("/api/image", imageRoutes);
app.use("/", require("./routes/api/post/Post"));
app.use("/getallpost", require("./routes/api/post/getpost"));
app.use("/getalluserpost", require("./routes/api/post/getalluserPost"));
app.use("/getallcomment", require("./routes/api/comment/Getallcomment"));
app.use("/getalllike", require("./routes/api/like/alllike"));
app.use("/like", require("./routes/api/like/getlikesbypost"));
app.use("/getallsharepost", require("./routes/api/share/getallsharedpost"));
app.use("/getsharepost", require("./routes/api/share/getsharepost"));
app.use("/getprofile", require("./routes/api/profile/Profile"));
app.use("/getmoreprofile", require("./routes/api/Profilemore/getProfilemore"));
app.use(
  "/messagenotification",
  require("./routes/api/chat/getNotificationmsg")
);
app.use("/notifycreator", require("./routes/api/booking/notifybooking"));
app.use("/subpushid", require("./routes/api/profile/postUserPushNote"));
app.use("/verifyemail", require("./routes/Auth/verifyEmail"));
app.use("/register", require("./routes/Auth/register"));
app.use("/logout", require("./routes/Auth/logout"));
app.use("/login", require("./routes/Auth/login"));
app.use("/forgetpassword", require("./routes/Auth/forgetpassword"));
app.use("/completeregister", require("./routes/Auth/completeregister"));
app.use("/comfirmpasscode", require("./routes/Auth/comfirmpasscode"));
app.use("/changepassword", require("./routes/Auth/changepassword"));
app.use("/getpostcomment", require("./routes/api/comment/Getallcomment"));
app.use("/getprofilebyid", require("./routes/api/profile/Profile"));
app.use("/getverifycreator", require("./routes/api/creator/getlivecreator"));
app.use("/getcreatorbyid", require("./routes/api/creator/getcreatorbyid"));
app.use("/searchuser", require("./routes/api/profile/getallUser"));
app.use("/post", require("./routes/api/post/Post"));
app.use("/creator/all", require("./routes/api/creator/mycreators"));
app.use("/addpayment", require("./routes/api/payment/payment.routes"));
app.use(
  "/withdraw-request",
  require("./routes/api/withdrawRequest/withdraw.route")
);
app.use(
  "/editmoreprofile",
  require("./routes/api/Profilemore/editprofilemore")
);
app.use("/creator", require("./routes/api/creator/creators"));
app.use("/editcreator", require("./routes/api/creator/editecreator"));
app.use("/postdocument", require("./routes/api/creator/postdocument"));
app.use("/getdocument", require("./routes/api/creator/getdocument"));
app.use("/rejectdocument", require("./routes/api/creator/rejectdocument"));
app.use("/exclusive", require("./routes/api/Exclusive/exclusive"));
app.use("/creators", require("./routes/api/creator/updateView"));
app.use("/creators", require("./routes/api/creator/updateFollowers"));
app.use("/allrequest", require("./routes/api/booking/allrequestroute"));
app.use("/exclusivecontent", require("./routes/api/Exclusive/allexclusive"));
app.use("/deleteaccount", require("./routes/api/profile/deleteprofile"));
app.use("/setting", require("./routes/api/profile/setting"));
app.use("/transaction_history", require("./routes/api/profile/transaction_history"));
app.use("/follow", require("./routes/api/follow/follower"));
app.use("/getfollowers", require("./routes/api/follow/get_followers"));
app.use("/getadminhost", require("./routes/api/creator/hostforadmin"));
app.use("/deletecreator", require("./routes/api/creator/deletecreator"));
app.use("/comment", require("./routes/api/comment/Comment"));
app.use("/like", require("./routes/api/like/Like"));
app.use("/sharepost", require("./routes/api/share/share"));
app.use("/editprofile", require("./routes/api/profile/Editprofile"));
app.use("/checkusername", require("./routes/api/profile/checkusername"));
app.use("/rejectcreator", require("./routes/api/creator/rejectcreator"));
app.use("/verifycreator", require("./routes/api/creator/verifycreator"));
app.use("/getcurrentchat", require("./routes/api/chat/getchat"));
app.use("/getmsgnotify", require("./routes/api/chat/getmsgnotify"));
app.use("/updatenotify", require("./routes/api/chat/updatenotify"));
app.use("/bookhost", require("./routes/api/booking/book"));
app.use("/pendingrequest", require("./routes/api/booking/getpendingbook"));
app.use("/cancelrequest", require("./routes/api/booking/cancelmyrequest"));
app.use("/acceptbook", require("./routes/api/booking/acceptbooking"));
app.use("/declinebook", require("./routes/api/booking/declinebooking"));
app.use("/getrequeststats", require("./routes/api/booking/requeststat"));
app.use("/paycreator", require("./routes/api/booking/paycreator"));
app.use("/completebook", require("./routes/api/booking/completebook"));
app.use("/getallfanmeetrequests", require("./routes/api/booking/getAllFanMeetRequests"));
app.use("/reviewcreator", require("./routes/api/creator/reviewcreator"));
app.use("/getreviews", require("./routes/api/creator/getcreatorreview"));
app.use("/deletereview", require("./routes/api/creator/deletereview"));
app.use("/statistics", require("./routes/api/profile/get_statistics"));
app.use(
  "/statistics/monthly",
  require("./routes/api/profile/get_statisticsByMonth")
);
app.use("/giftcreator", require("./routes/api/chat/giftGold"));
app.use("/topup", require("./routes/api/profile/topup"));
app.use("/getallusers", require("./routes/api/Admin/getallusers"));
app.use("/deleteuser", require("./routes/api/Admin/deleteuser"));
app.use("/suspenduser", require("./routes/api/Admin/suspenduser"));
app.use("/sendmessages", require("./routes/api/Admin/sendmessage"));
app.use("/recivemessage", require("./routes/api/Admin/recivemessage"));
app.use("/adminnotify", require("./routes/api/Admin/adminnotify"));
app.use("/useredit", require("./routes/api/Profilemore/getuseredit"));
app.use("/addcrush", require("./routes/api/creator/addcrush"));
app.use("/getcrush", require("./routes/api/creator/getcrush"));
app.use("/deleteMsg", require("./routes/api/Admin/deleteMsg"));
app.use("/deletecrush", require("./routes/api/creator/deletecrush"));
app.use("/checkdocumentstatus", require("./routes/api/creator/checkDocumentStatus"));
app.use("/notifications", require("./routes/api/Notifications/notificationRoutes"));

// Block user functionality
app.use("/block", require("./routes/api/block/blockUser"));

// VIP functionality
app.use("/vip", require("./routes/api/VIP/upgrade"));

//request
app.use("/request", require("./routes/api/requestcreator/requestRoutes"));
app.use("/upload-message-files", require("./routes/api/uploadMessageFiles"));
app.use("/quickchat", require("./routes/api/quickchat"));
app.use("/fanmeet", require("./routes/api/fanMeetRoutes"));
app.use("/process-expired", require("./routes/api/processExpired"));
app.use("/video-call", require("./routes/api/videoCall/videoCallRoutes"));
// Track online users
const onlineUsers = new Set();

// Track connected sockets to prevent duplicate connections
const connectedSockets = new Map();

// Track disconnection times for grace period (development mode)
const disconnectionTimes = new Map();
const DISCONNECTION_GRACE_PERIOD = 10000; // 10 seconds grace period

// Track user activity to handle rapid reconnections
const userActivity = new Map();
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Cleanup inactive users periodically (TEMPORARILY DISABLED for debugging)

// TODO: Re-enable cleanup in production
// if (process.env.NODE_ENV !== 'development') {
//   setInterval(() => {
//     const now = Date.now();
//     const inactiveUsers = [];
//     
//     for (const [userid, lastActivity] of userActivity.entries()) {
//       // Only remove if user is truly inactive (no activity for 2+ minutes) AND not in grace period
//       const isInGracePeriod = disconnectionTimes.has(userid);
//       const isInactive = now - lastActivity > HEARTBEAT_INTERVAL * 4; // 2 minutes
//       
//       if (isInactive && !isInGracePeriod) {
//         inactiveUsers.push(userid);
//       }
//     }
//     
//     // Remove inactive users
//     inactiveUsers.forEach(userid => {
//       console.log(`🔍 [Socket] Removing inactive user ${userid}`);
//       onlineUsers.delete(userid);
//       userActivity.delete(userid);
//       disconnectionTimes.delete(userid);
//       connectedSockets.delete(userid);
//       io.emit('user_offline', userid);
//     });
//   }, HEARTBEAT_INTERVAL);
// }


// Socket.IO connection handling
io.on("connection", (socket) => {
  socket.on("online", async (userid) => {
    if (userid) {
      console.log('🔍 [Socket] User going online:', userid, 'Type:', typeof userid);
      
      // Check if this user already has a connected socket
      const existingSocket = connectedSockets.get(userid);
      if (existingSocket && existingSocket.connected) {
        console.log('🔍 [Socket] User already has connected socket, skipping');
        return;
      }
      
      await checkuser(userid);
      await deletecallOffline(userid);
      socket.id = userid;
      socket.userId = userid; // Store user ID in socket for WebRTC signaling
      IDS.userid = userid;
      socket.join("LiveChat");
      
      // Track this socket for this user
      connectedSockets.set(userid, socket);
      
      // If user was in grace period, cancel the removal
      if (disconnectionTimes.has(userid)) {
        disconnectionTimes.delete(userid);
      }
      
      // Update user activity
      userActivity.set(userid, Date.now());
      
      // Check if user was already online
      const wasAlreadyOnline = onlineUsers.has(userid);
      
      // Add user to online users set
      onlineUsers.add(userid);
      console.log('🔍 [Socket] Added user to onlineUsers:', userid);
      console.log('🔍 [Socket] Current online users:', Array.from(onlineUsers));
      
      // ----------------------------------------------------
      // **Part A: Send the FULL list ONLY to the NEW user**
      // ----------------------------------------------------
      // Get the list of users *excluding* the one who just connected
      const currentOnlineUsers = Array.from(onlineUsers).filter(id => id !== userid);
      socket.emit('ONLINE_USERS_LIST', currentOnlineUsers);
      
      // ----------------------------------------------------
      // **Part B: Notify ALL *other* users about the NEW user**
      // ----------------------------------------------------
      // Send the single new user to everyone *except* the new user (only if user wasn't already online)
      if (!wasAlreadyOnline) {
        socket.broadcast.emit('USER_CONNECTED', userid);
      }
    }
  });

  socket.on("message", async (newdata) => {
    
    try {
      // Validate incoming message data
      if (!newdata || !newdata.fromid || !newdata.toid) {
        console.log("❌ [SOCKET] Invalid message data:", newdata);
        return;
      }

      if (newdata.fromid === 'undefined' || newdata.toid === 'undefined' || 
          newdata.fromid === 'null' || newdata.toid === 'null') {
        console.log("❌ [SOCKET] Message contains undefined/null IDs:", newdata);
        return;
      }

      let info = await MYID(newdata.fromid);
      
      const data = { ...newdata, ...info };
      await Livechats({ ...data });
      if (info && data.toid && data.toid !== 'undefined' && data.toid !== 'null' && typeof data.toid === 'string' && data.toid.length === 24) {
        await sendEmail(data.toid, `New message from ${info?.name}`);
        await pushnotify(
          data.toid,
          `New message from ${info?.name}`,
          "messageicon"
        );
      } else {
        console.log("⚠️ [SOCKET] Invalid toid for email notification:", data.toid);
      }
      
      socket.broadcast.emit("LiveChat", {
        name: info?.name,
        photolink: info?.photolink || "",
        data: data,
      });
      
    } catch (error) {
      console.error("❌ [BACKEND] Error processing message:", error);
    }
  });

  socket.on("videocall", async (data, arkFunction) => {
    let myid = data.caller_id;
    let answerid = data.answer_id;
    let video_user = data.my_id;
    let callname = data.name;

    let calloffer = [];

    if (myid === video_user) {
      let responds = await Check_caller(answerid, myid);

      if (data.answer_message === "reject") {
        await deletebyClient(myid);
        data.message = "call ended";
        data.answer_message = "reject";
        socket.broadcast.emit(answerid, { data: data });
      } else if (responds === "store_sdb") {
        if (data.offer_can) {
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });
        }
      } else if (responds === "calling") {
        data.answer_message = "calling";
        data.message = `incomming call ${callname}`;
        if (data.sdp_c_offer) {
          let info = calloffer.find((value) => {
            return (
              value.callerid === data.caller_id &&
              value.answerid === data.answer_id
            );
          });
          if (!info) {
            let datas = {
              callerid: data.caller_id,
              answerid: data.answer_id,
              sdp_c_offer: data.sdp_c_offer,
            };

            calloffer.push(datas);
          }
        }

        if (data.offer_can) {
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });

          socket.broadcast.emit(`${answerid}_offer`, data.offer_can);
        }
        socket.broadcast.emit(answerid, { data: data });
      } else if (responds === "user_busy") {
        data.answer_message = "user busy";
        socket.broadcast.emit(myid, { data: data });
      } else if (responds === "store_sdb") {
        socket.broadcast.emit(answerid, { data: data });
      }
    }

    if (answerid === video_user) {
      let responds = await check_connected(answerid);
      if (data.answer_message === "reject") {
        await deletebyCallerid(answerid);
        data.answer_message = "reject";
        socket.broadcast.emit(myid, { data: data });
      } else if (responds === false) {

        if (data.sdp_a_offer && data.answer_can) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            sdp: data.sdp_a_offer,
            offer: data.answer_can,
          });
        }

        socket.broadcast.emit(myid, { data: data });
      } else if (responds === true) {

        if (data.answer_can) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            offer: data.answer_can,
          });
        }

        socket.broadcast.emit(myid, { data: data });
      }
    }
  });

  socket.on("privatecall", async (data, arkFunction) => {
    let myid = data.caller_id;
    let answerid = data.answer_id;
    let video_user = data.my_id;
    let callname = data.name;

    let calloffer = [];

    if (myid === video_user) {
      let responds = await Check_caller(answerid, myid);

      if (data.amount) {
        if (parseFloat(data.amount) > 0) {
          await pay_creator(data.fromid, data.toid, data.amount);
          await updatebalance(
            data.fromid,
            data.toid,
            data.balance,
            data.amount
          );
          socket.broadcast.emit(`pvc_${data.toid}_amount`, {
            amount: data.amount,
          });
          data.amount = "";
        }
      }

      if (data.answer_message === "reject") {
        await deletebyClient(myid);
        data.message = "call ended";
        data.answer_message = "reject";
        socket.broadcast.emit(`${answerid}_reject`, { data: "reject" });
        socket.broadcast.emit(answerid, { data: data });
      } else if (responds === "store_sdb") {
        if (data.offer_can) {
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });
        }
      } else if (responds === "calling") {
        data.answer_message = "calling";
        data.message = `private show ${callname}`;
        if (data.sdp_c_offer) {
          let info = calloffer.find((value) => {
            return (
              value.callerid === data.caller_id &&
              value.answerid === data.answer_id
            );
          });
          if (!info) {
            let datas = {
              callerid: data.caller_id,
              answerid: data.answer_id,
              sdp_c_offer: data.sdp_c_offer,
            };

            calloffer.push(datas);
          }
        }

        if (data.offer_can) {
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });

          socket.broadcast.emit(`${answerid}_offer`, data.offer_can);
        }
        socket.broadcast.emit(answerid, { data: data });
      } else if (responds === "user_busy") {
        data.answer_message = "user busy";
        socket.broadcast.emit(myid, { data: data });
      } else if (responds === "store_sdb") {
        socket.broadcast.emit(answerid, { data: data });
      }
    }

    if (answerid === video_user) {
      let responds = await check_connected(answerid);
      if (data.answer_message === "reject") {
        await deletebyCallerid(answerid);
        data.answer_message = "reject";
        socket.broadcast.emit(`${myid}_reject`, { data: "reject" });
        socket.broadcast.emit(myid, { data: data });
      } else if (responds === false) {

        if (data.sdp_a_offer && data.answer_can) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            sdp: data.sdp_a_offer,
            offer: data.answer_can,
          });
        }

        socket.broadcast.emit(myid, { data: data });
      } else if (responds === true) {

        if (data.sdp_a_offer) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            sdp: data.sdp_a_offer,
            offer: "",
          });
        }

        if (data.answer_can) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            offer: data.answer_can,
          });
        }

        socket.broadcast.emit(myid, { data: data });
      }
    }
  });

  socket.on("offline", async (userid) => {
    if (userid) {
      // Remove user from online users set
      onlineUsers.delete(userid);
      
      // Remove from connected sockets
      connectedSockets.delete(userid);
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', userid);
      
      // Clean up user data
      await userdisconnect(userid);
      await deletecallOffline(userid);
    }
  });

  socket.on("disconnect", async () => {
    // Broadcast user offline status before disconnecting
    if (socket.id && IDS.userid) {
      // Always use grace period for better user experience
      disconnectionTimes.set(IDS.userid, Date.now());
      
      // Set timeout to actually remove user after grace period
      setTimeout(() => {
        if (disconnectionTimes.has(IDS.userid)) {
          const disconnectTime = disconnectionTimes.get(IDS.userid);
          const timeSinceDisconnect = Date.now() - disconnectTime;
          
          // Only remove if user hasn't reconnected within grace period
          if (timeSinceDisconnect >= DISCONNECTION_GRACE_PERIOD) {
            onlineUsers.delete(IDS.userid);
            disconnectionTimes.delete(IDS.userid);
            userActivity.delete(IDS.userid);
            socket.broadcast.emit('user_offline', IDS.userid);
          }
        }
      }, DISCONNECTION_GRACE_PERIOD);
      
      // Remove from connected sockets
      connectedSockets.delete(IDS.userid);
    }
    
    await userdisconnect(socket.id);
    await deletecallOffline(socket.id);
    socket.disconnect();
  });
  
  // Handle heartbeat to keep users online
  socket.on('heartbeat', (userid) => {
    if (userid) {
      console.log('💓 [Socket] Heartbeat received from:', userid);
      userActivity.set(userid, Date.now());
      
      // Ensure user stays in onlineUsers set
      if (!onlineUsers.has(userid)) {
        console.log('💓 [Socket] Re-adding user to onlineUsers:', userid);
        onlineUsers.add(userid);
      }
      
      // Cancel any pending disconnection
      if (disconnectionTimes.has(userid)) {
        console.log('💓 [Socket] Cancelling disconnection for:', userid);
        disconnectionTimes.delete(userid);
      }
    }
  });

  // Handle follow/unfollow events from clients
  socket.on('follow_update', (data) => {
    // Broadcast to all clients
    io.emit('follow_update', data);
  });

  // Online status and typing indicators
  socket.on('join_user_room', (data) => {
    if (data.userId) {
      socket.join(`user_${data.userId}`);
    }
  });

  socket.on('leave_user_room', (data) => {
    if (data.userId) {
      socket.leave(`user_${data.userId}`);
    }
  });

  socket.on('typing_start', (data) => {
    if (data.fromUserId && data.toUserId) {
      // Send typing indicator to the target user
      socket.to(`user_${data.toUserId}`).emit('typing_start', {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId
      });
    }
  });

  socket.on('typing_stop', (data) => {
    if (data.fromUserId && data.toUserId) {
      // Send typing stop indicator to the target user
      socket.to(`user_${data.toUserId}`).emit('typing_stop', {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId
      });
    }
  });

  // Video call events
  socket.on('video_call_start', async (data) => {
    try {
      const { callerId, callerName, answererId, answererName } = data;
      
      console.log('🔍 [Video Call] Starting call:', { callerId, answererId });
      console.log('🔍 [Video Call] Online users:', Array.from(onlineUsers));
      
      // Check if answererId is a creator ID (host ID) and find the actual user ID
      let actualAnswererId = answererId;
      
      // Try to find the creator's user ID from their creator ID (which is the creator's _id)
      try {
        const creatordb = require('./Creators/creators');
        console.log('🔍 [Video Call] Looking up creator with _id:', answererId);
        const creator = await creatordb.findOne({ _id: answererId }).exec();
        console.log('🔍 [Video Call] Creator lookup result:', creator);
        
        if (creator && creator.userid) {
          actualAnswererId = creator.userid;
          console.log('✅ [Video Call] Found creator user ID:', actualAnswererId, 'for creator ID:', answererId);
        } else {
          console.log('❌ [Video Call] Creator not found or no userid, using original ID:', answererId);
        }
      } catch (error) {
        console.log('❌ [Video Call] Error looking up creator:', error.message);
        console.log('🔍 [Video Call] Using original ID:', answererId);
      }
      
      console.log('🔍 [Video Call] Checking online status for user ID:', actualAnswererId);
      console.log('🔍 [Video Call] Is answerer online?', onlineUsers.has(actualAnswererId));
      
      // Check if answerer is online - try multiple ID formats
      const isOnline = onlineUsers.has(actualAnswererId) || 
                      onlineUsers.has(actualAnswererId.toString()) ||
                      Array.from(onlineUsers).some(id => id.toString() === actualAnswererId.toString());
      
      // Additional check: see if user has a connected socket
      const hasConnectedSocket = connectedSockets.has(actualAnswererId) || 
                                connectedSockets.has(actualAnswererId.toString()) ||
                                Array.from(connectedSockets.keys()).some(id => id.toString() === actualAnswererId.toString());
      
      if (!isOnline && !hasConnectedSocket) {
        console.log('❌ [Video Call] User not online:', actualAnswererId);
        console.log('❌ [Video Call] Online users:', Array.from(onlineUsers));
        console.log('❌ [Video Call] Connected sockets:', Array.from(connectedSockets.keys()));
        
        // TEMPORARY: Allow video calls even if user appears offline (for debugging)
        console.log('⚠️ [Video Call] TEMPORARY: Allowing call despite offline status');
        // socket.emit('video_call_error', {
        //   message: 'User is not online'
        // });
        // return;
      }
      
      // If user has connected socket but not in onlineUsers, add them
      if (!isOnline && hasConnectedSocket) {
        console.log('🔧 [Video Call] User has socket but not in onlineUsers, adding:', actualAnswererId);
        onlineUsers.add(actualAnswererId);
      }

      // Create call record
      const videocalldb = require('./Creators/videoalldb');
      const callData = {
        callerid: actualAnswererId, // Use the actual user ID
        clientid: callerId,
        connected: false,
        waiting: "wait",
        callerName: callerName,
        answererName: answererName,
        createdAt: new Date()
      };

      const call = await videocalldb.create(callData);

      // Emit call notification to answerer using their actual user ID
      socket.to(`user_${actualAnswererId}`).emit('video_call_incoming', {
        callId: call._id,
        callerId: callerId,
        callerName: callerName,
        isIncoming: true
      });
      
      console.log('📞 [Video Call] Call notification sent to user:', actualAnswererId);

    } catch (error) {
      console.error('Error in video_call_start:', error);
      socket.emit('video_call_error', {
        message: 'Failed to start call'
      });
    }
  });

  socket.on('video_call_accept', async (data) => {
    try {
      const { callId, callerId, answererId } = data;
      
      const videocalldb = require('./Creators/videoalldb');
      const call = await videocalldb.findOne({ _id: callId }).exec();
      
      if (call) {
        call.connected = true;
        call.waiting = "connected";
        await call.save();

        // Emit call accepted to caller
        socket.to(`user_${callerId}`).emit('video_call_accepted', {
          callId: callId,
          callerId: callerId,
          answererId: answererId
        });
        
        console.log('✅ [Video Call] Call accepted, notification sent to caller:', callerId);
      }
    } catch (error) {
      console.error('Error in video_call_accept:', error);
    }
  });

  socket.on('video_call_decline', async (data) => {
    try {
      const { callId, callerId, answererId } = data;
      
      const videocalldb = require('./Creators/videoalldb');
      await videocalldb.deleteOne({ _id: callId }).exec();

      // Emit call declined to caller
      socket.to(`user_${callerId}`).emit('video_call_declined', {
        callId: callId,
        callerId: callerId,
        answererId: answererId
      });
      
      console.log('❌ [Video Call] Call declined, notification sent to caller:', callerId);
    } catch (error) {
      console.error('Error in video_call_decline:', error);
    }
  });

  socket.on('video_call_end', async (data) => {
    try {
      const { callId, userId } = data;
      
      // Skip database operations for temporary call IDs
      if (callId && callId.startsWith('temp_')) {
        console.log('📹 [WebRTC] Ending temporary call:', callId);
        // Just emit the event without database operations
        socket.to(`user_${userId}`).emit('video_call_ended', {
          callId: callId,
          endedBy: userId
        });
        return;
      }
      
      const videocalldb = require('./Creators/videoalldb');
      const call = await videocalldb.findOne({ _id: callId }).exec();
      
      if (call) {
        const otherUserId = call.callerid === userId ? call.clientid : call.callerid;
        
        // Delete call record
        await videocalldb.deleteOne({ _id: callId }).exec();

        // Emit call ended to both participants
        socket.to(`user_${userId}`).emit('video_call_ended', {
          callId: callId,
          endedBy: userId
        });
        
        socket.to(`user_${otherUserId}`).emit('video_call_ended', {
          callId: callId,
          endedBy: userId
        });
        
        console.log('📞 [Video Call] Call ended, notifications sent to users:', userId, 'and', otherUserId);
      }
    } catch (error) {
      console.error('Error in video_call_end:', error);
    }
  });

  // WebRTC signaling events
  socket.on('video_call_offer', async (data) => {
    const { callId, offer } = data;
    console.log('📹 [WebRTC] Received offer for call:', callId);
    
    try {
      // If it's a temporary call ID, broadcast to all users (fallback)
      if (callId.startsWith('temp_')) {
        console.log('📹 [WebRTC] Temporary call ID, broadcasting offer');
        socket.broadcast.emit('video_call_offer', {
          callId: callId,
          offer: offer
        });
        return;
      }
      
      // Find the call to get the other participant
      const videocalldb = require('./Creators/videoalldb');
      const call = await videocalldb.findOne({ _id: callId }).exec();
      
      if (call) {
        // Get the current user ID from the socket
        const currentUserId = socket.userId || socket.id;
        const otherUserId = call.callerid === currentUserId ? call.clientid : call.callerid;
        console.log('📹 [WebRTC] Forwarding offer to user:', otherUserId);
        
        // Forward offer to the other participant
        socket.to(`user_${otherUserId}`).emit('video_call_offer', {
          callId: callId,
          offer: offer
        });
      }
    } catch (error) {
      console.error('❌ [WebRTC] Error forwarding offer:', error);
    }
  });

  socket.on('video_call_answer', async (data) => {
    const { callId, answer } = data;
    console.log('📹 [WebRTC] Received answer for call:', callId);
    
    try {
      // If it's a temporary call ID, broadcast to all users (fallback)
      if (callId.startsWith('temp_')) {
        console.log('📹 [WebRTC] Temporary call ID, broadcasting answer');
        socket.broadcast.emit('video_call_answer', {
          callId: callId,
          answer: answer
        });
        return;
      }
      
      // Find the call to get the other participant
      const videocalldb = require('./Creators/videoalldb');
      const call = await videocalldb.findOne({ _id: callId }).exec();
      
      if (call) {
        // Get the current user ID from the socket
        const currentUserId = socket.userId || socket.id;
        const otherUserId = call.callerid === currentUserId ? call.clientid : call.callerid;
        console.log('📹 [WebRTC] Forwarding answer to user:', otherUserId);
        
        // Forward answer to the other participant
        socket.to(`user_${otherUserId}`).emit('video_call_answer', {
          callId: callId,
          answer: answer
        });
      }
    } catch (error) {
      console.error('❌ [WebRTC] Error forwarding answer:', error);
    }
  });

  socket.on('video_call_ice_candidate', async (data) => {
    const { callId, candidate } = data;
    console.log('📹 [WebRTC] Received ICE candidate for call:', callId);
    
    try {
      // If it's a temporary call ID, broadcast to all users (fallback)
      if (callId.startsWith('temp_')) {
        console.log('📹 [WebRTC] Temporary call ID, broadcasting ICE candidate');
        socket.broadcast.emit('video_call_ice_candidate', {
          callId: callId,
          candidate: candidate
        });
        return;
      }
      
      // Find the call to get the other participant
      const videocalldb = require('./Creators/videoalldb');
      const call = await videocalldb.findOne({ _id: callId }).exec();
      
      if (call) {
        // Get the current user ID from the socket
        const currentUserId = socket.userId || socket.id;
        const otherUserId = call.callerid === currentUserId ? call.clientid : call.callerid;
        console.log('📹 [WebRTC] Forwarding ICE candidate to user:', otherUserId);
        
        // Forward ICE candidate to the other participant
        socket.to(`user_${otherUserId}`).emit('video_call_ice_candidate', {
          callId: callId,
          candidate: candidate
        });
      }
    } catch (error) {
      console.error('❌ [WebRTC] Error forwarding ICE candidate:', error);
    }
  });
});

mongoose.connection.once("open", () => {
  console.log("✅ Database connected successfully");
  
  // Start message cleanup scheduler
  scheduleMessageCleanup();
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});
