const jwt = require("jsonwebtoken");
require('dotenv').config();

/**
 * @description JWT-based authentication middleware
 * @goal Secure API routes by verifying user tokens and attaching user information to requests
 * - Uses environment variables for JWT secret to enhance security
 * - Implements error handling to prevent information leakage
 * - Extracts only necessary information (userId) from the token for efficiency
 */
module.exports = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = req.headers.authorization.split(" ")[1];
        // Verify token using JWT_SECRET from environment variables
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;
        req.auth = { userId };
        next();
    } catch (error) {
        // Return a generic error message to avoid leaking sensitive information
        res.status(401).json({ error: "Authentication failed" });
    }
};
