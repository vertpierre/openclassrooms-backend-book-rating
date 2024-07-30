const mongoose = require("mongoose");

/**
 * @description Book schema for MongoDB
 * @goal Define a robust and efficient structure for book data in the database
 * - Uses Mongoose schema for data validation and type checking
 * - Implements default value for averageRating to ensure consistency
 * - Nested schema for ratings to support efficient updates and queries
 * - Schema design supports potential future features like book categories or multiple authors
 * - Ratings array allows for easy calculation of statistics and trending books
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
			grade: { type: Number, required: true, min: 1, max: 5 },
		},
	],
	averageRating: { type: Number, default: 0 },
});

module.exports = mongoose.model("Book", bookSchema);
