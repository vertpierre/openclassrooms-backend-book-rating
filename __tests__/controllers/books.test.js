const mongoose = require("mongoose");
const Book = require("../../models/Books");
const booksController = require("../../controllers/books");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const API_URI = process.env.DEV_API_URI;

beforeAll(async () => {
	await mongoose.connect(process.env.DEV_MONGODB_URI);
});

afterAll(async () => {
	// Delete all books and users that contain "__TEST__" in their fields
	await Book.deleteMany({ title: { $regex: "__TEST__" } });
	await mongoose.connection.close();
});

describe("Books Controller Test", () => {
	describe("createBook", () => {
		it("should create a new book", async () => {
			const mockBook = {
				title: "__TEST__ Book",
				author: "__TEST__ Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Genre",
			};

			const req = {
				body: {
					book: JSON.stringify(mockBook),
				},
				auth: { userId: mockBook.userId },
				file: { filename: "image.jpg" },
				app: {
					get: jest.fn().mockReturnValue(API_URI),
				},
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.createBook(req, res);

			expect(res.status).toHaveBeenCalledWith(201);

			// Delete the created book
			await Book.deleteOne({ title: mockBook.title });
		});

		it("should handle errors when creating a book", async () => {
			const req = {
				body: {
					book: JSON.stringify({
						// Missing required fields
					}),
				},
				auth: { userId: "__TEST__userId" },
				file: { filename: "image.jpg" },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.createBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
		});
	});

	describe("modifyBook", () => {
		it("should modify an existing book", async () => {
			const mockBook = new Book({
				title: "__TEST__ Original Title",
				author: "__TEST__ Original Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Original Genre",
				imageUrl: "http://example.com/image.jpg",
			});
			await mockBook.save();

			const req = {
				params: { id: mockBook._id.toString() },
				body: {
					book: JSON.stringify({
						title: "__TEST__ Updated Book Title",
					}),
				},
				auth: { userId: mockBook.userId },
				file: null,
				app: {
					get: jest.fn().mockReturnValue(API_URI),
				},
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.modifyBook(req, res);

			expect(res.status).toHaveBeenCalledWith(200);

			// Delete the modified book
			await Book.findByIdAndDelete(mockBook._id);
		});

		it("should handle unauthorized modification attempt", async () => {
			const mockBook = new Book({
				title: "__TEST__ Book",
				author: "__TEST__ Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Genre",
				imageUrl: "http://example.com/image.jpg",
			});
			await mockBook.save();

			const req = {
				params: { id: mockBook._id.toString() },
				body: {
					book: JSON.stringify({
						title: "__TEST__ Updated Book Title",
					}),
				},
				auth: { userId: "__TEST__differentUserId" },
				file: null,
				app: {
					get: jest.fn().mockReturnValue(API_URI),
				},
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.modifyBook(req, res);

			expect(res.status).toHaveBeenCalledWith(403);

			// Delete the test book
			await Book.findByIdAndDelete(mockBook._id);
		});
	});

	describe("deleteBook", () => {
		beforeAll(async () => {
			const srcPath = path.join(__dirname, "../src/image.jpg");
			const destPath = path.join(__dirname, "../images/image.webp");
			await fs.copyFile(srcPath, destPath);
		});

		it("should delete a book", async () => {
			const mockBook = new Book({
				title: "__TEST__ Book to Delete",
				author: "__TEST__ Delete Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Delete Genre",
				imageUrl: `${API_URI}/__tests__/images/image.webp`,
			});
			await mockBook.save();

			const req = {
				params: { id: mockBook._id },
				auth: { userId: "__TEST__userId" },
				app: {
					get: jest.fn().mockReturnValue(path.join(__dirname, "..")),
				},
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.deleteBook(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(
				fs.access(path.join(__dirname, "../images/image.webp")),
			).rejects.toThrow();

			// Verify that the book was deleted
			const deletedBook = await Book.findById(mockBook._id);
			expect(deletedBook).toBeNull();
		});

		it("should handle unauthorized deletion attempt", async () => {
			const mockBook = new Book({
				title: "__TEST__ Book Not to Delete",
				author: "__TEST__ No Delete Author",
				userId: "__TEST__differentUserId",
				year: 2023,
				genre: "__TEST__ No Delete Genre",
				imageUrl: `${API_URI}/__tests__/images/image.webp`,
			});
			await mockBook.save();

			const req = {
				params: { id: mockBook._id },
				auth: { userId: "__TEST__userId" },
				app: {
					get: jest.fn().mockReturnValue(path.join(__dirname, "..")),
				},
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.deleteBook(req, res);

			expect(res.status).toHaveBeenCalledWith(403);

			// Delete the test book
			await Book.findByIdAndDelete(mockBook._id);
		});
	});

	describe("getOneBook", () => {
		it("should return a specific book", async () => {
			const mockBook = new Book({
				title: "__TEST__ Book",
				author: "__TEST__ Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Genre",
				imageUrl: `${API_URI}/__tests__/images/image.webp`,
			});
			await mockBook.save();

			const req = { params: { id: mockBook._id.toString() } };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.getOneBook(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "__TEST__ Book",
					author: "__TEST__ Author",
				}),
			);

			// Delete the test book
			await Book.findByIdAndDelete(mockBook._id);
		});

		it("should handle book not found", async () => {
			const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.getOneBook(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
		});
	});

	describe("getAllBooks", () => {
		it("should return all books", async () => {
			const mockBooks = [
				new Book({
					title: "__TEST__ Book 1",
					author: "__TEST__ Author 1",
					userId: "__TEST__userId",
					year: 2023,
					genre: "__TEST__ Genre 1",
					imageUrl: `${API_URI}/__tests__/images/image.webp`,
				}),
				new Book({
					title: "__TEST__ Book 2",
					author: "__TEST__ Author 2",
					userId: "__TEST__userId",
					year: 2023,
					genre: "__TEST__ Genre 2",
					imageUrl: `${API_URI}/__tests__/images/image.webp`,
				}),
			];
			await Book.insertMany(mockBooks);

			const req = {};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.getAllBooks(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						title: "__TEST__ Book 1",
						author: "__TEST__ Author 1",
					}),
					expect.objectContaining({
						title: "__TEST__ Book 2",
						author: "__TEST__ Author 2",
					}),
				]),
			);

			// Delete the test books
			await Book.deleteMany({
				title: { $in: ["__TEST__ Book 1", "__TEST__ Book 2"] },
			});
		});
	});

	describe("getBestRatedBooks", () => {
		it("should return top 3 rated books", async () => {
			const mockBooks = [
				new Book({
					title: "__TEST__ Top Book 1",
					author: "__TEST__ Author 1",
					userId: "__TEST__userId",
					year: 2023,
					genre: "__TEST__ Genre 1",
					imageUrl: `${API_URI}/__tests__/images/image.webp`,
					averageRating: 4.9,
				}),
				new Book({
					title: "__TEST__ Top Book 2",
					author: "__TEST__ Author 2",
					userId: "__TEST__userId",
					year: 2023,
					genre: "__TEST__ Genre 2",
					imageUrl: `${API_URI}/__tests__/images/image.webp`,
					averageRating: 4.8,
				}),
				new Book({
					title: "__TEST__ Top Book 3",
					author: "__TEST__ Author 3",
					userId: "__TEST__userId",
					year: 2023,
					genre: "__TEST__ Genre 3",
					imageUrl: `${API_URI}/__tests__/images/image.webp`,
					averageRating: 4.7,
				}),
				new Book({
					title: "__TEST__ Low Rated Book",
					author: "__TEST__ Author 4",
					userId: "__TEST__userId",
					year: 2023,
					genre: "__TEST__ Genre 4",
					imageUrl: `${API_URI}/__tests__/images/image.webp`,
					averageRating: 3.0,
				}),
			];
			await Book.insertMany(mockBooks);

			const req = {};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.getBestRatedBooks(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						title: "__TEST__ Top Book 1",
						averageRating: 4.9,
					}),
					expect.objectContaining({
						title: "__TEST__ Top Book 2",
						averageRating: 4.8,
					}),
					expect.objectContaining({
						title: "__TEST__ Top Book 3",
						averageRating: 4.7,
					}),
				]),
			);
			expect(res.json).not.toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						title: "__TEST__ Low Rated Book",
						averageRating: 3.0,
					}),
				]),
			);

			// Delete the test books
			await Book.deleteMany({
				title: {
					$in: [
						"__TEST__ Top Book 1",
						"__TEST__ Top Book 2",
						"__TEST__ Top Book 3",
						"__TEST__ Low Rated Book",
					],
				},
			});
		});
	});

	describe("rateBook", () => {
		it("should add a new rating to a book", async () => {
			const mockBook = new Book({
				title: "__TEST__ Book to Rate",
				author: "__TEST__ Rate Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Rate Genre",
				imageUrl: "http://example.com/image.jpg",
				ratings: [],
				averageRating: 0,
			});
			await mockBook.save();

			const req = {
				params: { id: mockBook._id.toString() },
				body: { userId: "__TEST__userId", rating: 4 },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.rateBook(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					ratings: expect.arrayContaining([
						expect.objectContaining({ userId: "__TEST__userId", grade: 4 }),
					]),
					averageRating: 4,
				}),
			);

			// Delete the test book
			await Book.findByIdAndDelete(mockBook._id);
		});

		it("should not allow rating a book twice", async () => {
			const mockBook = new Book({
				title: "__TEST__ Book Already Rated",
				author: "__TEST__ Rated Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Rated Genre",
				imageUrl: "http://example.com/image.jpg",
				ratings: [{ userId: "__TEST__userId", grade: 3 }],
				averageRating: 3,
			});
			await mockBook.save();

			const req = {
				params: { id: mockBook._id.toString() },
				body: { userId: "__TEST__userId", rating: 4 },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.rateBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);

			// Delete the test book
			await Book.findByIdAndDelete(mockBook._id);
		});

		it("should not allow rating of 0 or more than 5", async () => {
			const mockBook = new Book({
				title: "__TEST__ Book Invalid Rating",
				author: "__TEST__ Invalid Rating Author",
				userId: "__TEST__userId",
				year: 2023,
				genre: "__TEST__ Invalid Rating Genre",
				imageUrl: "http://example.com/image.jpg",
				ratings: [],
				averageRating: 0,
			});
			await mockBook.save();

			const req = {
				params: { id: mockBook._id.toString() },
				body: { userId: "__TEST__userId", rating: 0 },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.rateBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);

			req.body.rating = 6;
			await booksController.rateBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);

			// Delete the test book
			await Book.findByIdAndDelete(mockBook._id);
		});
	});
});
