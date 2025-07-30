const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['follow', 'follow_back', 'unfollow',"like","comment"], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  message: { type: String, required: true },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
},{ timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema);