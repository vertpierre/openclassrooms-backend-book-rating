const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

/**
 * User schema for MongoDB.
 * Defines the structure for user data in the database.
 */
const userSchema = mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
});

// Plugin to ensure email uniqueness
userSchema.plugin(uniqueValidator, { message: "Email already in use!" });

module.exports = mongoose.model("User", userSchema);
