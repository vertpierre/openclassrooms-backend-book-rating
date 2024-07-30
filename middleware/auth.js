const jwt = require("jsonwebtoken");
require('dotenv').config();

/**
 * Middleware for JWT-based authentication.
 * Verifies the token from the request headers and adds the userId to the request object.
 */
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;
        req.auth = { userId };
        next();
    } catch (error) {
        res.status(401).json({ error: "Authentication failed" });
    }
};
