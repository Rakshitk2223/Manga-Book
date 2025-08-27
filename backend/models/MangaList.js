const mongoose = require('mongoose');

const MangaListSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categories: { type: Object, required: true, default: {} }
});

module.exports = mongoose.model('MangaList', MangaListSchema);
