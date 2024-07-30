const mongoose = require('mongoose');

/**
 * Book schema for MongoDB.
 * Defines the structure for book data in the database.
 */
const bookSchema = mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    imageUrl: { type: String, required: true },
    userId: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    ratings: [
        {
            userId: { type: String, required: true },
            grade: { type: Number, required: true }
        }
    ],
    averageRating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Book', bookSchema);