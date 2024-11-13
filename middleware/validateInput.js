/**
 * @description Input validation and sanitization middleware
 */

const REQUIRED_FIELDS = ["title", "author", "year", "genre"];
const YEAR_CONSTRAINTS = {
	min: -6000,
	max: new Date().getFullYear(),
};
const RATING_CONSTRAINTS = { min: 1, max: 5 };

// XSS protection map
const XSS_ENTITY_MAP = {
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
	"/": "&#x2F;",
	"&": "&amp;",
};

// Memoized input sanitization
const sanitizeInput = (() => {
	const cache = new Map();
	const MAX_CACHE_SIZE = 1000;

	return (input) => {
		if (typeof input === "number") return input;
		if (cache.has(input)) return cache.get(input);

		const sanitized = input.replace(/[<>"'/]/g, (char) => XSS_ENTITY_MAP[char]);

		if (cache.size >= MAX_CACHE_SIZE) {
			cache.delete(cache.keys().next().value);
		}
		cache.set(input, sanitized);
		return sanitized;
	};
})();

// Validation helpers
const validateYear = (year) => {
	const yearNum = Number(year);
	if (
		!Number.isInteger(yearNum) ||
		yearNum < YEAR_CONSTRAINTS.min ||
		yearNum > YEAR_CONSTRAINTS.max
	) {
		throw new Error(
			"400: Invalid year. Must be an integer between -6000 and current year",
		);
	}
	return yearNum;
};

const validateRating = (rating) => {
	if (rating === undefined) {
		throw new Error("400: Rating is required");
	}
	const ratingNum = Number(rating);
	if (
		!Number.isInteger(ratingNum) ||
		ratingNum < RATING_CONSTRAINTS.min ||
		ratingNum > RATING_CONSTRAINTS.max
	) {
		throw new Error("400: Rating must be an integer between 1 and 5");
	}
	return ratingNum;
};

const validateBookInput = (req, res, next) => {
	try {
		const bookObject = req.body.book ? JSON.parse(req.body.book) : req.body;
		if (!bookObject || typeof bookObject !== "object") {
			throw new Error("400: Invalid book data");
		}

		for (const field of REQUIRED_FIELDS) {
			if (!bookObject[field]) {
				throw new Error(`400: Invalid or missing ${field}`);
			}
			bookObject[field] =
				field === "year"
					? validateYear(bookObject[field])
					: sanitizeInput(bookObject[field]);
		}

		req.validatedBook = bookObject;
		next();
	} catch (error) {
		next(error);
	}
};

const validateRatingInput = (req, res, next) => {
	try {
		req.validatedData = {
			rating: validateRating(req.body.rating),
			userId: req.auth.userId,
		};
		next();
	} catch (error) {
		next(error);
	}
};

module.exports = { validateBookInput, validateRatingInput };
