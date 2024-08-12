const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

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

describe('User Model Test', () => {
  it('should validate a user with valid email and password', async () => {
    const validUser = new User({
      email: 'test@example.com',
      password: 'password123'
    });
    const savedUser = await validUser.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe('test@example.com');
  });

  it('should not validate a user with invalid email', async () => {
    const invalidUser = new User({
      email: 'invalid-email',
      password: 'password123'
    });
    await expect(invalidUser.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});