const Book = require("../models/Books");
const mongoose = require("mongoose");

// Reusable pipeline stages for aggregation queries
const PIPELINE_STAGES = {
	addFields: {
		$addFields: {
			id: "$_id",
			imageUrl: {
				$concat: [
					`${process.env.API_URL}/api/books/`,
					{ $toString: "$_id" },
					"/image",
				],
			},
		},
	},

	project: {
		$project: {
			_id: 1,
			id: 1,
			title: 1,
			author: 1,
			year: 1,
			genre: 1,
			userId: 1,
			imageUrl: 1,
			averageRating: { $round: ["$averageRating", 1] },
		},
	},
};

// Indexes for optimizing common queries
const INDEXES = {
	byId: { _id: 1 },
	byRating: { averageRating: -1 },
	byTitleAuthor: { title: 1, author: 1 },
};

/**
 * Creates a new book
 */
exports.createBook = async (req, res, next) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "Missing book image" });
		}

		const book = new Book({
			...req.validatedBook,
			userId: req.auth.userId,
			image: req.file.buffer,
			imageContentType: req.file.mimetype,
		});

		await book.save();
		res.status(201).json({ message: "Book added successfully!" });
	} catch (error) {
		next(error);
	}
};

/**
 * Updates an existing book
 */
exports.modifyBook = async (req, res, next) => {
	try {
		const book = await Book.findOne({ _id: req.params.id });
		if (!book) {
			return res.status(404).json({ error: "Book not found" });
		}

		if (book.userId !== req.auth.userId) {
			return res
				.status(403)
				.json({ error: "Unauthorized modification attempt" });
		}

		const bookObject = req.file
			? {
					...JSON.parse(req.body.book),
					image: req.file.buffer,
					imageContentType: req.file.mimetype,
				}
			: {
					...req.body,
					image: book.image,
					imageContentType: book.imageContentType,
				};

		const { _userId, ...updateData } = bookObject;

		const updatedBook = await Book.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true },
		);

		if (!updatedBook) {
			return res.status(404).json({ error: "Book not found after update" });
		}

		const [formattedBook] = await Book.aggregate([
			{ $match: { _id: updatedBook._id } },
			{ $addFields: PIPELINE_STAGES.addFields.$addFields },
			{ $project: PIPELINE_STAGES.project.$project },
		]);

		res.status(200).json(formattedBook);
	} catch (error) {
		next(error);
	}
};

/**
 * Deletes a book and its image
 */
exports.deleteBook = async (req, res, next) => {
	try {
		const book = await Book.findOne({ _id: req.params.id });
		if (!book) {
			return res.status(404).json({ error: "Book not found" });
		}

		if (book.userId !== req.auth.userId) {
			return res
				.status(403)
				.json({ error: "Not authorized to delete this book" });
		}

		await Book.deleteOne({ _id: req.params.id });
		res.status(200).json({ message: "Book deleted successfully!" });
	} catch (error) {
		next(error);
	}
};

/**
 * Gets a single book by ID
 */
exports.getOneBook = async (req, res, next) => {
	try {
		const userId = req.query.userId;
		const bookId = new mongoose.Types.ObjectId(req.params.id);

		const pipeline = [
			{ $match: { _id: bookId } },
			{
				$addFields: {
					...PIPELINE_STAGES.addFields.$addFields,
					...(userId && {
						userRating: {
							$let: {
								vars: {
									userRating: {
										$filter: {
											input: "$ratings",
											as: "rating",
											cond: { $eq: ["$$rating.userId", userId] },
										},
									},
								},
								in: { $arrayElemAt: ["$$userRating.grade", 0] },
							},
						},
					}),
				},
			},
			{
				$project: {
					...PIPELINE_STAGES.project.$project,
					...(userId && { userRating: 1 }),
				},
			},
		];

		const [book] = await Book.aggregate(pipeline).hint(INDEXES.byId);

		if (!book) {
			return res.status(404).json({ error: "Book not found" });
		}

		res.status(200).json(book);
	} catch (error) {
		next(error);
	}
};

