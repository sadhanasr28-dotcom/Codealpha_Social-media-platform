const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
router.get('/search', auth, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ users: [] });
  const users = await User.find({ _id: { $ne: req.user._id }, $or: [{ username: new RegExp(q, 'i') }, { name: new RegExp(q, 'i') }] }).select('name username bio followers').limit(20);
  res.json({ users: users.map(u => ({ id: u._id, name: u.name, username: u.username, bio: u.bio, followers: u.followers.length, isFollowing: req.user.following.some(id => id.equals(u._id)) })) });
});
router.get('/:username', auth, async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const posts = await Post.find({ author: user._id }).populate('author', 'name username').sort({ createdAt: -1 });
  res.json({ profile: { id: user._id, name: user.name, username: user.username, bio: user.bio, followers: user.followers.length, following: user.following.length, isFollowing: req.user.following.some(id => id.equals(user._id)) }, posts });
});
router.put('/me', auth, async (req, res) => {
  const { name, bio } = req.body;
  if (name !== undefined) req.user.name = name.trim().slice(0, 60);
  if (bio !== undefined) req.user.bio = bio.trim().slice(0, 180);
  await req.user.save();
  res.json({ message: 'Profile updated.', user: { name: req.user.name, username: req.user.username, bio: req.user.bio } });
});
router.post('/:id/follow', auth, async (req, res) => {
  if (String(req.user._id) === req.params.id) return res.status(400).json({ message: 'You cannot follow yourself.' });
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found.' });
  const already = req.user.following.some(id => id.equals(target._id));
  if (already) { req.user.following.pull(target._id); target.followers.pull(req.user._id); }
  else { req.user.following.addToSet(target._id); target.followers.addToSet(req.user._id); }
  await Promise.all([req.user.save(), target.save()]);
  res.json({ message: already ? 'Unfollowed user.' : 'Now following user.', isFollowing: !already });
});
module.exports = router;
