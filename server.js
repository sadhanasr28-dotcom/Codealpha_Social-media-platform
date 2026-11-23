require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const postRoutes = require('./src/routes/posts');
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'Social platform API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codealpha_social')
  .then(() => app.listen(PORT, () => console.log(`Social platform running at http://localhost:${PORT}`)))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
