const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../../models/Books');

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

describe('Book Model Test', () => {
  it('should validate a book with all required fields', async () => {
    const validBook = new Book({
      title: 'Test Book',
      author: 'Test Author',
      imageUrl: 'http://test.com/image.jpg',
      userId: 'testUserId',
      year: 2023,
      genre: 'Test Genre',
    });
    const savedBook = await validBook.save();
    expect(savedBook._id).toBeDefined();
    expect(savedBook.title).toBe('Test Book');
    expect(savedBook.averageRating).toBe(0);
    expect(savedBook.ratings).toEqual([]);
  });

  it('should not validate a book with missing required fields', async () => {
    const invalidBook = new Book({
      title: 'Test Book',
      // Missing other required fields
    });
    await expect(invalidBook.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should not allow ratings outside the range of 1-5', async () => {
    const book = new Book({
      title: 'Test Book',
      author: 'Test Author',
      imageUrl: 'http://test.com/image.jpg',
      userId: 'testUserId',
      year: 2023,
      genre: 'Test Genre',
      ratings: [{ userId: 'user1', grade: 6 }],
    });
    await expect(book.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});