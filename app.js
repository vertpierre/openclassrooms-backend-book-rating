// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require('dotenv').config();

// Import route handlers
const bookRoutes = require("./routes/books");
const userRoutes = require("./routes/user");

// Initialize Express app
const app = express();

/**
 * Connect to MongoDB using the connection string from environment variables.
 * This approach enhances security by keeping sensitive information out of the codebase.
 */
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Successfully connected to MongoDB!"))
    .catch((error) => console.error("Failed to connect to MongoDB:", error));

// Middleware for parsing JSON bodies
app.use(express.json());

/**
 * CORS configuration middleware
 * This setup allows cross-origin requests, which is essential for frontend integration
 */
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    next();
});

// Route handlers
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

// Serve static files (book cover images)
app.use("/images", express.static(path.join(__dirname, "images")));

// Export the app for use in server.js
module.exports = app;
