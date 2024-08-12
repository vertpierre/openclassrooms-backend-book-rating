const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/auth');

describe('Auth Middleware Test', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next() when a valid token is provided', () => {
    const token = jwt.sign({ userId: 'testUserId' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(req.auth).toEqual({ userId: 'testUserId' });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 when no token is provided', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when an invalid token is provided', () => {
    req.headers.authorization = 'Bearer invalidtoken';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});