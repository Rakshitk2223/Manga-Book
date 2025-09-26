const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');
const MangaList = require('../models/MangaList');
const User = require('../models/User');
const router = express.Router();

// Simple rate limiting
const listLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute
    message: { error: 'Too many requests, please slow down.' }
});

// Enhanced middleware to verify token and user
const auth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists and is active
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid token or user account deactivated.' });
        }
        
        req.user = decoded;
        req.userDoc = user; // Store full user document for additional checks
        next();
    } catch (ex) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Validation middleware
const validateCategoryName = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category name must be 1-50 characters')
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and underscores')
];

const validateMangaEntry = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Manga name must be 1-200 characters'),
    body('chapter')
        .optional()
        .isFloat({ min: 0, max: 9999 })
        .withMessage('Chapter must be a number between 0 and 9999'),
    body('userRating')
        .optional()
        .isFloat({ min: 1, max: 10 })
        .withMessage('Rating must be between 1 and 10'),
    body('userNotes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters')
];

// Get Manga List
router.get('/', auth, async (req, res) => {
    try {
        let list = await MangaList.findOne({ user: req.user.id });
        if (!list) {
            // Create default categories if no list exists
            const defaultCategories = [
                { name: 'Currently Reading', entries: [], sortOrder: 1 },
                { name: 'Plan to Read', entries: [], sortOrder: 2 },
                { name: 'Completed', entries: [], sortOrder: 3 },
                { name: 'Dropped', entries: [], sortOrder: 4 },
                { name: 'On Hold', entries: [], sortOrder: 5 }
            ];
            
            list = new MangaList({ 
                user: req.user.id, 
                categories: defaultCategories 
            });
            await list.save();
        }
        
        // Simple format for frontend
        const categoriesData = {};
        list.categories.forEach(category => {
            categoriesData[category.name] = category.entries;
        });
        
        res.json(categoriesData);
    } catch (error) {
        console.error('Error fetching list:', error);
        res.status(500).json({ message: 'Error fetching list', error: error.message });
    }
});

// Update entire manga list
router.post('/', auth, async (req, res) => {
    try {
        const categoriesData = req.body;
        
        // Convert from frontend format to database format
        const categories = Object.keys(categoriesData).map((categoryName, index) => ({
            name: categoryName,
            entries: categoriesData[categoryName],
            sortOrder: index + 1
        }));
        
        const updatedList = await MangaList.findOneAndUpdate(
            { user: req.user.id },
            { categories },
            { new: true, upsert: true }
        );
        
        // Convert back to frontend format
        const responseData = {};
        updatedList.categories.forEach(category => {
            responseData[category.name] = category.entries;
        });
        
        res.json(responseData);
    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ message: 'Error updating list', error: error.message });
    }
});

// Add new category
router.post('/category', auth, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        
        let list = await MangaList.findOne({ user: req.user.id });
        if (!list) {
            return res.status(404).json({ message: 'Manga list not found' });
        }
        
        // Check if category already exists
        const existingCategory = list.categories.find(cat => cat.name === name.trim());
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        
        // Add new category
        list.categories.push({
            name: name.trim(),
            entries: [],
            sortOrder: list.categories.length + 1
        });
        
        await list.save();
        
        // Convert to frontend format
        const categoriesData = {};
        list.categories.forEach(category => {
            categoriesData[category.name] = category.entries;
        });
        
        res.json(categoriesData);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Error adding category', error: error.message });
    }
});

// Add manga to category
router.post('/manga', auth, async (req, res) => {
    try {
        const { categoryName, manga } = req.body;
        
        if (!categoryName || !manga) {
            return res.status(400).json({ message: 'Category name and manga data are required' });
        }
        
        let list = await MangaList.findOne({ user: req.user.id });
        if (!list) {
            return res.status(404).json({ message: 'Manga list not found' });
        }
        
        const category = list.categories.find(cat => cat.name === categoryName);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        // Add manga to category
        category.entries.push({
            ...manga,
            addedAt: new Date()
        });
        
        await list.save();
        
        // Convert to frontend format
        const categoriesData = {};
        list.categories.forEach(category => {
            categoriesData[category.name] = category.entries;
        });
        
        res.json(categoriesData);
    } catch (error) {
        console.error('Error adding manga:', error);
        res.status(500).json({ message: 'Error adding manga', error: error.message });
    }
});

// Update manga in category
router.put('/manga/:categoryName/:mangaId', auth, async (req, res) => {
    try {
        const { categoryName, mangaId } = req.params;
        const updateData = req.body;
        
        let list = await MangaList.findOne({ user: req.user.id });
        if (!list) {
            return res.status(404).json({ message: 'Manga list not found' });
        }
        
        const category = list.categories.find(cat => cat.name === categoryName);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const manga = category.entries.id(mangaId);
        if (!manga) {
            return res.status(404).json({ message: 'Manga not found' });
        }
        
        // Update manga properties
        Object.keys(updateData).forEach(key => {
            manga[key] = updateData[key];
        });
        
        await list.save();
        
        res.json(manga);
    } catch (error) {
        console.error('Error updating manga:', error);
        res.status(500).json({ message: 'Error updating manga', error: error.message });
    }
});

// Delete manga from category
router.delete('/manga/:categoryName/:mangaId', auth, async (req, res) => {
    try {
        const { categoryName, mangaId } = req.params;
        
        let list = await MangaList.findOne({ user: req.user.id });
        if (!list) {
            return res.status(404).json({ message: 'Manga list not found' });
        }
        
        const category = list.categories.find(cat => cat.name === categoryName);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        category.entries.id(mangaId).remove();
        await list.save();
        
        // Convert to frontend format
        const categoriesData = {};
        list.categories.forEach(category => {
            categoriesData[category.name] = category.entries;
        });
        
        res.json(categoriesData);
    } catch (error) {
        console.error('Error deleting manga:', error);
        res.status(500).json({ message: 'Error deleting manga', error: error.message });
    }
});

// Delete category
router.delete('/category/:categoryName', auth, async (req, res) => {
    try {
        const { categoryName } = req.params;
        
        let list = await MangaList.findOne({ user: req.user.id });
        if (!list) {
            return res.status(404).json({ message: 'Manga list not found' });
        }
        
        list.categories = list.categories.filter(cat => cat.name !== categoryName);
        await list.save();
        
        // Convert to frontend format
        const categoriesData = {};
        list.categories.forEach(category => {
            categoriesData[category.name] = category.entries;
        });
        
        res.json(categoriesData);
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
});

module.exports = router;
