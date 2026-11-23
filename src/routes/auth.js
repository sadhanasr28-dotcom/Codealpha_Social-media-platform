const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const makeToken = id => jwt.sign({ id }, process.env.JWT_SECRET || 'development_secret_change_me', { expiresIn: '7d' });
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ message: 'Please fill in all fields.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
    if (exists) return res.status(409).json({ message: 'Email or username is already registered.' });
    const user = await User.create({ name, username, email, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: makeToken(user._id), user: { id: user._id, name: user.name, username: user.username, bio: user.bio } });
  } catch (err) { res.status(500).json({ message: err.code === 11000 ? 'Email or username already exists.' : 'Could not register user.' }); }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: makeToken(user._id), user: { id: user._id, name: user.name, username: user.username, bio: user.bio } });
  } catch (_err) { res.status(500).json({ message: 'Could not log in.' }); }
});
router.get('/me', auth, async (req, res) => res.json({ user: { id: req.user._id, name: req.user.name, username: req.user.username, email: req.user.email, bio: req.user.bio, followers: req.user.followers.length, following: req.user.following.length } }));
module.exports = router;
