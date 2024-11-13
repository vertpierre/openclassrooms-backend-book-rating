/**
 * @description Main application file for Mon Vieux Grimoire backend.
 * Sets up the Express server, connects to MongoDB, and configures middleware and routes
 * @goal Create a scalable and secure backend architecture for the book rating application
 */

// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

// Import route handlers
const bookRoutes = require("./routes/books");
const userRoutes = require("./routes/user");

// Import Swagger documentation
const swaggerDocument = require("./api-docs/swagger.json");

/**
 * @description Initialize Express app
 */
const app = express();

/**
 * @description Configure application settings directly from .env
 */
app.set("apiPort", process.env.PORT);
app.set("jwtSecret", process.env.JWT_SECRET);
app.set("apiURL", process.env.API_URL);
app.set("frontendURL", process.env.FRONTEND_URL);

/**
 * @description Connect to MongoDB
 * @goal Establish database connection asynchronously for better error handling
 */
const connectToMongoDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {});
		console.log("Successfully connected to MongoDB!");
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error);
		process.exit(1); // Exit the process if unable to connect to the database
	}
};

// Invoke the async function to connect to MongoDB
connectToMongoDB();

// Middleware configuration
app.use(compression()); // Use compression middleware to compress responses in gzip format
app.use(express.json({ limit: "1mb" })); // Middleware for parsing JSON bodies, limit payload size for security

/**
 * @description CORS configuration middleware
 * @goal Enable secure cross-origin requests for frontend integration
 * Implement strict CORS policy in production
 */
app.use((req, res, next) => {
	const allowedOrigins = [app.get("frontendURL")];

	const origin = allowedOrigins.includes(req.headers.origin)
		? req.headers.origin
		: allowedOrigins[0];

	res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, OPTIONS",
	);
	next();
});

// Compress responses in gzip format
app.use(compression());

// Route configuration
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;
