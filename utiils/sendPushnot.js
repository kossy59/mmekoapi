let userdb = require("../Creators/userdb");
let webpush = require("web-push");
let vapikey = require("./webpushKeys");
let pushdb = require("../Creators/pushnotifydb");

const pushmessage = async (userid, message, icon) => {
  let online = await userdb.findOne({ _id: userid }).exec();
  let subinfo = await pushdb.findOne({ userid: userid }).exec();

  if (online) {
    console.log("is online");
    let datasend = JSON.stringify({
      message: message,
      userid: userid,
      icon: icon, // fixed duplicate key
    });

    let options = {
      TTL: 172800,
      urgency: "high",
    };

    webpush.setVapidDetails(
      "mailto:noreply.mmeko@gmail.com",
      vapikey.PublicKey,
      vapikey.PrivateKey
    );

    if (subinfo) {
      try {
        let subscription = JSON.parse(subinfo.subinfo);
        await webpush.sendNotification(subscription, datasend, options);
        console.log("sent notification");
      } catch (err) {
        console.error("Error sending push:", err.statusCode, err.body);

        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log("Removing expired/unsubscribed push subscription");
          await pushdb.deleteOne({ userid: userid }).exec();
        }
      }
    }
  }
};

module.exports = pushmessage;
