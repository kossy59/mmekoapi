const SupportChat = require('../../Creators/supportchat');
const User = require('../../Creators/userdb');
const { pushAdminNotification, pushSupportNotification } = require('../../utiils/sendPushnot');

// Create or get support chat
const createOrGetSupportChat = async (req, res) => {
  try {
    const { userid, category, message } = req.body;

    if (!userid) {
      return res.status(400).json({ ok: false, message: 'User ID is required' });
    }

    // Check if user exists
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Check if user has an open support chat
    let supportChat = await SupportChat.findOne({ 
      userid: userid, 
      status: { $in: ['open', 'pending'] } 
    });

    if (supportChat) {
      // If category is provided and chat exists, update the category
      if (category && supportChat.category !== category) {
        supportChat.category = category;
        await supportChat.save();
      }
      
      return res.status(200).json({ 
        ok: true, 
        supportChat,
        message: 'Existing support chat found' 
      });
    }

    // Create new support chat
    if (!category) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Category is required for new support chat' 
      });
    }

    const newSupportChat = new SupportChat({
      userid: userid,
      category: category,
      status: 'open',
      messages: message ? [{
        content: message,
        fromid: userid,
        toid: 'support',
        date: Date.now(),
        isAdmin: false
      }] : [],
      lastMessage: message || '',
      lastMessageDate: Date.now()
    });

    await newSupportChat.save();

    res.status(201).json({ 
      ok: true, 
      supportChat: newSupportChat,
      message: 'Support chat created successfully' 
    });

  } catch (error) {
    console.error('Error creating/getting support chat:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
};

// Send message in support chat
const sendMessage = async (req, res) => {
  try {
    const { userid, message, files = [] } = req.body;

    if (!userid || !message) {
      return res.status(400).json({ 
        ok: false, 
        message: 'User ID and message are required' 
      });
    }

    // Find the support chat
    const supportChat = await SupportChat.findOne({ 
      userid: userid, 
      status: { $in: ['open', 'pending'] } 
    });

    if (!supportChat) {
      return res.status(404).json({ 
        ok: false, 
        message: 'No active support chat found' 
      });
    }

    // Add message to chat
    const newMessage = {
      content: message,
      fromid: userid,
      toid: 'support',
      date: Date.now(),
      isAdmin: false,
      files: files
    };

    supportChat.messages.push(newMessage);
    supportChat.lastMessage = message;
    supportChat.lastMessageDate = Date.now();
    supportChat.updatedAt = Date.now();

    await supportChat.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`support_chat_${userid}`).emit('support_message_received', {
        chatId: supportChat._id,
        message: newMessage,
        userid: userid
      });
      io.to('admin_support').emit('new_support_message', {
        chatId: supportChat._id,
        message: newMessage,
        userid: userid
      });
    }

    // Send push notifications to all admin users
    try {
      const adminUsers = await User.find({ admin: true }).exec();
      
      for (const admin of adminUsers) {
        try {
          await pushSupportNotification(admin._id, `New support message: ${message}`);
        } catch (adminPushError) {
          // Error sending push to admin
        }
      }
    } catch (pushError) {
      // Error sending push notifications to admins
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Message sent successfully',
      supportChat 
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
};

// Admin send message
const adminSendMessage = async (req, res) => {
  try {
    const { chatId, message, files = [] } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Chat ID and message are required' 
      });
    }

    // Find the support chat
    const supportChat = await SupportChat.findById(chatId);

    if (!supportChat) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Support chat not found' 
      });
    }

    // Add admin message to chat
    const newMessage = {
      content: message,
      fromid: 'admin',
      toid: supportChat.userid,
      date: Date.now(),
      isAdmin: true,
      files: files
    };

    supportChat.messages.push(newMessage);
    supportChat.lastMessage = message;
    supportChat.lastMessageDate = Date.now();
    supportChat.status = 'pending'; // Mark as pending when admin responds
    supportChat.updatedAt = Date.now();

    await supportChat.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`support_chat_${supportChat.userid}`).emit('support_message_received', {
        chatId: supportChat._id,
        message: newMessage,
        userid: supportChat.userid,
        isAdmin: true
      });
    }

    // Send push notification to user
    try {
      await pushAdminNotification(supportChat.userid, message, 'support');
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Admin message sent successfully',
      supportChat 
    });

  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
};

// Get all support chats for admin
const getAllSupportChats = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const supportChats = await SupportChat.find(query)
      .sort({ lastMessageDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Manually populate user data since userid is a String, not ObjectId
    const populatedChats = await Promise.all(
      supportChats.map(async (chat) => {
        const user = await User.findOne({ _id: chat.userid });
        return {
          ...chat.toObject(),
          userid: user ? {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            photolink: user.photolink,
            email: user.email,
            isVip: user.isVip || false,
            vipEndDate: user.vipEndDate
          } : null,
          // Add VIP info to messages as well
          messages: chat.messages.map(msg => ({
            ...msg.toObject(),
            isVip: user ? (user.isVip || false) : false,
            vipEndDate: user ? user.vipEndDate : null
          }))
        };
      })
    );

    const total = await SupportChat.countDocuments(query);

    res.status(200).json({ 
      ok: true, 
      supportChats: populatedChats,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error getting support chats:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
};

// Get specific support chat
const getSupportChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const supportChat = await SupportChat.findById(chatId);

    if (!supportChat) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Support chat not found' 
      });
    }

    // Manually populate user data
    const user = await User.findOne({ _id: supportChat.userid });
    const populatedChat = {
      ...supportChat.toObject(),
      userid: user ? {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        photolink: user.photolink,
        email: user.email,
        isVip: user.isVip || false,
        vipEndDate: user.vipEndDate
      } : null,
      // Add VIP info to messages as well
      messages: supportChat.messages.map(msg => ({
        ...msg.toObject(),
        isVip: user ? (user.isVip || false) : false,
        vipEndDate: user ? user.vipEndDate : null
      }))
    };

    res.status(200).json({ 
      ok: true, 
      supportChat: populatedChat 
    });

  } catch (error) {
    console.error('Error getting support chat:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
};

// Update support chat status
const updateChatStatus = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status } = req.body;

    if (!['open', 'pending', 'closed'].includes(status)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Invalid status. Must be open, pending, or closed' 
      });
    }

    const supportChat = await SupportChat.findById(chatId);

    if (!supportChat) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Support chat not found' 
      });
    }

    supportChat.status = status;
    supportChat.updatedAt = Date.now();

    // If status is 'closed', clear all messages
    if (status === 'closed') {
      supportChat.messages = [];
      supportChat.lastMessage = '';
      supportChat.lastMessageDate = null;
    }

    await supportChat.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`support_chat_${supportChat.userid}`).emit('support_chat_status_update', {
        chatId: supportChat._id,
        userid: supportChat.userid,
        status: status
      });
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Chat status updated successfully',
      supportChat 
    });

  } catch (error) {
    console.error('Error updating chat status:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
};

// Get user's support chat
const getUserSupportChat = async (req, res) => {
  try {
    const { userid } = req.params;

    const supportChat = await SupportChat.findOne({ 
      userid: userid, 
      status: { $in: ['open', 'pending'] } 
    });

    if (!supportChat) {
      return res.status(404).json({ 
        ok: false, 
        message: 'No active support chat found' 
      });
    }

    res.status(200).json({ 
      ok: true, 
      supportChat 
    });

  } catch (error) {
    console.error('Error getting user support chat:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  createOrGetSupportChat,
  sendMessage,
  adminSendMessage,
  getAllSupportChats,
  getSupportChat,
  updateChatStatus,
  getUserSupportChat
};
