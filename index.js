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

const PORT = process.env.PORT || 3100;
const app = express();
const server = http.createServer(app);

// Define allowed origins for CORS
const allowedOrigins = [
  process.env.NEXT_PUBLIC_URL,
  "https://mmekowebsite.onrender.com",
  "https://mmekowebsite-eight.vercel.app",
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available to routes
app.set('io', io);

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
app.use("/exclusive", require("./routes/api/Exclusive/exclusive"));
app.use("/creators", require("./routes/api/creator/updateView"));
app.use("/creators", require("./routes/api/creator/updateFollowers"));
app.use("/allrequest", require("./routes/api/booking/allrequestroute"));
app.use("/exclusivecontent", require("./routes/api/Exclusive/allexclusive"));
app.use("/deleteaccount", require("./routes/api/profile/deleteprofile"));
app.use("/setting", require("./routes/api/profile/setting"));
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

//request
app.use("/request", require("./routes/api/requestcreator/requestRoutes"));
app.use("/upload-message-files", require("./routes/api/uploadMessageFiles"));
app.use("/quickchat", require("./routes/api/quickchat"));
// Socket.IO connection handling
io.on("connection", (socket) => {
  socket.on("online", async (userid) => {
    if (userid) {
      await checkuser(userid);
      await deletecallOffline(userid);
      socket.id = userid;
      IDS.userid = userid;
      socket.join("LiveChat");
    }
  });

  socket.on("message", async (newdata) => {
    
    try {
      let info = await MYID(newdata.fromid);
      
      const data = { ...newdata, ...info };
      await Livechats({ ...data });
      if (info) {
        await sendEmail(data.toid, `New message from ${info?.name}`);
        await pushnotify(
          data.toid,
          `New message from ${info?.name}`,
          "messageicon"
        );
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

  socket.on("disconnect", async () => {
    await userdisconnect(socket.id);
    await deletecallOffline(socket.id);
    socket.disconnect();
  });
  
  // Handle follow/unfollow events from clients
  socket.on('follow_update', (data) => {
    // Broadcast to all clients
    io.emit('follow_update', data);
  });
});

mongoose.connection.once("open", () => {
  console.log("✅ Database connected successfully");
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});
