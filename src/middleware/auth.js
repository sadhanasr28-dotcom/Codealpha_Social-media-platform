const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please log in first.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret_change_me');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    next();
  } catch (_err) { return res.status(401).json({ message: 'Session expired. Please log in again.' }); }
};
