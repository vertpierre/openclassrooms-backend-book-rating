const mongoose = require("mongoose");

/**
 * Book schema for MongoDB
 * @description Defines the structure and validation for book data
 */
const ratingSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: [true, "User ID is required for rating"],
		},
		grade: {
			type: Number,
			required: [true, "Rating grade is required"],
			min: [1, "Rating must be at least 1"],
			max: [5, "Rating cannot exceed 5"],
		},
	},
	{ _id: false },
); // Disable _id for subdocuments to improve performance

const bookSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Book title is required"],
			trim: true,
		},
		author: {
			type: String,
			required: [true, "Author name is required"],
			trim: true,
		},
		image: {
			type: Buffer,
			required: [true, "Book image is required"],
		},
		imageContentType: {
			type: String,
			required: [true, "Image content type is required"],
		},
		userId: {
			type: String,
			required: [true, "User ID is required"],
		},
		year: {
			type: Number,
			required: [true, "Publication year is required"],
		},
		genre: {
			type: String,
			required: [true, "Book genre is required"],
			trim: true,
		},
		ratings: [ratingSchema],
		averageRating: {
			type: Number,
			default: 1,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Virtual for image URL
bookSchema.virtual("imageUrl").get(function () {
	return `/api/books/${this._id}/image`;
});

// Compound indexes for common queries
bookSchema.index({ title: 1, author: 1 });

module.exports = mongoose.model("Book", bookSchema);
