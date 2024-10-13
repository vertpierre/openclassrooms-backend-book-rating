const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

/**
 * User schema for MongoDB.
 * Defines the structure for user data in the database.
 */
const userSchema = mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		validate: {
			validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
			message: "Invalid email format",
		},
	},
	password: { type: String, required: true },
});

userSchema.plugin(uniqueValidator, { message: "Email already in use" });

module.exports = mongoose.model("User", userSchema);
