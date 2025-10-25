const mongoose = require('mongoose');

const supportChatSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    ref: 'UserDB'
  },
  category: {
    type: String,
    required: true,
    enum: ['Account Issues', 'Payment & Billing', 'Technical Support', 'Feature Request', 'Bug Report', 'Report a Fan', 'Report a Creator', 'Other']
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'closed'],
    default: 'open'
  },
  messages: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    content: {
      type: String,
      required: true
    },
    fromid: {
      type: String,
      required: true
    },
    toid: {
      type: String,
      required: true
    },
    date: {
      type: Number,
      default: Date.now
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    files: [{
      filename: String,
      url: String,
      type: String
    }]
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageDate: {
    type: Number,
    default: Date.now
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null
  }
}, {
  timestamps: false
});

// Index for better query performance
supportChatSchema.index({ userid: 1, status: 1 });
supportChatSchema.index({ status: 1, lastMessageDate: -1 });

module.exports = mongoose.model('SupportChat', supportChatSchema);
