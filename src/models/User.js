const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_]{3,20}$/ },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  bio: { type: String, default: '', maxlength: 180 },
  avatar: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
