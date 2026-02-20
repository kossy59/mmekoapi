const messagedb = require("../Creators/message")

const Livechats = async (newdata) => {
    console.log("💾 [LIVECHATS] Starting to save message:", newdata);

    try {
        console.log("💾 [LIVECHATS] Creating message in database");
        const savedMessage = await messagedb.create(newdata);
        console.log("✅ [LIVECHATS] Message saved successfully with ID:", savedMessage._id);

        console.log("📊 [LIVECHATS] Fetching all messages for statistics");
        let Chats = await messagedb.find().exec();
        console.log("📊 [LIVECHATS] Total messages in database:", Chats.length);

        console.log("🔍 [LIVECHATS] Filtering messages for recipient:", newdata.toid);
        let listchat = Chats.filter(value => {
            return value.toid === newdata.toid;
        });
        console.log("📨 [LIVECHATS] Messages for recipient:", listchat.length);

        console.log("✅ [LIVECHATS] Message processing completed successfully");
        return savedMessage;

    } catch (error) {
        console.error("❌ [LIVECHATS] Error saving message:", error);
        throw error;
    }
}

module.exports = Livechats;