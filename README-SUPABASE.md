# 📚 Manga-Book App - Supabase Edition

A modern, full-stack manga list management application built with **Supabase** (PostgreSQL + Auth) and deployed on **Netlify**.

[![Live Demo](https://img.shields.io/badge/Demo-Live-green?style=for-the-badge)](https://your-netlify-site.netlify.app)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green?style=for-the-badge)](https://supabase.com)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-blue?style=for-the-badge)](https://netlify.com)

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Registration/Login** with email verification
- **JWT-based authentication** handled by Supabase
- **Password recovery** and account management
- **Row Level Security (RLS)** for data privacy

### 📖 Manga List Management
- **Personal manga categories** (Currently Reading, Plan to Read, etc.)
- **Jikan API integration** for manga data and cover images
- **Search and filter** across your entire collection
- **Reading progress tracking** with chapter/volume counts
- **Personal ratings and notes** for each manga

### 💾 Data Management
- **Real-time synchronization** across devices
- **Export/Import** in JSON, TXT, and PDF formats
- **Cloud backup** with automatic data persistence
- **Multi-device support** with secure user sessions

### 🎨 User Experience
- **Responsive design** works on desktop, tablet, and mobile
- **Dark theme** with beautiful background images
- **Smooth animations** and intuitive interface
- **Modal details** with comprehensive manga information
- **Offline-ready** for basic functionality

## 🏗️ Architecture

### Modern Stack
```
Frontend (Netlify)
    ↓
Supabase (PostgreSQL + Auth + APIs)
    ↓
External APIs (Jikan for manga data)
```

### Technology Choices

- **Frontend**: Vanilla JavaScript (ES modules), HTML5, Tailwind CSS
- **Backend**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (JWT tokens, email verification)
- **Database**: PostgreSQL with advanced features (triggers, views, indexes)
- **Deployment**: Netlify (frontend) + Supabase (backend)
- **APIs**: Auto-generated REST API + Real-time subscriptions

## 🚀 Quick Start

### Prerequisites
- GitHub account
- Email address for verification

### 1. Set Up Supabase Project

Follow the detailed guide: **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)**

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL schema from `supabase/schema.sql`
4. Get your project URL and API key

### 2. Deploy to Netlify

1. Fork this repository
2. Connect to [netlify.com](https://netlify.com)
3. Deploy from GitHub
4. Set environment variables:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```

### 3. Configure & Test

1. Update Supabase site URL with your Netlify domain
2. Test user registration and login
3. Create categories and add manga
4. Export/import data to verify functionality

## 📊 Database Schema

### Core Tables

```sql
user_profiles     -- Extended user information and preferences
manga_categories  -- User-defined categories (Currently Reading, etc.)
manga_lists      -- Individual manga entries with metadata
reading_progress -- Chapter/volume tracking and reading status
user_statistics  -- Aggregated stats (total manga, completed, etc.)
activity_log     -- User action history for analytics
```

### Key Features

- **Row Level Security**: Users can only access their own data
- **Automatic triggers**: Statistics updated automatically
- **Full-text search**: Efficient manga title searching
- **Optimized indexes**: Fast queries even with large datasets
- **JSONB fields**: Flexible data storage for metadata

## 🔧 Development

### Local Development

1. Clone the repository
2. Create `.env` file with Supabase credentials
3. Update `script-supabase.js` with your project details
4. Serve with any static server or open `index.html`

### Database Migrations

All schema changes should be made through Supabase dashboard or SQL scripts. The schema includes:

- Migration-friendly design
- Backward compatibility considerations
- Automatic data migration triggers

### Adding Features

Common customizations:

1. **New manga metadata fields**: Add columns to `manga_lists` table
2. **Custom categories**: Modify category creation logic
3. **Reading statistics**: Extend `user_statistics` table
4. **Social features**: Add sharing and friend tables

## 🛡️ Security Features

### Data Protection
- **Row Level Security (RLS)** policies on all tables
- **JWT authentication** with automatic token refresh
- **Email verification** for new accounts
- **Secure password hashing** (handled by Supabase)

### Privacy Controls
- **Private by default**: User data is not visible to others
- **Optional public profiles**: Users can choose to make lists public
- **Data portability**: Full export/import capabilities
- **Account deletion**: Complete data removal on request

## 📈 Performance & Scalability

### Database Optimization
- **Proper indexing** on frequently queried columns
- **Materialized views** for complex aggregations
- **Connection pooling** handled by Supabase
- **Query optimization** with EXPLAIN ANALYZE

### Frontend Performance
- **Netlify CDN** for global content delivery
- **Optimized assets** with proper caching headers
- **Lazy loading** for manga cover images
- **Efficient JavaScript** with minimal dependencies

### Monitoring
- **Supabase dashboard**: Database metrics and logs
- **Netlify analytics**: Site performance and usage
- **Error tracking**: Console logging with structured data
- **Real-time monitoring**: API response times and errors

## 🔮 Future Enhancements

See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for detailed plans:

### Phase 1 (Next 3 months)
- **User profiles** with avatars and preferences
- **Enhanced search** with filters and saved queries
- **Reading progress** with detailed tracking

### Phase 2 (3-6 months)
- **Offline functionality** with service workers
- **Social features** for sharing and recommendations
- **Data visualization** with reading statistics

### Phase 3 (6-12 months)
- **AI recommendations** based on reading history
- **Progressive Web App** with native features
- **Advanced integrations** with MyAnimeList, AniList

## 🤝 Contributing

### Ways to Contribute
1. **Bug reports**: Open GitHub issues with detailed descriptions
2. **Feature requests**: Suggest new functionality
3. **Code contributions**: Submit pull requests with improvements
4. **Documentation**: Help improve guides and examples
5. **Testing**: Report compatibility issues and edge cases

### Development Setup
1. Fork the repository
2. Set up local development environment
3. Make changes and test thoroughly
4. Submit pull request with clear description

## 📞 Support

### Getting Help
- **Setup Issues**: Check [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
- **Bug Reports**: Open GitHub issues
- **Feature Requests**: Discussions on GitHub
- **General Questions**: Community forums

### Useful Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Jikan API Documentation](https://docs.api.jikan.moe)
- [PostgreSQL Documentation](https://postgresql.org/docs)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Supabase** for providing excellent backend-as-a-service
- **Netlify** for seamless frontend hosting
- **Jikan API** for comprehensive manga database
- **Tailwind CSS** for beautiful, responsive styling
- **MyAnimeList** community for manga data

---

## 🎯 Quick Commands

### Database Management
```sql
-- View user statistics
SELECT * FROM user_dashboard WHERE id = 'user-id';

-- Add new manga category
INSERT INTO manga_categories (user_id, name) VALUES ('user-id', 'New Category');

-- Get reading progress
SELECT * FROM manga_with_progress WHERE user_id = 'user-id';
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Update with your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deployment
```bash
# Deploy to Netlify (automatic on push to main)
git push origin main

# Manual deployment
netlify deploy --prod --dir=.
```

---

**Made with ❤️ by Rakshit K.**

*Transform your manga reading experience with modern web technology!*
