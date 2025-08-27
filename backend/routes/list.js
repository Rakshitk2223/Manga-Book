const express = require('express');
const jwt = require('jsonwebtoken');
const MangaList = require('../models/MangaList');
const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
};

// Get Manga List
router.get('/', auth, async (req, res) => {
    try {
        let list = await MangaList.findOne({ user: req.user.id });
        if (!list) {
            // If no list exists for the user, create a default one
            list = new MangaList({ user: req.user.id, categories: { 'To Read': [] } });
            await list.save();
        }
        res.json(list.categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching list', error });
    }
});

// Update Manga List
router.post('/', auth, async (req, res) => {
    try {
        const updatedList = await MangaList.findOneAndUpdate(
            { user: req.user.id },
            { categories: req.body },
            { new: true, upsert: true } // Upsert: create if it doesn't exist
        );
        res.json(updatedList.categories);
    } catch (error) {
        res.status(500).json({ message: 'Error updating list', error });
    }
});

module.exports = router;
