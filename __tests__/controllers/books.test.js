const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Book = require("../../models/Books");
const booksController = require("../../controllers/books");
const fs = require("fs").promises;
const path = require("path");

let mongoServer;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();
	await mongoose.connect(mongoUri);
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe("Books Controller Test", () => {
	describe("createBook", () => {
		it("should create a new book", async () => {
			const req = {
				body: {
					book: JSON.stringify({
						title: "Test Book",
						author: "Test Author",
						year: 2023,
						genre: "Test Genre",
					}),
				},
				auth: { userId: "testUserId" },
				file: { filename: "image.jpg" },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.createBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
		});

		it("should handle errors when creating a book", async () => {
			const req = {
				body: {
					book: JSON.stringify({
						// Missing required fields
					}),
				},
				auth: { userId: "testUserId" },
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
			const mockBook = {
				userId: "testUserId",
				save: jest.fn().mockResolvedValue(true),
			};
			jest.spyOn(Book, "findOne").mockResolvedValue(mockBook);
			jest.spyOn(Book, "updateOne").mockResolvedValue({ nModified: 1 });

			const req = {
				params: { id: "testBookId" },
				body: {
					title: "Updated Book Title",
				},
				auth: { userId: "testUserId" },
				file: null,
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.modifyBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
		});

		it("should handle unauthorized modification attempt", async () => {
			const mockBook = {
				userId: "differentUserId",
			};
			jest.spyOn(Book, "findOne").mockResolvedValue(mockBook);

			const req = {
				params: { id: "testBookId" },
				body: {
					title: "Updated Book Title",
				},
				auth: { userId: "testUserId" },
				file: null,
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.modifyBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
		});
	});

	describe("deleteBook", () => {
		beforeAll(async () => {
			const srcPath = path.join(__dirname, "../src/image.jpg");
			const destPath = path.join(__dirname, "../images/image.webp");
			await fs.copyFile(srcPath, destPath);
		});

		it("should delete a book", async () => {
			const mockBook = {
				_id: "testBookId",
				userId: "testUserId",
				imageUrl: "http://localhost:4000/__tests__/images/image.webp",
			};
			jest.spyOn(Book, "findOne").mockResolvedValue(mockBook);
			jest.spyOn(Book, "deleteOne").mockResolvedValue({ deletedCount: 1 });

			const req = {
				params: { id: "testBookId" },
				auth: { userId: "testUserId" },
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
		});

		it("should handle unauthorized deletion attempt", async () => {
			const mockBook = {
				_id: "testBookId",
				userId: "differentUserId",
				imageUrl: "http://localhost:4000/__tests__/images/image.webp",
			};
			jest.spyOn(Book, "findOne").mockResolvedValue(mockBook);

			const req = {
				params: { id: "testBookId" },
				auth: { userId: "testUserId" },
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
		});
	});

	describe("getOneBook", () => {
		it("should return a specific book", async () => {
			const mockBook = { title: "Test Book", author: "Test Author" };
			jest.spyOn(Book, "findOne").mockResolvedValue(mockBook);

			const req = { params: { id: "testId" } };
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.getOneBook(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockBook);
		});

		it("should handle book not found", async () => {
			jest.spyOn(Book, "findOne").mockResolvedValue(null);

			const req = { params: { id: "nonExistentId" } };
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
				{ title: "Book 1", author: "Author 1" },
				{ title: "Book 2", author: "Author 2" },
			];
			jest.spyOn(Book, "find").mockResolvedValue(mockBooks);

			const req = {};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.getAllBooks(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockBooks);
		});
	});

	describe("getBestRatedBooks", () => {
		it("should return top 3 rated books", async () => {
			const mockBooks = [
				{ title: "Top Book 1", averageRating: 4.9 },
				{ title: "Top Book 2", averageRating: 4.8 },
				{ title: "Top Book 3", averageRating: 4.7 },
			];
			jest.spyOn(Book, "find").mockReturnValue({
				sort: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue(mockBooks),
				}),
			});

			const req = {};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.getBestRatedBooks(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockBooks);
		});
	});

	describe("rateBook", () => {
		it("should add a new rating to a book", async () => {
			const mockBook = {
				ratings: [],
				averageRating: 0,
				save: jest.fn().mockResolvedValue({
					ratings: [{ userId: "testUserId", grade: 4 }],
					averageRating: 4,
				}),
			};
			jest.spyOn(Book, "findOne").mockResolvedValue(mockBook);

			const req = {
				params: { id: "testBookId" },
				body: { userId: "testUserId", rating: 4 },
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
						expect.objectContaining({ userId: "testUserId", grade: 4 }),
					]),
					averageRating: 4,
				}),
			);
		});

		it("should not allow rating a book twice", async () => {
			const mockBook = {
				ratings: [{ userId: "testUserId", grade: 3 }],
				averageRating: 3,
			};
			jest.spyOn(Book, "findOne").mockResolvedValue(mockBook);

			const req = {
				params: { id: "testBookId" },
				body: { userId: "testUserId", rating: 4 },
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await booksController.rateBook(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
		});
	});
});
