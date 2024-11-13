const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/User");

// Email validation regex - compiled once for reuse
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Standard error messages
const ERROR_MESSAGES = {
  INVALID_EMAIL: "Invalid email format",
  USER_EXISTS: "An error occurred while creating the user",
  INVALID_CREDENTIALS: "Invalid email/password combination",
  SERVER_ERROR: "An error occurred while creating the user"
};

/**
 * Creates new user accounts with secure password hashing
 */
exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email }, { _id: 1 }).lean();
    if (existingUser) {
      return res.status(409).json({ error: ERROR_MESSAGES.USER_EXISTS });
    }

    // Create new user with hashed password
    const hash = await bcrypt.hash(password, 10);
    await User.create({ email, password: hash });

    res.status(201).json({ message: "User created successfully" });

  } catch (error) {
    res.status(error.name === "ValidationError" ? 400 : 500)
       .json({ error: error.name === "ValidationError" ? 
         error.message : ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * Authenticates users and issues JWT tokens
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and verify credentials
    const user = await User.findOne({ email }).lean();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      req.app.get("jwtSecret"),
      { expiresIn: "24h" }
    );

    res.status(200).json({
      userId: user._id,
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};