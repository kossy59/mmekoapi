const express = require("express");
const http = require("http");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
const { setInterval } = require("timers");
// const credentials = require('./Middleware/credentials')
// const corsOptions = require('./config/corsOptions')
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
const pay_model = require("./utiils/payclient_PCALL");
const updatebalance = require("./utiils/deductPVC");
const pushnotify = require("./utiils/sendPushnot");
const imageRoutes = require("./routes/imageRoutes");


const PORT = process.env.PORT || 3100;
const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://mmeko.com",
    "https://mmekowebsite.onrender.com",
  ], // Whitelist the domains you want to allow
   credentials: true,
};
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://mmekoapi.onrender.com",
  "https://mmeko.com",
  "https://mmekowebsite.onrender.com",
];

app.use(cors(corsOptions));
// app.use((req,res, next)=>{
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.setHeader("Access-Control-Allow-Credentials", true);
//     res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE")
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type")
//   }
//   next()
// })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

connect();

const IDS = {};
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Handle URL-encoded data
app.use(express.json({ limit: "10mb" })); // Handle JSON data

// Routes
app.use("/api/image", imageRoutes);
app.use("/", require("./routes/api/post/Post"));

app.use("/getallpost", require("./routes/api/post/getpost"));
app.use("/getalluserpost", require("./routes/api/post/getalluserPost"));
app.use("/getallcomment", require("./routes/api/comment/Getallcomment"));
app.use("/getalllike", require("./routes/api/like/alllike"));
app.use("/getallsharepost", require("./routes/api/share/getallsharedpost"));
app.use("/getsharepost", require("./routes/api/share/getsharepost"));
app.use("/getprofile", require("./routes/api/profile/Profile"));
app.use("/getmoreprofile", require("./routes/api/Profilemore/getProfilemore"));
app.use(
  "/messagenotification",
  require("./routes/api/chat/getNotificationmsg")
);
app.use("/notifymodel", require("./routes/api/booking/notifybooking"));
app.use("/subpushid", require("./routes/api/profile/postUserPushNote"));

