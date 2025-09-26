const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const MangaList = require('../models/MangaList');
const router = express.Router();

// Simple rate limiting - much more relaxed
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 attempts per window
    message: { error: 'Too many requests, please wait a moment.' }
});

// Apply rate limiting to auth routes
router.use(authLimiter);

// Simple validation - just check if fields exist
const validateRegister = [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('securityWord').notEmpty().withMessage('Security word is required')
];

const validateLogin = [
    body('emailOrUsername').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Register
router.post('/register', validateRegister, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation failed', 
            errors: errors.array() 
        });
    }

    const { username, email, password, securityWord } = req.body;
    
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
            });
        }
        
        const newUser = new User({ 
            username: username.toLowerCase(), 
            email, 
            password,
            recoveryKeyword: securityWord,
            displayName: username
        });
        
        await newUser.save();
        
        // Create default manga list with categories
        const defaultCategories = [
            { name: 'Currently Reading', entries: [], sortOrder: 1 },
            { name: 'Plan to Read', entries: [], sortOrder: 2 },
            { name: 'Completed', entries: [], sortOrder: 3 },
            { name: 'Dropped', entries: [], sortOrder: 4 },
            { name: 'On Hold', entries: [], sortOrder: 5 }
        ];
        
        const mangaList = new MangaList({
            user: newUser._id,
            categories: defaultCategories
        });
        
        await mangaList.save();
        
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                displayName: newUser.displayName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation failed', 
            errors: errors.array() 
        });
    }

    const { emailOrUsername, password } = req.body;
    
    try {
        // Find user by email or username
        const user = await User.findOne({ 
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername.toLowerCase() }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ 
                message: 'User does not exist',
                suggestion: 'Please check your email/username or create a new account'
            });
        }
        
        if (!user.isActive) {
            return res.status(403).json({ 
                message: 'Account is deactivated',
                suggestion: 'Please contact support if you believe this is an error'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                message: 'Incorrect password',
                suggestion: 'Please check your password or use the password reset option'
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            token,
            user: user.toSafeObject()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});


// Password Reset
router.post('/reset-password', [
    body('emailOrUsername')
        .notEmpty()
        .withMessage('Email or username is required'),
    body('securityWord')
        .isLength({ min: 2, max: 50 })
        .withMessage('Security word must be 2-50 characters'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters'),
    body('confirmPassword')
        .isLength({ min: 6 })
        .withMessage('Confirm password must be at least 6 characters')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation failed', 
            errors: errors.array() 
        });
    }

    const { emailOrUsername, securityWord, newPassword, confirmPassword } = req.body;
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    try {
        // Find user by email or username
        const user = await User.findOne({ 
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername.toLowerCase() }
            ]
        });
        
        if (!user || !user.isActive) {
            return res.status(404).json({ message: 'User does not exist' });
        }

        // Check security word
        const isKeywordMatch = await user.compareRecoveryKeyword(securityWord);
        if (!isKeywordMatch) {
            return res.status(401).json({ message: 'Incorrect security word' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
});

module.exports = router;
