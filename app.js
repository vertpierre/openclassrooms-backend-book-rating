const express = require("express");
const mongoose = require("mongoose");
const path = require("node:path");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const bookRoutes = require("./routes/books");
const userRoutes = require("./routes/user");

const swaggerDocument = require("./api-docs/swagger.json");

const app = express();

// Set up environment-specific variables
const isProduction = process.env.NODE_ENV === "production";
app.set("apiPort", isProduction ? process.env.PORT : process.env.DEV_PORT);
app.set("jwtSecret", isProduction ? process.env.JWT_SECRET : process.env.DEV_JWT_SECRET);
app.set("apiURI", isProduction ? process.env.API_URI : process.env.DEV_API_URI);
app.set("mediaURI", isProduction ? process.env.MEDIA_URI : process.env.DEV_MEDIA_URI);
app.set("dbURI", isProduction ? process.env.MONGODB_URI : process.env.DEV_MONGODB_URI);
app.set("frontEndURI", isProduction ? process.env.FRONTEND_URI : process.env.DEV_FRONTEND_URI);

/**
 * @description Connect to MongoDB
 * @goal Establish database connection
 */
const connectToMongoDB = async () => {
	try {
		await mongoose.connect(app.get("dbURI"));
		console.log("Successfully connected to MongoDB!");
	} catch (error) {
		throw new Error("Failed to connect to MongoDB:", error);
	}
};

connectToMongoDB();

/**
 * @description CORS configuration
 * @goal Enable secure cross-origin requests for frontend integration
 */
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", app.get("frontEndURI"));
	
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE"
	);
	next();
});

// Serve static files with caching and 404 handling
const serveStaticFiles = express.static(path.join(__dirname, app.get("mediaURI")), {
	maxAge: "1d",
	fallthrough: false,
});

// JSON bodies, limit payload size for security
app.use(express.json({ limit: "10kb" }));

// Compress responses in gzip format
app.use(compression());

// Route configuration
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

// Serve static files
app.use(`/${app.get("mediaURI")}`, serveStaticFiles);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;