io.on("connection", (socket) => {
  socket.on("online", async (userid) => {
    if (userid) {
      await checkuser(userid);
      await deletecallOffline(userid);
      socket.id = userid;
      IDS.userid = userid;
      console.log("a user connected " + socket.id);
      socket.join("LiveChat");
    }
  });

  socket.on("message", async (newdata) => {
    let info = await MYID(newdata.fromid);
    const data = { ...newdata, ...info };

    console.log("1");

    await Livechats({ ...data });

    console.log(data);

    console.log("2");

    if (info) {
      console.log(info);
      await sendEmail(data.toid, `New message from ${info?.name}`);
      await pushnotify(
        data.toid,
        `New message from ${info?.name}`,
        "messageicon"
      );
      // console.log("name "+name+" photolink "+photolink)
    }
    console.log("3");
    //socket.to("LiveChat").emit(data)
    socket.broadcast.emit("LiveChat", {
      name: info?.name,
      photolink: info?.photolink || "",
      data: data,
    });
  });

  socket.on("videocall", async (data, arkFunction) => {
    let myid = data.caller_id;
    let answerid = data.answer_id;
    let video_user = data.my_id;
    let callname = data.name;

    let calloffer = [];

    // set caller socket

    if (myid === video_user) {
      let responds = await Check_caller(answerid, myid);

      if (data.answer_message === "reject") {
        await deletebyClient(myid);
        data.message = "call ended";
        data.answer_message = "reject";
        socket.broadcast.emit(answerid, { data: data });
      } else if (responds === "store_sdb") {
        if (data.offer_can) {
          console.log("we got offer can");
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });
        }
      } else if (responds === "calling") {
        data.answer_message = "calling";
        data.message = `incomming call ${callname}`;
        console.log("calling user " + data.sdp_c_offer);
        if (data.sdp_c_offer) {
          let info = calloffer.find((value) => {
            return (
              value.callerid === data.caller_id &&
              value.answerid === data.answer_id
            );
          });
          if (!info) {
            console.log(" string offer sdp user");
            let datas = {
              callerid: data.caller_id,
              answerid: data.answer_id,
              sdp_c_offer: data.sdp_c_offer,
            };

            calloffer.push(datas);
          }
        }

        if (data.offer_can) {
          console.log("sending offer can");
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });

          socket.broadcast.emit(`${answerid}_offer`, data.offer_can);

          //  let info = calloffer.find(value=>{
          //   return value.callerid === data.caller_id && value.answerid === data.answer_id
          // })
          // if(!info){
          //   let datas = {
          //   callerid : data.caller_id,
          //   answerid : data.answer_id,
          //   answer_can : data.offer_can
          // }

          // calloffer.push(datas)

          // }
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
        console.log("inside anser reject test " + data.answer_message);
        await deletebyCallerid(answerid);
        data.answer_message = "reject";
        socket.broadcast.emit(myid, { data: data });
      } else if (responds === false) {
        console.log("answer sdp " + data.sdp_a_offer);
        console.log("answer sdp " + data.answer_can);

        // let datas = calloffer.find(value=>{
        //    return value.callerid === data.caller_id && value.answerid === data.answer_id

        // })

        // if(datas){
        //  if(datas.sdp_c_offer){

        //   console.log("sending offer sdp")
        //   let info = {
        //   sdp_c_offer : datas.sdp_c_offer

        //  }
        //   arkFunction(info)

        //  }

        // }

        if (data.sdp_a_offer && data.answer_can) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            sdp: data.sdp_a_offer,
            offer: data.answer_can,
          });
        }

        // if(data.answer_can){
        //   let offer = data.answer_can

        //   socket.broadcast.emit(`${myid}_answerice`,data.answer_can)

        // }

        socket.broadcast.emit(myid, { data: data });
      } else if (responds === true) {
        console.log("answer sdp " + data.sdp_a_offer);
        console.log("answer sdp " + data.answer_can);

        //  let datas = calloffer.find(value=>{
        //    return value.callerid === data.caller_id && value.answerid === data.answer_id

        // })

        // if(datas){
        //  if(datas.sdp_c_offer){
        //   console.log("sending offer sdp")

        //   let info = {
        //   sdp_c_offer : datas.sdp_c_offer

        //  }
        //   arkFunction(info)

        //  }

        // }
        // if(data.sdp_a_offer){

        //    socket.broadcast.emit(`${myid}_answeroffer`,{sdp:data.sdp_a_offer,offer:""})

        // }

        if (data.answer_can) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            offer: data.answer_can,
          });
        }

        // if(data.answer_can){
        //   console.log("sending  answer ice can offer")
        //   let offer = data.answer_can
        //   socket.broadcast.emit(`${myid}_answerice`,offer)

        // }
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

    // set caller socket

    if (myid === video_user) {
      let responds = await Check_caller(answerid, myid);

      if (data.amount) {
        console.log("sending amount");
        if (parseFloat(data.amount) > 0) {
          await pay_model(data.fromid, data.toid, data.amount);
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
        console.log("sending caller reject");
        socket.broadcast.emit(`${answerid}_reject`, { data: "reject" });
        socket.broadcast.emit(answerid, { data: data });
      } else if (responds === "store_sdb") {
        if (data.offer_can) {
          console.log("we got offer can");
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });
        }
      } else if (responds === "calling") {
        data.answer_message = "calling";
        data.message = `private show ${callname}`;
        //console.log("calling user "+data.sdp_c_offer)
        if (data.sdp_c_offer) {
          let info = calloffer.find((value) => {
            return (
              value.callerid === data.caller_id &&
              value.answerid === data.answer_id
            );
          });
          if (!info) {
            console.log(" string offer sdp user");
            let datas = {
              callerid: data.caller_id,
              answerid: data.answer_id,
              sdp_c_offer: data.sdp_c_offer,
            };

            calloffer.push(datas);
          }
        }

        if (data.offer_can) {
          console.log("sending offer can");
          socket.broadcast.emit(`${answerid}_calloffer`, {
            offer: data.offer_can,
          });

          socket.broadcast.emit(`${answerid}_offer`, data.offer_can);

          //  let info = calloffer.find(value=>{
          //   return value.callerid === data.caller_id && value.answerid === data.answer_id
          // })
          // if(!info){
          //   let datas = {
          //   callerid : data.caller_id,
          //   answerid : data.answer_id,
          //   answer_can : data.offer_can
          // }

          // calloffer.push(datas)

          // }
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
      console.log("answer values ");
      let responds = await check_connected(answerid);
      if (data.answer_message === "reject") {
        console.log("inside anser reject test " + data.answer_message);
        await deletebyCallerid(answerid);
        data.answer_message = "reject";
        console.log("sending aner reject");
        socket.broadcast.emit(`${myid}_reject`, { data: "reject" });
        socket.broadcast.emit(myid, { data: data });
      } else if (responds === false) {
        console.log("answer sdp " + data.sdp_a_offer);
        console.log("answer sdp " + data.answer_can);

        // let datas = calloffer.find(value=>{
        //    return value.callerid === data.caller_id && value.answerid === data.answer_id

        // })

        // if(datas){
        //  if(datas.sdp_c_offer){

        //   console.log("sending offer sdp")
        //   let info = {
        //   sdp_c_offer : datas.sdp_c_offer

        //  }
        //   arkFunction(info)

        //  }

        // }

        if (data.sdp_a_offer && data.answer_can) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            sdp: data.sdp_a_offer,
            offer: data.answer_can,
          });
        }

        // if(data.answer_can){
        //   let offer = data.answer_can

        //   socket.broadcast.emit(`${myid}_answerice`,data.answer_can)

        // }

        socket.broadcast.emit(myid, { data: data });
      } else if (responds === true) {
        console.log("answer sdp " + data.sdp_a_offer);
        console.log("answer sdp " + data.answer_can);

        //  let datas = calloffer.find(value=>{
        //    return value.callerid === data.caller_id && value.answerid === data.answer_id

        // })

        // if(datas){
        //  if(datas.sdp_c_offer){
        //   console.log("sending offer sdp")

        //   let info = {
        //   sdp_c_offer : datas.sdp_c_offer

        //  }
        //   arkFunction(info)

        //  }

        // }
        if (data.sdp_a_offer) {
          socket.broadcast.emit(`${myid}_answeroffer`, {
            sdp: data.sdp_a_offer,
            offer: "",
          });
        }

        if (data.answer_can) {
          console.log("there is answer candididate");
          socket.broadcast.emit(`${myid}_answeroffer`, {
            offer: data.answer_can,
          });
        }

        // if(data.answer_can){
        //   console.log("sending  answer ice can offer")
        //   let offer = data.answer_can
        //   socket.broadcast.emit(`${myid}_answerice`,offer)

        // }
        socket.broadcast.emit(myid, { data: data });
      }
    }
  });

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

  socket.on("disconnect", async () => {
    await userdisconnect(socket.id);
    await deletecallOffline(socket.id);
    socket.disconnect();
    console.log("user disconnected " + socket.id);
  });
});

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
app.use("/getverifymodel", require("./routes/api/model/getlivemodel"));
app.use("/getmodelbyid", require("./routes/api/model/getmodelbyid"));
app.use("/searchuser", require("./routes/api/profile/getallUser"));
app.use("/post", require("./routes/api/post/Post"));
app.use("/addpayment", require("./routes/api/payment/payment.routes"));
app.use("/withdraw-request", require("./routes/api/withdrawRequest/withdraw.route"));
app.use("/editmoreprofile", require("./routes/api/Profilemore/editprofilemore"));
app.use("/model", require("./routes/api/model/models"));
app.use("/editmodel", require("./routes/api/model/editemodel"));
app.use("/postdocument", require("./routes/api/model/postdocument"));
app.use("/exclusive", require("./routes/api/Exclusive/exclusive")); //(put) exclusive content (post) buy exclusive content
app.use("/models", require("./routes/api/model/updateView"));
app.use("/models", require("./routes/api/model/updateFollowers"));
app.use("/allrequest", require("./routes/api/booking/allrequestroute"));

