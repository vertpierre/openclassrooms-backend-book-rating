/**
 * @description Access control middleware
 */

const jwt = require("jsonwebtoken");
const Book = require("../models/Books");

const ACCESS_TYPES = {
	OWNER: "owner",
	RATE: "rate",
};

const PROJECTIONS = {
	owner: { userId: 1 },
	rate: { ratings: { $elemMatch: { userId: null } } },
};

const isAuth = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			throw new Error();
		}

		const token = authHeader.slice(7);
		const { userId } = jwt.verify(token, req.app.get("jwtSecret"));
		req.auth = { userId };
		next();
	} catch {
		next(new Error("403: Unauthorized request"));
	}
};

const accessCheckers = {
	owner: (book, userId) => {
		if (book.userId.toString() !== userId) {
			throw new Error("403: Unauthorized access to this book");
		}
	},
	rate: (book) => {
		if (book.ratings?.length) {
			throw new Error("400: You have already rated this book");
		}
	},
};

const hasAccess = async (req, res, next, accessType) => {
	try {
		const projection = { ...PROJECTIONS[accessType] };
		if (accessType === ACCESS_TYPES.RATE) {
			projection.ratings.$elemMatch.userId = req.auth.userId;
		}

		const book = await Book.findById(req.params.id, projection).lean();
		if (!book) {
			throw new Error("404: Book not found");
		}

		accessCheckers[accessType](book, req.auth.userId);
		next();
	} catch (error) {
		next(error);
	}
};

const isOwner = (req, res, next) =>
	hasAccess(req, res, next, ACCESS_TYPES.OWNER);
const isRated = (req, res, next) =>
	hasAccess(req, res, next, ACCESS_TYPES.RATE);

module.exports = { isAuth, isOwner, isRated };
