/**
 * @description Sanitize input to prevent XSS attacks
 * @goal Ensure user input is safe for processing and storage
 */
const sanitizeInput = (input) => {
    if (typeof input === 'number') {
        return input;
    }
    return input.replace(/[<>"'/]/g, (char) => {
        const entities = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
            "/": "&#x2F;",
        };
        return entities[char];
    });
};

/**
 * @description Validate and sanitize book input data
 * @goal Ensure book data is complete, valid, and safe before processing
 */
const validateBookInput = (req, res, next) => {
	try {
		const bookObject = req.body.book ? JSON.parse(req.body.book) : req.body;

		if (!bookObject || typeof bookObject !== 'object') {
			throw new Error("400: Invalid book data");
		}

		const requiredFields = ["title", "author", "year", "genre"];
		for (const field of requiredFields) {
			if (!bookObject[field]) {
				throw new Error(`400: Invalid or missing ${field}`);
			}
			bookObject[field] = sanitizeInput(bookObject[field]);
		}

		if (bookObject.year) {
			const yearNum = Number(bookObject.year);
			if (!Number.isInteger(yearNum) || yearNum < -6000 || yearNum > new Date().getFullYear()) {
				throw new Error("400: Invalid year. Must be an integer between -6000 and current year");
			}
			bookObject.year = yearNum;
		}

		if (bookObject.ratings && bookObject.ratings.grade !== undefined) {
			if (bookObject.ratings.grade === "") {
				bookObject.ratings.grade = 0;
			} else {
				const gradeNum = Number(bookObject.ratings.grade);
				if (!Number.isInteger(gradeNum) || gradeNum < 0 || gradeNum > 5) {
					throw new Error("400: Invalid rating. Must be an integer between 0 and 5");
				}
				bookObject.ratings.grade = gradeNum;
			}
		}

		req.validatedBook = bookObject;
		next();
	} catch (error) {
		next(error);
	}
};

/**
 * @description Validate rating input data
 * @goal Ensure rating data is valid before processing
 */
const validateRatingInput = (req, res, next) => {
    try {
        const bookObject = req.body.book ? JSON.parse(req.body.book) : req.body;

        if (!bookObject || typeof bookObject !== 'object') {
            throw new Error("400: Invalid rating data");
        }

        if (bookObject.rating === undefined) {
            throw new Error("400: Rating is required");
        }

        const ratingNum = Number(bookObject.rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
            throw new Error("400: Rating must be an integer between 0 and 5");
        }

        req.validatedRating = ratingNum;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { validateBookInput, validateRatingInput };