const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const userController = require('../../controllers/user');

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

describe('User Controller Test', () => {
  describe('signup', () => {
    it('should create a new user', async () => {
      const req = {
        body: {
          email: 'test1@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await userController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return an error for invalid email format', async () => {
      const req = {
        body: {
          email: 'invalid-email',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await userController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return an error for existing email', async () => {
      const existingUser = new User({
        email: 'existing@example.com',
        password: 'hashedPassword'
      });
      await existingUser.save();

      const req = {
        body: {
          email: 'existing@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await userController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('login', () => {
    it('should login a user and return a token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = new User({
        email: 'test2@example.com',
        password: hashedPassword
      });
      await user.save();

      const req = {
        body: {
          email: 'test2@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('userId');
      expect(response).toHaveProperty('token');
      expect(response.userId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(typeof response.token).toBe('string');
    });

    it('should return an error for non-existent user', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return an error for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = new User({
        email: 'test3@example.com',
        password: hashedPassword
      });
      await user.save();

      const req = {
        body: {
          email: 'test3@example.com',
          password: 'wrongpassword'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});