// app.use(handleRefresh);

// app.use(verifyJwt);
// app.use('/exclusive', require('./routes/api/Exclusive/exclusive')) //(put) exclusive content (post) buy exclusive content
//(patch)delete exclusive content
app.use("/exclusivecontent", require("./routes/api/Exclusive/allexclusive")); //(put) get my purshased exclusive (post) delete my purshased exclusive
// app.use('/model', require('./routes/api/model/models'))
app.use("/deleteaccount", require("./routes/api/profile/deleteprofile")); // (post) to delete user account (put) get  block users with user your userid input
//(patch) to remove block user with id input
app.use("/setting", require("./routes/api/profile/setting")); //(post) setting input-> userid , emailnot,pushnot
app.use("/follow", require("./routes/api/follow/follower"));
app.use("/getfollowers", require("./routes/api/follow/get_followers"));
// app.use('/postdocument', require('./routes/api/model/postdocument'))
// app.use('/editmodel', require('./routes/api/model/editemodel'))
app.use("/getadminhost", require("./routes/api/model/hostforadmin"));
app.use("/deletemodel", require("./routes/api/model/deletemodel"));
// app.use('/post', require('./routes/api/post/Post'))
app.use("/comment", require("./routes/api/comment/Comment"));
app.use("/like", require("./routes/api/like/Like"));
app.use("/sharepost", require("./routes/api/share/share"));
app.use("/editprofile", require("./routes/api/profile/Editprofile"));
// app.use('/editmoreprofile', require('./routes/api/Profilemore/editprofilemore'))
app.use("/rejectmodel", require("./routes/api/model/rejectmodel"));
app.use("/verifymodel", require("./routes/api/model/verifymodel"));
app.use("/getcurrentchat", require("./routes/api/chat/getchat"));
app.use("/getmsgnotify", require("./routes/api/chat/getmsgnotify"));
app.use("/updatenotify", require("./routes/api/chat/updatenotify"));
app.use("/bookhost", require("./routes/api/booking/book"));
app.use("/pendingrequest", require("./routes/api/booking/getpendingbook"));
app.use("/cancelrequest", require("./routes/api/booking/cancelmyrequest"));

