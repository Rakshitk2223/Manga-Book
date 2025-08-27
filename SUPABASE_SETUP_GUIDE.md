# Manga-Book App - Supabase Migration & Deployment Guide

## 🚀 Quick Overview

This guide will help you migrate your Manga-Book app from MongoDB to Supabase and deploy the frontend to Netlify. The new architecture will be:

- **Frontend**: Netlify (static hosting)
- **Backend**: Supabase (PostgreSQL database + authentication)
- **API**: Supabase auto-generated APIs + Row Level Security

## 📋 Prerequisites

- A GitHub account (for linking with Supabase and Netlify)
- Your project files ready to deploy

## Step 1: Create Supabase Project

### 1.1 Sign up and Create Project

1. Go to [supabase.com](https://supabase.com) and click "Start your project"
2. Sign up with GitHub (recommended for easier integration)
3. Click "New project"
4. Choose your organization (or create one)
5. Fill in project details:
   - **Name**: `manga-book` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
6. Click "Create new project"

Wait for the project to be created (takes 1-2 minutes).

### 1.2 Get Project Configuration

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijk.supabase.co`)
   - **Project API Keys → `anon` `public`** (starts with `eyJ...`)

⚠️ **IMPORTANT**: Keep these values secure. The `anon` key is safe to expose in frontend code, but treat your project URL carefully.

## Step 2: Set Up Database Schema

### 2.1 Run SQL Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute

This will create:
- All necessary tables (`user_profiles`, `manga_categories`, `manga_lists`, etc.)
- Row Level Security policies
- Database triggers and functions
- Indexes for performance
- Views for complex queries

### 2.2 Configure Authentication

1. Go to **Authentication → Settings**
2. **Site URL**: Add your Netlify URL here (we'll update this later)
3. **Email Templates**: Customize if desired (optional)
4. **Redirect URLs**: Add your Netlify domain
5. **Email Auth**: Make sure it's enabled (default)

## Step 3: Update Environment Configuration

### 3.1 Create Local .env File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase values:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3.2 Update Script Configuration

Open `script-supabase.js` and update lines 4-10 with your actual Supabase URL and key:

```javascript
// Replace these with your actual values
const supabaseUrl = 'https://your-project-ref.supabase.co';
const supabaseKey = 'your-anon-key-here';
```

## Step 4: Deploy to Netlify

### 4.1 Connect GitHub Repository

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your manga-book repository
5. Configure build settings:
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `.` (root directory)
6. Click "Deploy site"

### 4.2 Configure Environment Variables

1. In Netlify dashboard, go to **Site settings → Environment variables**
2. Add these variables:
   ```
   VITE_SUPABASE_URL = https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key-here
   ```
3. Click "Save"

### 4.3 Update Site Settings

1. **Site settings → General → Site details**
2. Change site name to something memorable (optional)
3. Note your site URL (e.g., `https://manga-book-app.netlify.app`)

### 4.4 Update Supabase Site URL

Go back to Supabase:
1. **Authentication → Settings → Site URL**
2. Update to your Netlify URL: `https://your-site-name.netlify.app`
3. **Authentication → Settings → Redirect URLs**
4. Add: `https://your-site-name.netlify.app/**`

## Step 5: Test the Application

### 5.1 Test Authentication

1. Visit your Netlify site
2. Try registering a new account
3. Check your email for verification
4. Try logging in after verification

### 5.2 Test Database Operations

1. Create a new category
2. Search for a manga using Jikan API
3. Add manga to categories
4. Test data persistence by refreshing the page

### 5.3 Test Data Export

1. Export your list as JSON/TXT
2. Verify the exported data format

## Step 6: Optional Enhancements

### 6.1 Custom Domain (Netlify Pro)

1. **Site settings → Domain settings**
2. Add your custom domain
3. Configure DNS with your domain provider
4. Update Supabase settings with new domain

### 6.2 Enable Real-time Features (Future)

Supabase supports real-time subscriptions:
```javascript
// Example: Listen for changes to manga lists
const subscription = supabase
  .channel('manga_lists')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'manga_lists' },
    (payload) => {
      console.log('Change received!', payload);
      // Update UI accordingly
    }
  )
  .subscribe();
```

### 6.3 Add Progressive Web App (PWA) Features

1. Create `manifest.json` for installable app
2. Add service worker for offline functionality
3. Enable push notifications

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Invalid API Key" Error
- **Cause**: Wrong or missing environment variables
- **Solution**: Double-check your Supabase keys in Netlify environment variables

#### 2. CORS Errors
- **Cause**: Incorrect site URL in Supabase settings
- **Solution**: Ensure Supabase Site URL matches your Netlify URL exactly

#### 3. Database Connection Errors
- **Cause**: RLS policies or network issues
- **Solution**: Check RLS policies in Supabase dashboard, ensure user is authenticated

#### 4. Email Verification Not Working
- **Cause**: Email settings or spam filters
- **Solution**: Check Supabase email settings, check spam folder

#### 5. Module Import Errors
- **Cause**: ES modules not supported properly
- **Solution**: Ensure script tag has `type="module"` attribute

### Debugging Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Look for failed API requests
3. **Check Supabase Logs**: Go to Supabase dashboard → Logs
4. **Verify Environment Variables**: Check they're set correctly in Netlify

## 📊 Performance Optimization

### Database Optimization

1. **Indexes**: Already created in schema for common queries
2. **RLS Policies**: Optimized for user-specific data access
3. **Views**: Pre-computed joins for complex queries

### Frontend Optimization

1. **CDN**: Netlify provides global CDN automatically
2. **Caching**: Static assets cached with proper headers
3. **Compression**: Gzip/Brotli enabled by default on Netlify

## 🔒 Security Best Practices

### Already Implemented

- ✅ Row Level Security (RLS) policies
- ✅ JWT authentication
- ✅ Password hashing (handled by Supabase)
- ✅ CORS configuration
- ✅ Input validation in database schema

### Additional Recommendations

1. **Enable 2FA** on your Supabase and Netlify accounts
2. **Regular backups** using Supabase's backup features
3. **Monitor usage** to detect unusual activity
4. **Use HTTPS only** (enabled by default on Netlify)

## 📈 Monitoring & Analytics

### Supabase Monitoring

1. **Database → Logs**: Monitor database queries
2. **Authentication → Users**: Track user registrations
3. **API → Logs**: Monitor API usage

### Netlify Analytics

1. **Analytics**: Track site visits and performance
2. **Functions**: Monitor any serverless functions (if added)
3. **Forms**: Track form submissions (if used)

## 🚀 Deployment Automation

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: '.'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📞 Support

### Getting Help

1. **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
2. **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
3. **Community Forums**: Both platforms have active communities
4. **GitHub Issues**: Create issues in this repository for app-specific problems

### Useful Resources

- [Supabase JavaScript Client Documentation](https://supabase.com/docs/reference/javascript)
- [Netlify Deployment Guide](https://docs.netlify.com/site-deploys/create-deploys/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎉 You're Done!

Your Manga-Book app is now running on modern, scalable infrastructure:

- **Supabase** handles authentication, database, and API generation
- **Netlify** provides fast, global hosting with automatic deployments
- **PostgreSQL** gives you a robust, SQL-compliant database
- **Row Level Security** ensures data privacy and security

The app now supports:
- ✅ User registration and authentication
- ✅ Personal manga lists with categories
- ✅ Real-time data synchronization
- ✅ Secure multi-user environment
- ✅ Scalable architecture
- ✅ Automatic backups
- ✅ Global CDN delivery

**Next Steps**: Check out the [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for planned enhancements and new features!

---

*Last updated: Current Date*
*Migration Guide Version: 1.0*
