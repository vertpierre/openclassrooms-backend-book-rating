const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

/**
 * User schema for MongoDB
 * @description Defines the structure and validation for user data
 */
const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: [true, 'Email is required'],
		unique: true,
		trim: true,
		lowercase: true,
		validate: {
			validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
			message: 'Invalid email format'
		}
	},
	password: {
		type: String,
		required: [true, 'Password is required']
	}
}, {
	toJSON: { 
		transform: (_, ret) => {
			delete ret.password;
			return ret;
		}
	}
});

userSchema.plugin(uniqueValidator, { message: 'Email already in use' });

module.exports = mongoose.model('User', userSchema);
