# Local Setup Guide

Complete step-by-step guide to set up the Manga List Manager locally.

## Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - Local installation or MongoDB Atlas account
- **Git** - [Download here](https://git-scm.com/)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd manga-book

# Install backend dependencies
cd backend
npm install
```

## Step 2: Database Setup

### Option A: Local MongoDB (Recommended)

1. **Install MongoDB:**
   - **Windows**: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB:**
   - **Windows**: Starts automatically as a service
   - **macOS**: `brew services start mongodb/brew/mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

### Option B: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create new cluster (free M0 tier)
3. Create database user with read/write permissions
4. Add your IP to network access (or use 0.0.0.0/0 for development)
5. Get connection string from "Connect" → "Connect your application"

## Step 3: Environment Configuration

Create/update `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/manga-book
JWT_SECRET=your_secure_random_secret_key_32_chars_minimum
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**For MongoDB Atlas:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/manga-book?retryWrites=true&w=majority
```

**Important:** Replace `JWT_SECRET` with a secure random string!

## Step 4: Start the Application

### Start Backend Server
```bash
cd backend
npm start
```
You should see:
```
Server is running on port 5001
MongoDB connected successfully.
```

### Start Frontend Server (choose one)
```bash
# Option 1: Python (if installed)
python -m http.server 3000

# Option 2: Node.js http-server
npx http-server -p 3000

# Option 3: VS Code Live Server
# Right-click index.html → "Open with Live Server"
```

## Step 5: Access the Application

1. Open browser to `http://localhost:3000`
2. Register a new account
3. Create your first manga category
4. Start adding manga to your collection!

## Troubleshooting

### Backend Issues
- **Port 5001 in use**: Change PORT in .env file
- **MongoDB connection failed**: 
  - Local: Ensure MongoDB service is running
  - Atlas: Check connection string and network access
- **Dependencies error**: Run `cd backend && npm install`

### Frontend Issues
- **Cannot connect to API**: Ensure backend is running on port 5001
- **CORS errors**: Check FRONTEND_URL in backend/.env matches your frontend URL
- **Page not loading**: Try different frontend server option

### Account Creation Issues
- **Registration fails**: Check browser console for errors
- **Invalid token**: Verify JWT_SECRET is set in .env
- **Database errors**: Ensure MongoDB is connected and accessible

## Development Tips

### Backend Development
```bash
# Auto-restart on changes
cd backend
npm run dev
```

### Frontend Development
- Use VS Code Live Server for auto-reload
- Check browser console for JavaScript errors
- Use browser dev tools for debugging

### Database Management
```bash
# Connect to local MongoDB
mongo manga-book

# View collections
show collections

# View users
db.users.find()

# View manga lists
db.mangalists.find()
```

## Next Steps

Once everything is running:

1. **Test all features**: Registration, login, category creation, manga management
2. **Import data**: Try uploading a .txt or .json file with manga data
3. **Export data**: Test download functionality for backups
4. **Customize**: Modify categories, add personal ratings and notes

## Production Deployment

For production deployment:
1. Use MongoDB Atlas for database
2. Deploy backend to Railway, Heroku, or similar
3. Deploy frontend to Netlify, Vercel, or GitHub Pages
4. Update environment variables for production URLs

---

**Setup time: 5-10 minutes**

**Need help?** Check the main [README.md](README.md) or open an issue on GitHub.