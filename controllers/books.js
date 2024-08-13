const Book = require("../models/Books");
const fs = require("fs");
/**
 * @description Create a new book entry in the database
 * @goal Efficiently handle book creation with proper error handling and image URL generation
 * - Uses async/await for better readability and error handling
 * - Implements proper status codes for different scenarios
 * - Generates image URL using environment variables for flexibility
 * @returns {Object} JSON response with success message or error
 */
exports.createBook = async (req, res, next) => {
	try {
		const mediaUrl = req.app.get("mediaUrl");
		const bookObject = JSON.parse(req.body.book);
		const { _id, _userId, ...safeBookObject } = bookObject;

		const book = new Book({
			...safeBookObject,
			userId: req.auth.userId,
			imageUrl: `${mediaUrl}/images/${req.file.filename}`,
		});

		await book.save();
		res.status(201).json({ message: "Book added successfully!" });
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

/**
 * @description Modify an existing book entry
 * @goal Securely update book information while maintaining data integrity
 * - Uses async/await for cleaner code structure
 * - Implements proper authorization checks
 * - Conditionally updates image URL only when a new file is uploaded
 * @returns {Object} JSON response with success message or error
 */
exports.modifyBook = async (req, res, next) => {
	try {
		const mediaUrl = req.app.get("mediaUrl");
		let bookObject;

		if (req.file) {
			bookObject = {
				...JSON.parse(req.body.book),
				imageUrl: `${mediaUrl}/images/${req.file.filename}`,
			};
		} else {
			bookObject = { ...req.body };
		}

		const { _userId, ...updateData } = bookObject;

		const book = await Book.findOne({ _id: req.params.id });
		if (!book) {
			return res.status(404).json({ message: "Book not found" });
		}

		if (book.userId !== req.auth.userId) {
			return res
				.status(403)
				.json({ message: "Unauthorized modification attempt" });
		}

		await Book.updateOne(
			{ _id: req.params.id },
			{ ...updateData, _id: req.params.id },
		);
		res.status(200).json({ message: "Book updated successfully!" });
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

/**
 * @description Delete a book entry and its associated image
 * @goal Securely remove a book from the database and its image from the file system
 * - Uses async/await for better flow control
 * - Implements proper authorization checks
 * - Ensures file system operations are handled correctly
 * @returns {Object} JSON response with success message or error
 */
exports.deleteBook = async (req, res, next) => {
	try {
		const mediaDir = req.app.get("mediaDir");
		const book = await Book.findOne({ _id: req.params.id });

		if (!book) {
			return res.status(404).json({ message: "Book not found" });
		}

		if (book.userId !== req.auth.userId) {
			return res.status(403).json({ message: "Not authorized" });
		}

		const filename = book.imageUrl.split("/images/")[1];

		try {
			await fs.promises.unlink(`${mediaDir}/images/${filename}`);
		} catch (fileError) {
			console.error("Error deleting file:", fileError);
			// Continue with book deletion even if file deletion fails
		}

		await Book.deleteOne({ _id: req.params.id });
		res.status(200).json({ message: "Book deleted successfully!" });
	} catch (error) {
		console.error("Error in deleteBook:", error);
		res
			.status(500)
			.json({ error: "An error occurred while deleting the book" });
	}
};

/**
 * @description Retrieve a specific book by its ID
 * @goal Efficiently fetch and return a single book's data
 * - Uses async/await for cleaner code
 * - Implements proper error handling for book not found scenario
 * @returns {Object} JSON response with book data or error
 */
exports.getOneBook = async (req, res, next) => {
	try {
		const book = await Book.findOne({ _id: req.params.id });
		if (!book) {
			return res.status(404).json({ message: "Book not found" });
		}
		res.status(200).json(book);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

/**
 * @description Retrieve all books from the database
 * @goal Efficiently fetch and return all books' data
 * - Uses async/await for better readability
 * - Consider implementing pagination for large datasets in future
 * @returns {Object} JSON response with array of books or error
 */
exports.getAllBooks = async (req, res, next) => {
	try {
		const books = await Book.find();
		res.status(200).json(books);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

/**
 * @description Retrieve top 3 rated books
 * @goal Efficiently fetch and return the top 3 highest-rated books using MongoDB aggregation
 * - Uses MongoDB aggregation pipeline for server-side sorting and limiting
 * - Reduces data transfer and processing load on the application server
 * @returns {Object} JSON response with array of top 3 books or error
 */
exports.getBestRatedBooks = async (req, res, next) => {
	try {
		const books = await Book.aggregate([
			{ $sort: { averageRating: -1 } },
			{ $limit: 3 },
			{
				$project: {
					_id: 1,
					title: 1,
					author: 1,
					imageUrl: 1,
					year: 1,
					genre: 1,
					averageRating: 1,
				},
			},
		]);
		res.status(200).json(books);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * @description Rate a book and update its average rating
 * @goal Securely add a user's rating to a book and recalculate the average rating
 * - Uses async/await for better flow control
 * - Implements efficient database operations with minimal queries
 * - Ensures a user can only rate a book once
 * @returns {Object} JSON response with updated book data or error
 */
exports.rateBook = async (req, res, next) => {
	try {
		const { userId, rating } = req.body;

		const book = await Book.findOne({ _id: req.params.id });

		if (!book) {
			return res.status(404).json({ message: "Book not found" });
		}

		// Check if the rating is between 1 and 5
		if (rating < 1 || rating > 5) {
			return res
				.status(400)
				.json({ message: "Rating must be between 1 and 5" });
		}

		// Check if the user has already rated the book
		if (book.ratings.some((r) => r.userId === userId)) {
			return res
				.status(400)
				.json({ message: "You have already rated this book" });
		}

		// Add new rating to the array
		book.ratings.push({ userId, grade: rating });

		// Optimization: Use the existing average to calculate the new average
		// This avoids recalculating the sum of all ratings
		const oldTotal = book.averageRating * (book.ratings.length - 1);
		const newTotal = oldTotal + rating;
		book.averageRating = Number((newTotal / book.ratings.length).toFixed(3));

		const updatedBook = await book.save();
		res.status(200).json(updatedBook);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
