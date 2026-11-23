# CodeAlpha Task 2 — Social Media Platform (Connectly)

A beginner-friendly full-stack mini social media app built with HTML, CSS, JavaScript, Node.js, Express and MongoDB.

## Features
- User registration and login (bcrypt password hashing + JWT sessions)
- User profiles with editable name and bio
- Create and delete text posts
- Like and unlike posts
- Comment on posts
- Search for users and follow/unfollow them
- MongoDB collections for users and posts; comments and followers are stored with their related records
- Responsive layout for desktop and mobile

## Requirements
- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Run on Windows
1. Extract the ZIP file.
2. Open the `CodeAlpha_Social_Media_Platform` folder.
3. Click the File Explorer address bar, type `cmd`, and press Enter.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create your environment file:
   ```cmd
   copy .env.example .env
   ```
6. Open `.env` in Notepad. For local MongoDB, use:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://127.0.0.1:27017/codealpha_social
   JWT_SECRET=put_a_long_random_secret_here
   ```
   Save the file. Do not share or upload `.env`.
7. Start the app:
   ```bash
   npm start
   ```
8. Open http://localhost:5001 in your browser.

## MongoDB Compass
Connect to `mongodb://localhost:27017`, refresh, and open the `codealpha_social` database. The `users` and `posts` collections are created when the first users/posts are saved.

## API overview
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — log in
- `GET /api/auth/me` — current user
- `GET /api/posts` — feed
- `POST /api/posts` — create post
- `POST /api/posts/:id/like` — like/unlike
- `POST /api/posts/:id/comments` — comment
- `GET /api/users/search?q=...` — search users
- `POST /api/users/:id/follow` — follow/unfollow
- `GET /api/users/:username` — view profile
- `PUT /api/users/me` — edit profile

## Notes
This is an educational internship project. It does not include private messaging, media uploads, moderation tools, or production-grade rate limiting. Post image URLs are optional and must point to an image already hosted online.
