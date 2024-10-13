const jwt = require("jsonwebtoken");
const Book = require("../models/Books");

/**
 * @description JWT-based authentication middleware
 * @goal Secure API routes by verifying user tokens and attaching user information to requests
 * - Uses environment variables for JWT secret to enhance security
 * - Extracts only necessary information (userId) from the token for efficiency
 */
const isAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, req.app.get("jwtSecret"));
        const userId = decodedToken.userId;
        req.auth = { userId };
        next();
    } catch (error) {
        throw new Error("403: Unauthorized request");
    }
};

/**
 * @description Validate user access to modify, delete, or rate a book
 * @goal Ensure proper authorization for book-related actions
 */
const hasAccess = async (req, res, next, action) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            throw new Error("404: Book not found");
        }
        
        if (action === 'owner') {
            if (book.userId.toString() !== req.auth.userId) {
                throw new Error("403: Unauthorized access to this book");
            }
        } else if (action === 'rate') {
            if (book.ratings.some((r) => r.userId === req.auth.userId)) {
                throw new Error("400: You have already rated this book");
            }
        } else {
            throw new Error("400: Invalid action");
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

const isOwner = (req, res, next) => hasAccess(req, res, next, 'owner');
const isRated = (req, res, next) => hasAccess(req, res, next, 'rate');

module.exports = { isAuth, isOwner, isRated };