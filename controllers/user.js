/**
 * @description User authentication controller
 * @goal Provide secure user registration and login functionality
 * - Implements bcrypt for password hashing
 * - Uses JWT for secure token generation
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/User");

/**
 * @description User registration handler
 * @goal Securely create new user accounts
 * - Hashes the password using bcrypt for enhanced security
 * - Creates a new user in the MongoDB database
 * - Implements error handling for database operations
 */
exports.signup = async (req, res, next) => {
	try {
		const hash = await bcrypt.hash(req.body.password, 10);
		const user = new User({
			email: req.body.email,
			password: hash,
		});
		await user.save();
		res.status(201).json({ message: "User created successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * @description User login handler
 * @goal Authenticate users and provide secure access tokens
 * - Verifies user credentials against stored data
 * - Issues a JWT upon successful authentication
 * - Implements proper error handling for security
 */
exports.login = async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			return res.status(401).json({ error: "Invalid email/password combination" });
		}
		const valid = await bcrypt.compare(req.body.password, user.password);
		if (!valid) {
			return res.status(401).json({ error: "Invalid email/password combination" });
		}
		res.status(200).json({
			userId: user._id,
			token: jwt.sign(
				{ userId: user._id },
				process.env.JWT_SECRET,
				{ expiresIn: "24h" }
			),
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
