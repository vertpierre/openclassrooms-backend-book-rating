const mongoose = require("mongoose");
const User = require("../../models/User");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.DEV_MONGODB_URI);
}, 10000);

afterAll(async () => {
	await mongoose.connection.close();
});

describe("User Model Test", () => {
	it("should validate a user with valid email and password", async () => {
		const validUser = new User({
			email: "__TEST__test@example.com",
			password: "password123",
		});
		const savedUser = await validUser.save();
		expect(savedUser._id).toBeDefined();
		expect(savedUser.email).toBe("__TEST__test@example.com");

		// Clean up the created user
		await User.findByIdAndDelete(savedUser._id);
	});

	it("should not validate a user with invalid email", async () => {
		const invalidUser = new User({
			email: "__TEST__invalid-email",
			password: "password123",
		});
		await expect(invalidUser.save()).rejects.toThrow(
			mongoose.Error.ValidationError,
		);
	});
});
