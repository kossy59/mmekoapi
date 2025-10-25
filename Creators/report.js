const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String,
    required: true,
    ref: 'UserDB'
  },
  reportedUserId: {
    type: String,
    ref: 'UserDB',
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['Report a Fan', 'Report a Creator']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'high'
  },
  supportChatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportChat'
  },
  resolvedBy: {
    type: String,
    ref: 'UserDB',
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  resolvedAt: {
    type: Number,
    default: null
  },
  updatedAt: {
    type: Number,
    default: Date.now
  }
}, {
  timestamps: { currentTime: () => Date.now() }
});

// Index for efficient queries
reportSchema.index({ reporterId: 1, status: 1 });
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
