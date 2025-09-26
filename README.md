# 📚 Manga List Manager

A full-stack web application to manage your manga and comic book collection with user authentication, cloud storage, and a modern dark-themed interface.

**🌟 [Try it live at weebslist.netlify.app](https://weebslist.netlify.app)**

## Features

- **User Authentication** - Secure registration/login with JWT tokens
- **Personal Collections** - Create custom categories and manage your manga list
- **Auto Cover Images** - Fetches cover images from Jikan API
- **Search & Filter** - Find manga across your entire collection
- **Import/Export** - Support for JSON, TXT, and PDF formats
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Cloud Storage** - MongoDB database with real-time sync

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Mongoose ODM
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt
- **API**: Jikan API for manga data

## 🌐 Live Demo

**Try the app now:** [https://weebslist.netlify.app](https://weebslist.netlify.app)

- Create your account and start managing your manga collection
- All data is stored securely in the cloud
- Works on desktop, tablet, and mobile

## 🛠️ Local Development

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Setup
1. Clone the repository
2. Install dependencies: `cd backend && npm install`
3. Configure `backend/.env`:
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/manga-book
   JWT_SECRET=your_secure_secret_key
   ```
4. Start backend: `cd backend && npm start`
5. Start frontend: `python -m http.server 3000`
6. Open http://localhost:3000

> **Detailed setup instructions**: See [setup.md](setup.md)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Manga Lists
- `GET /api/list` - Get user's manga list
- `POST /api/list` - Update entire manga list
- `POST /api/list/category` - Add new category
- `POST /api/list/manga` - Add manga to category

## Troubleshooting

### Common Issues
- **Cannot connect to MongoDB**: Ensure MongoDB service is running
- **Invalid token errors**: Check JWT_SECRET in .env file
- **CORS errors**: Verify frontend URL matches backend configuration
- **Account creation fails**: Ensure backend is running on port 5001

## 🚀 Deployment

This app is deployed using:
- **Frontend**: [Netlify](https://netlify.com) - `https://weebslist.netlify.app`
- **Backend**: [Render](https://render.com) - `https://manga-list-backend-ywyn.onrender.com`
- **Database**: [MongoDB Atlas](https://mongodb.com/atlas) - Free tier

### Deploy Your Own Copy
1. Fork this repository
2. Deploy backend to Render (connect GitHub repo, set environment variables)
3. Deploy frontend to Netlify (drag & drop or connect GitHub)
4. Update API URLs in `script.js`

## License

MIT License - see LICENSE file for details.

---

**Made with ❤️ by Rakshit K.**