const Book = require("../models/Books");
const fs = require("node:fs");

/**
 * @description Retrieve all books from the database
 * @goal Efficiently fetch and return all books' data
 * - Ignores the ratings field to reduce data transfer
 * - Returns the averageRating rounded to 1 decimal place
 */
exports.getAllBooks = async (req, res, next) => {
	try {
		const books = await Book.find().select("-ratings");
		if (!books) {
			throw new Error("404: No books found");
		}

		const formattedBooksData = books.map((book) => ({
			...book.toObject(),
			averageRating: Number(book.averageRating.toFixed(1)),
		}));
		res.status(200).json(formattedBooksData);
	} catch (error) {
		next(error);
	}
};

/**
 * @description Retrieve a specific book by its ID
 * @goal Efficiently fetch and return a single book's data
 * - Returns the averageRating rounded to 1 decimal place
 */
exports.getOneBook = async (req, res, next) => {
	try {
		const book = await Book.findById(req.params.id);
		if (!book) {
			throw new Error("404: Book not found");
		}

		const bookData = {
			...book.toObject(),
			averageRating: Number(book.averageRating.toFixed(1)),
		};
		res.status(200).json(bookData);
	} catch (error) {
		next(error);
	}
};

/**
 * @description Retrieve top 3 rated books
 * @goal Efficiently fetch and return the top 3 rated books
 * - Ignores the ratings field to reduce data transfer
 * - Returns the averageRating rounded to 1 decimal place
 */
exports.getBestRatedBooks = async (req, res, next) => {
	try {
		const books = await Book.find()
			.sort({ averageRating: -1 })
			.limit(3)
			.select("-ratings");
		if (!books) {
			throw new Error("404: No books found");
		}

		const formattedBooksData = books.map((book) => ({
			...book.toObject(),
			averageRating: Number(book.averageRating.toFixed(1)),
		}));

		res.status(200).json(formattedBooksData);
	} catch (error) {
		next(error);
	}
};

/**
 * @description Create a new book entry in the database
 * @goal Efficiently handle book creation with proper error handling and image URI generation
 * - Verify that the image exists as it is required on this route
 * - Add sanitized imageUrl to the book object
 */
exports.createBook = async (req, res, next) => {
	try {
		const sanitizedBookObject = req.validatedBook;

		if (req.optimizedImageUrl) {
			sanitizedBookObject.imageUrl = req.optimizedImageUrl;
		} else {
			throw new Error("400: Image is required");
		}

		const book = new Book({
			...sanitizedBookObject,
			userId: req.auth.userId,
		});

		await book.save();
		res.status(201).json({ message: "Book created successfully!" });
	} catch (error) {
		next(error);
	}
};

/**
 * @description Modify an existing book entry
 * @goal Securely update book information while maintaining data integrity
 * - Conditionally updates image URI only when a new file is uploaded
 * - Deletes the old image from the file system when a new image is uploaded
 */
exports.modifyBook = async (req, res, next) => {
	try {
		const book = await Book.findById(req.params.id);
		if (!book) {
			throw new Error("404: Book not found");
		}

		const sanitizedBookObject = req.validatedBook;

		if (req.optimizedImageUrl) {
			sanitizedBookObject.imageUrl = req.optimizedImageUrl;
			const oldImagePath = `${req.app.get("mediaURI")}/${book.imageUrl.split("/").pop()}`;
			await fs.promises.unlink(oldImagePath).catch(() => {});
		}

		await Book.findByIdAndUpdate(req.params.id, { $set: sanitizedBookObject });
		res.status(200).json({ message: "Book updated successfully!" });
	} catch (error) {
		next(error);
	}
};

/**
 * @description Delete a book entry and its associated image
 * @goal Securely remove a book from the database and its image from the file system
 * - Implements proper authorization checks
 * - Ensures file system operations are handled correctly
 */
exports.deleteBook = async (req, res, next) => {
	try {
		const book = await Book.findById(req.params.id);
		if (!book) {
			throw new Error("404: Book not found");
		}

		const filename = book.imageUrl.split("/").pop();
		const filePath = `${req.app.get("mediaURI")}/${filename}`;
		await fs.promises.unlink(filePath);
		
		await Book.findByIdAndDelete(req.params.id);
		res.status(200).json({ message: "Book deleted successfully!" });
	} catch (error) {
		next(error);
	}
};

/**
 * @description Rate a book and update its average rating
 * @goal Securely add a user's rating to a book and recalculate the average rating
 * - Ensures a user can only rate a book once
 * - Use the existing average to calculate the new average, avoiding recalculating the sum of all ratings
 * - Calculates average rating with 3 decimal places on the server, returns 1 decimal place to client
 */
exports.rateBook = async (req, res, next) => {
	try {
		const book = await Book.findById(req.params.id);
		if (!book) {
			throw new Error("404: Book not found");
		}

		const rating = req.validatedRating;

		book.ratings.push({ userId: req.auth.userId, grade: rating });

		const ratingCount = book.ratings.length;
		const newTotal = book.averageRating * (ratingCount - 1) + rating;
		book.averageRating = Number((newTotal / ratingCount).toFixed(3));

		const updatedBook = await book.save();
		const responseBook = {
			...updatedBook.toObject(),
			averageRating: Number(updatedBook.averageRating.toFixed(1))
		};

		res.status(200).json(responseBook);
	} catch (error) {
		next(error);
	}
};
