/**
 * @description Main application file for Mon Vieux Grimoire backend.
 * Sets up the Express server, connects to MongoDB, and configures middleware and routes
 * @goal Create a scalable and secure backend architecture for the book rating application
 */

// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const compression = require("compression");
require("dotenv").config();

// Import route handlers
const bookRoutes = require("./routes/books");
const userRoutes = require("./routes/user");

/**
 * @description Initialize Express app
 */
const app = express();

// Use compression middleware to compress responses in gzip format
app.use(compression());

// Make the mediaUrl available to other modules
const mediaDir = process.env.NODE_ENV === "production" ? process.env.MEDIA_DIR : process.env.DEV_MEDIA_DIR;
app.set("mediaDir", mediaDir);
app.set("mediaUrl", `${process.env.API_URL}/${mediaDir}`);

// Set the database URL based on the environment
const dbUrl = process.env.NODE_ENV === "production" ? process.env.MONGODB_URI : process.env.DEV_MONGODB_URI;

/**
 * @description Connect to MongoDB using environment variables
 * @goal Establish database connection asynchronously for better error handling
 */
const connectToMongoDB = async () => {
	try {
		await mongoose.connect(dbUrl, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("Successfully connected to MongoDB!");
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error);
		process.exit(1); // Exit the process if unable to connect to the database
	}
};

// Invoke the async function to connect to MongoDB
connectToMongoDB();

/**
 * @description Middleware for parsing JSON bodies
 * @goal Efficiently handle incoming JSON data
 * Use built-in middleware for better performance
 */
app.use(express.json({ limit: "1mb" })); // Limit payload size for security

/**
 * @description CORS configuration middleware
 * @goal Enable secure cross-origin requests for frontend integration
 * Implement strict CORS policy in production
 */
app.use((req, res, next) => {
	// In production, replace '*' with specific origin
	res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, PATCH, OPTIONS",
	);
	next();
});

/**
 * @description Route handlers
 * @goal Organize API endpoints for books and authentication
 */
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

/**
 * @description Serve static files (book cover images)
 * @goal Efficiently serve static assets
 * Use different paths for development and production environments
 */
if (process.env.NODE_ENV === "production") {
	app.use(
		"/images",
		express.static(path.join(__dirname, "images"), {
			maxAge: "1d", // Cache static files for 1 day in production
			fallthrough: false, // Return 404 if file not found
		}),
	);
} else {
	app.use(
		`/${process.env.DEV_MEDIA_DIR}/images`,
		express.static(path.join(__dirname, process.env.DEV_MEDIA_DIR, "images"), {
			fallthrough: false, // Return 404 if file not found
		}),
	);
}

module.exports = app;