app.use("/acceptbook", require("./routes/api/booking/acceptbooking"));
app.use("/declinebook", require("./routes/api/booking/declinebooking"));
app.use("/getrequeststats", require("./routes/api/booking/requeststat"));
app.use("/paymodel", require("./routes/api/booking/paymodel"));
app.use("/reviewmodel", require("./routes/api/model/reviewmodel"));
app.use("/getreviews", require("./routes/api/model/getmodelreview"));
app.use("/deletereview", require("./routes/api/model/deletereview"));
app.use("/gethistory", require("./routes/api/profile/get_history"));
app.use(
  "/getmonthlyhistory",
  require("./routes/api/profile/get_historyByMonth")
);

app.use("/giftmodel", require("./routes/api/chat/giftGold"));
app.use("/topup", require("./routes/api/profile/topup"));
app.use("/getallusers", require("./routes/api/Admin/getallusers"));
app.use("/deleteuser", require("./routes/api/Admin/deleteuser"));
app.use("/suspenduser", require("./routes/api/Admin/suspenduser"));
app.use("/sendmessages", require("./routes/api/Admin/sendmessage"));
app.use("/recivemessage", require("./routes/api/Admin/recivemessage"));
app.use("/adminnotify", require("./routes/api/Admin/adminnotify"));
app.use("/useredit", require("./routes/api/Profilemore/getuseredit"));
app.use("/addcrush", require("./routes/api/model/addcrush"));
app.use("/getcrush", require("./routes/api/model/getcrush"));
app.use("/deleteMsg", require("./routes/api/Admin/deleteMsg"));
app.use("/deletecrush", require("./routes/api/model/deletecrush"));

mongoose.connection.once("open", () => {
  console.log("Database connected");
  server.listen(PORT, () => {
    console.log("listening on *:" + PORT);
  });
});

// server.listen(PORT, () => {
//   console.log('listening on *:3500');
// });
