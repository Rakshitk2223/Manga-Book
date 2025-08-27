# Manga-Book App - Testing & Verification Guide

## Quick Start Testing

### 1. Backend Server Test
```bash
cd backend
npm install
npm start
# Should see: "Server running on port 5000" and "Connected to MongoDB"
```

### 2. Frontend Access Test
- Open `index.html` in your browser
- Verify you see login/register forms (not the old file upload interface)

### 3. Database Connection Test
- Ensure MongoDB is running locally
- Check `.env` file has correct MONGODB_URI
- Look for connection success message in backend console

## Comprehensive Testing Checklist

### Authentication Flow Testing

#### ✅ User Registration
1. **Happy Path**
   - [ ] Enter valid username (3-20 chars), email, password (6+ chars)
   - [ ] Click "Register"
   - [ ] Verify success notification appears
   - [ ] Verify automatic login occurs
   - [ ] Check JWT token is stored in localStorage

2. **Error Handling**
   - [ ] Test duplicate username/email
   - [ ] Test invalid email format
   - [ ] Test short password (<6 chars)
   - [ ] Test short username (<3 chars)
   - [ ] Verify appropriate error messages

#### ✅ User Login
1. **Happy Path**
   - [ ] Enter valid credentials
   - [ ] Click "Login"
   - [ ] Verify success notification
   - [ ] Verify UI switches to main app view
   - [ ] Check JWT token storage

2. **Error Handling**
   - [ ] Test invalid username
   - [ ] Test wrong password
   - [ ] Test empty fields
   - [ ] Verify error notifications

#### ✅ Session Management
- [ ] Refresh page - should stay logged in
- [ ] Clear localStorage - should require re-login
- [ ] Click logout - should return to auth forms
- [ ] Test expired token handling (modify token in localStorage)

### Data Management Testing

#### ✅ Manga List Operations
1. **Loading Data**
   - [ ] New user should see empty state
   - [ ] Existing user data should load automatically
   - [ ] Loading indicators should appear during API calls

2. **Creating Categories**
   - [ ] Add new category via "Add Category" button
   - [ ] Verify category appears immediately
   - [ ] Test duplicate category names
   - [ ] Save data and verify persistence

3. **Adding Manga**
   - [ ] Search for manga via Jikan API
   - [ ] Add manga to categories
   - [ ] Verify cover images load
   - [ ] Test manga details modal
   - [ ] Save and verify persistence

4. **Editing Operations**
   - [ ] Edit manga details inline
   - [ ] Change manga status/rating
   - [ ] Move manga between categories
   - [ ] Delete individual manga entries
   - [ ] Delete entire categories

#### ✅ File Import/Export
1. **Import Testing**
   - [ ] Upload JSON file (test with existing MyMangaList.json)
   - [ ] Upload TXT file
   - [ ] Import PDF file
   - [ ] Verify data integration with existing lists

2. **Export Testing**
   - [ ] Export as JSON - verify format
   - [ ] Export as TXT - verify readability
   - [ ] Export as PDF - verify formatting

### API Testing

#### ✅ Authentication Endpoints
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

#### ✅ Protected Routes
```bash
# Test protected list endpoint (should fail without token)
curl -X GET http://localhost:5000/api/list

# Test with token (replace TOKEN with actual JWT)
curl -X GET http://localhost:5000/api/list \
  -H "Authorization: Bearer TOKEN"
```

### Performance Testing

#### ✅ Load Testing
- [ ] Test with large manga lists (100+ entries)
- [ ] Multiple rapid API calls
- [ ] Image loading performance
- [ ] Search functionality responsiveness

#### ✅ Error Resilience
- [ ] Disconnect from internet - test offline behavior
- [ ] Stop MongoDB - test database error handling
- [ ] Invalid JWT tokens - test auth failure handling
- [ ] Jikan API failures - test external API error handling

### Browser Compatibility

#### ✅ Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### ✅ Mobile Responsiveness
- [ ] Mobile Chrome
- [ ] Mobile Safari
- [ ] Tablet view
- [ ] Touch interactions

### Security Testing

#### ✅ Authentication Security
- [ ] Password hashing verification (check MongoDB - passwords should be hashed)
- [ ] JWT token expiration
- [ ] Cross-site scripting prevention
- [ ] SQL injection protection (Mongoose validation)

#### ✅ Authorization Testing
- [ ] Users can only access their own data
- [ ] Invalid tokens are rejected
- [ ] Token tampering detection

## Known Issues & Limitations

### Current Limitations
1. **Session Management**: Tokens stored in localStorage (consider HTTP-only cookies)
2. **Password Reset**: Not implemented yet
3. **Rate Limiting**: Not implemented for API calls
4. **Image Optimization**: No compression/resizing for manga covers

### Potential Issues
1. **CORS Errors**: If frontend and backend on different ports
2. **MongoDB Connection**: Ensure MongoDB service is running
3. **Jikan API Limits**: Rate limiting may cause image load failures

## Troubleshooting Common Issues

### Backend Won't Start
```bash
# Check MongoDB status
mongod --version
# or
brew services start mongodb/brew/mongodb-community

# Check .env file
cat backend/.env
# Should contain MONGODB_URI and JWT_SECRET
```

### Frontend Authentication Errors
- Check browser console for CORS errors
- Verify API_URL points to correct backend port
- Clear localStorage and cookies
- Check network tab for failed API calls

### Database Connection Issues
- Verify MongoDB is running: `ps aux | grep mongod`
- Check connection string in .env
- Try connecting via MongoDB Compass to verify database accessibility

### Token/Authentication Problems
- Clear localStorage: `localStorage.clear()`
- Check JWT token format in dev tools
- Verify backend console for authentication middleware errors

## Performance Benchmarks

### Target Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms for list operations
- **Image Loading**: < 3 seconds for manga covers
- **Search Response**: < 1 second for Jikan API calls

### Monitoring Commands
```bash
# Backend performance
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:5000/api/list"

# Database query performance
# Use MongoDB Compass to analyze query execution times
```

## Automated Testing Setup (Future)

### Recommended Testing Stack
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "mongodb-memory-server": "^8.0.0",
    "@testing-library/dom": "^8.0.0",
    "cypress": "^12.0.0"
  }
}
```

### Test Files Structure
```
backend/tests/
├── auth.test.js        # Authentication endpoint tests
├── list.test.js        # Manga list API tests
└── models.test.js      # Database model tests

frontend/tests/
├── auth.test.js        # Authentication flow tests
├── manga-list.test.js  # Manga management tests
└── integration.test.js # End-to-end tests
```

## Next Steps After Testing

1. **Deploy to Production**
   - Set up production MongoDB (MongoDB Atlas)
   - Deploy backend (Heroku, DigitalOcean, Vercel)
   - Configure production environment variables
   - Set up HTTPS and secure CORS

2. **Implement Missing Features**
   - Password reset functionality
   - User profile management
   - Advanced search and filtering
   - Offline capability with service workers

3. **Add Monitoring**
   - Error logging (Sentry)
   - Performance monitoring (DataDog, New Relic)
   - User analytics (Google Analytics)
   - API monitoring and alerting

---

*Testing Guide Version: 1.0*
*Last Updated: Current Date*
