const mongoose = require('mongoose');
const Book = require('../../models/Books');
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.DEV_MONGODB_URI);
}, 10000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Book Model Test', () => {
  it('should validate a book with all required fields', async () => {
    const validBook = new Book({
      title: "__TEST__ Book",
      author: "__TEST__ Author",
      imageUrl: "http://test.com/image.jpg",
      userId: "__TEST__testUserId",
      year: 2023,
      genre: "__TEST__ Genre",
    });
    const savedBook = await validBook.save();
    expect(savedBook._id).toBeDefined();
    expect(savedBook.title).toBe("__TEST__ Book");
    expect(savedBook.averageRating).toBe(0);
    expect(savedBook.ratings).toEqual([]);

    // Clean up the created book
    await Book.findByIdAndDelete(savedBook._id);
  });

  it('should not validate a book with missing required fields', async () => {
    const invalidBook = new Book({
      title: "__TEST__ Book",
      // Missing other required fields
    });
    await expect(invalidBook.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should not allow ratings outside the range of 1-5', async () => {
    const book = new Book({
      title: "__TEST__ Book",
      author: "__TEST__ Author",
      imageUrl: "http://test.com/image.jpg",
      userId: "__TEST__userId",
      year: 2023,
      genre: "__TEST__ Genre",
      ratings: [{ userId: "__TEST__userId", grade: 6 }],
    });
    
    await expect(book.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});