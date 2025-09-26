const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        match: /^[a-zA-Z0-9_]+$/
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    recoveryKeyword: {
        type: String,
        required: true
        // No length validation since this will be hashed (60 chars for bcrypt)
    },
    displayName: { 
        type: String,
        trim: true,
        maxlength: 50
    },
    avatarUrl: { 
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Avatar URL must be a valid HTTP/HTTPS URL'
        }
    },
    preferences: {
        theme: { type: String, default: 'dark', enum: ['light', 'dark', 'auto'] },
        itemsPerPage: { type: Number, default: 20, min: 10, max: 100 }
    },
    // Simple fields
    isActive: { type: Boolean, default: true },
    // Privacy settings
    profilePublic: { type: Boolean, default: false },
    listsPublic: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Indexes for performance (email and username already have unique indexes)
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLogin: -1 });



// Pre-save middleware to hash password and recovery keyword
UserSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
        }
        
        if (this.isModified('recoveryKeyword')) {
            const salt = await bcrypt.genSalt(12);
            this.recoveryKeyword = await bcrypt.hash(this.recoveryKeyword, salt);
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Simple method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare recovery keyword
UserSchema.methods.compareRecoveryKeyword = async function(candidateKeyword) {
    return await bcrypt.compare(candidateKeyword, this.recoveryKeyword);
};

// Method to safely return user data (without password)
UserSchema.methods.toSafeObject = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.recoveryKeyword;
    return userObject;
};

module.exports = mongoose.model('User', UserSchema);
