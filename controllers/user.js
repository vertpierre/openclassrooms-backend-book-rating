const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * @description User registration handler
 * @goal Securely create new user accounts
 * - Validates email format and uniqueness
 * - Hashes the password using bcrypt for enhanced security
 * - Creates a new user in the MongoDB database
 * - Implements error handling for database operations and validation
 */
exports.signup = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!validateEmail(email)) {
			throw new Error("400: Invalid email format");
		}
		
		if (!password) {
			throw new Error("400: Password is required");
		}

		const existingUser = await User.findOne({ email: req.body.email });
		if (existingUser) {
			throw new Error("400: Email already in use");
		}

		const hash = await bcrypt.hash(req.body.password, 10);
		const user = new User({
			email: req.body.email,
			password: hash,
		});
		await user.save();
		res.status(201).json({ message: "User created successfully" });
	} catch (error) {
		next(error);
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
		const { email, password } = req.body;

		if (!validateEmail(email) || !password) { 
			throw new Error("400: Invalid email or password");
		}

		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			throw new Error("400: Invalid email/password combination");
		}

		const valid = await bcrypt.compare(req.body.password, user.password);
		if (!valid) {
			throw new Error("400: Invalid email/password combination");
		}

		res.status(200).json({
			userId: user._id,
			token: jwt.sign({ userId: user._id }, req.app.get("jwtSecret"), {
				expiresIn: "24h",
			}),
		});
	} catch (error) {
		next(error);
	}
};