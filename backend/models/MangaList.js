const mongoose = require('mongoose');

const MangaEntrySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 200,
        index: 'text' // Text index for search
    },
    chapter: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 9999
    },
    imageUrl: { 
        type: String, 
        default: 'https://shorturl.at/JpeLA',
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Image URL must be a valid HTTP/HTTPS URL'
        }
    },
    malId: { 
        type: Number,
        sparse: true,
        index: true
    },
    author: { 
        type: String,
        trim: true,
        maxlength: 100
    },
    status: { 
        type: String, 
        default: 'plan-to-read',
        enum: ['plan-to-read', 'reading', 'completed', 'dropped', 'on-hold'],
        index: true
    },
    userRating: { 
        type: Number, 
        min: 1, 
        max: 10,
        validate: {
            validator: function(v) {
                return v === null || v === undefined || (v >= 1 && v <= 10);
            },
            message: 'Rating must be between 1 and 10'
        }
    },
    userNotes: { 
        type: String,
        maxlength: 1000
    },
    synopsis: { 
        type: String,
        maxlength: 2000
    },
    addedAt: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    }
});

// Update lastUpdated on save
MangaEntrySchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

const CategorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 50
    },
    entries: [MangaEntrySchema],
    sortOrder: { 
        type: Number, 
        default: 0,
        index: true
    },
    description: {
        type: String,
        maxlength: 200
    },
    color: {
        type: String,
        default: '#3b82f6',
        match: /^#[0-9A-F]{6}$/i
    },
    isPublic: {
        type: Boolean,
        default: false
    }
});

const MangaListSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true,
        index: true
    },
    categories: [CategorySchema],
    totalEntries: {
        type: Number,
        default: 0,
        index: true
    },
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },
    lastActivity: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
MangaListSchema.index({ user: 1, 'categories.name': 1 });
MangaListSchema.index({ user: 1, 'categories.entries.name': 'text' });
MangaListSchema.index({ user: 1, 'categories.entries.status': 1 });
MangaListSchema.index({ user: 1, 'categories.entries.addedAt': -1 });
MangaListSchema.index({ user: 1, lastActivity: -1 });

// Update total entries and last activity before save
MangaListSchema.pre('save', function(next) {
    this.totalEntries = this.categories.reduce((total, category) => {
        return total + category.entries.length;
    }, 0);
    this.lastActivity = new Date();
    next();
});

// Method to get user's manga list with pagination
MangaListSchema.methods.getPaginatedEntries = function(page = 1, limit = 20, categoryName = null, status = null) {
    let allEntries = [];
    
    this.categories.forEach(category => {
        if (!categoryName || category.name === categoryName) {
            category.entries.forEach(entry => {
                if (!status || entry.status === status) {
                    allEntries.push({
                        ...entry.toObject(),
                        categoryName: category.name
                    });
                }
            });
        }
    });
    
    // Sort by most recently added
    allEntries.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
        entries: allEntries.slice(startIndex, endIndex),
        totalEntries: allEntries.length,
        currentPage: page,
        totalPages: Math.ceil(allEntries.length / limit),
        hasNextPage: endIndex < allEntries.length,
        hasPrevPage: page > 1
    };
};

// Method to search entries
MangaListSchema.methods.searchEntries = function(query, limit = 20) {
    const searchRegex = new RegExp(query, 'i');
    let matchingEntries = [];
    
    this.categories.forEach(category => {
        category.entries.forEach(entry => {
            if (searchRegex.test(entry.name) || 
                (entry.author && searchRegex.test(entry.author))) {
                matchingEntries.push({
                    ...entry.toObject(),
                    categoryName: category.name
                });
            }
        });
    });
    
    return matchingEntries.slice(0, limit);
};

// Static method to get public lists (for discovery feature)
MangaListSchema.statics.getPublicLists = function(page = 1, limit = 10) {
    return this.find({ isPublic: true })
        .populate('user', 'username displayName')
        .sort({ lastActivity: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};

module.exports = mongoose.model('MangaList', MangaListSchema);
