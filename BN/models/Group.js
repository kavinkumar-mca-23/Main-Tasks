const mongoose = require('mongoose'); // ✅ Required import

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  avatar: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['admin', 'member'], default: 'member' }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