/**
 * Gets all books with optional filtering
 */
exports.getAllBooks = async (req, res, next) => {
	try {
		const { title, author, year, rating, genre, page, limit } = req.query;
		const query = {};
		const queryOr = [];

		if (title || author) {
			queryOr.push(
				...[
					title && { title: new RegExp(title, "i") },
					author && { author: new RegExp(author, "i") },
				].filter(Boolean),
			);
		}

		if (queryOr.length) query.$or = queryOr;
		if (year) query.year = Number.parseInt(year, 10);
		if (rating) query.averageRating = { $gte: Number.parseFloat(rating) };
		if (genre) {
			query.$or = [...(query.$or || []), { genre: new RegExp(genre, "i") }];
		}

		if (!page && !limit) {
			const books = await Book.aggregate([
				{ $match: query },
				{ $sort: { title: 1 } },
				{ $addFields: PIPELINE_STAGES.addFields.$addFields },
				{ $project: PIPELINE_STAGES.project.$project },
			]).hint(INDEXES.byTitleAuthor);

			return res.status(200).json(books);
		}

		const pageNum = Number.parseInt(page, 10) || 1;
		const limitNum = Number.parseInt(limit, 10) || 12;
		const skip = (pageNum - 1) * limitNum;

		const [result] = await Book.aggregate([
			{ $match: query },
			{
				$facet: {
					totalBooks: [{ $count: "count" }],
					books: [
						{ $sort: { title: 1 } },
						{ $skip: skip },
						{ $limit: limitNum },
						{ $addFields: PIPELINE_STAGES.addFields.$addFields },
						{ $project: PIPELINE_STAGES.project.$project },
					],
				},
			},
			{
				$project: {
					totalBooks: { $arrayElemAt: ["$totalBooks.count", 0] },
					books: 1,
					hasMore: {
						$lt: [
							{ $add: [skip, { $size: "$books" }] },
							{ $arrayElemAt: ["$totalBooks.count", 0] },
						],
					},
				},
			},
		]).hint(INDEXES.byTitleAuthor);

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * Gets top 3 rated books
 */
exports.getBestRatedBooks = async (req, res, next) => {
	try {
		const books = await Book.aggregate([
			{ $sort: { averageRating: -1 } },
			{ $limit: 3 },
			{ $addFields: PIPELINE_STAGES.addFields.$addFields },
			{ $project: PIPELINE_STAGES.project.$project },
		]).hint(INDEXES.byRating);

		res.status(200).json(books);
	} catch (error) {
		next(error);
	}
};

/**
 * Rates a book
 */
exports.rateBook = async (req, res, next) => {
	try {
		const { rating, userId } = req.validatedData;
		const book = await Book.findOne({ _id: req.params.id });

		if (!book) {
			return res.status(404).json({ error: "Book not found" });
		}

		if (book.ratings.some((r) => r.userId === userId)) {
			return res
				.status(400)
				.json({ error: "You have already rated this book" });
		}

		book.ratings.push({ userId, grade: rating });
		book.averageRating = Number(
			(
				(book.averageRating * (book.ratings.length - 1) + rating) /
				book.ratings.length
			).toFixed(3),
		);

		await book.save();

		const [formattedBook] = await Book.aggregate([
			{ $match: { _id: book._id } },
			{
				$addFields: {
					...PIPELINE_STAGES.addFields.$addFields,
					userRating: rating,
				},
			},
			{
				$project: {
					...PIPELINE_STAGES.project.$project,
					userRating: 1,
				},
			},
		]);

		res.status(200).json(formattedBook);
	} catch (error) {
		next(error);
	}
};

/**
 * Serves book images
 */
exports.getBookImage = async (req, res, next) => {
	try {
		const book = await Book.findById(req.params.id, {
			image: 1,
			imageContentType: 1,
		});
		if (!book?.image) {
			return res.status(404).json({ error: "Image not found" });
		}

		res.set("Content-Type", book.imageContentType);
		res.send(book.image);
	} catch (error) {
		next(error);
	}
};
