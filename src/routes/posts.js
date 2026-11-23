const router = require('express').Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');
router.get('/', auth, async (_req, res) => {
  const posts = await Post.find().populate('author', 'name username').populate('comments.author', 'name username').sort({ createdAt: -1 }).limit(100);
  res.json({ posts });
});
router.post('/', auth, async (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Write something before posting.' });
  if (content.length > 1000) return res.status(400).json({ message: 'Post is too long (maximum 1000 characters).' });
  const post = await Post.create({ author: req.user._id, content, imageUrl: (req.body.imageUrl || '').trim() });
  await post.populate('author', 'name username');
  res.status(201).json({ post });
});
router.post('/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  const liked = post.likes.some(id => id.equals(req.user._id));
  if (liked) post.likes.pull(req.user._id); else post.likes.addToSet(req.user._id);
  await post.save();
  res.json({ likes: post.likes.length, liked: !liked });
});
router.post('/:id/comments', auth, async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty.' });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  post.comments.push({ author: req.user._id, text });
  await post.save();
  await post.populate('comments.author', 'name username');
  res.status(201).json({ comment: post.comments[post.comments.length - 1] });
});
router.delete('/:id', auth, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
  if (!post) return res.status(404).json({ message: 'Post not found or you do not own it.' });
  await post.deleteOne();
  res.json({ message: 'Post deleted.' });
});
module.exports = router;
