/**
 * @description Image optimization middleware
 */

const multer = require("multer");
const sharp = require("sharp");

const IMAGE_CONSTRAINTS = {
	height: 1000,
	aspectRatio: 1 / 1.26,
	quality: 50,
	maxSize: 1024 * 1024,
	allowedTypes: new Set(["image/jpg", "image/jpeg", "image/png", "image/webp"]),
};

const getImageWidth = () =>
	Math.round(IMAGE_CONSTRAINTS.height * IMAGE_CONSTRAINTS.aspectRatio);

// Multer configuration
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
	const isValid = IMAGE_CONSTRAINTS.allowedTypes.has(file.mimetype);
	cb(isValid ? null : new Error("400: Invalid image type"), isValid);
};

const uploadImage = multer({
	storage,
	fileFilter,
	limits: { fileSize: IMAGE_CONSTRAINTS.maxSize },
}).single("image");

const optimizeImage = async (req, res, next) => {
	if (!req.file) return next();

	try {
		req.file.buffer = await sharp(req.file.buffer)
			.resize({
				width: getImageWidth(),
				height: IMAGE_CONSTRAINTS.height,
				fit: "cover",
			})
			.webp({ quality: IMAGE_CONSTRAINTS.quality })
			.toBuffer();

		req.file.contentType = "image/webp";
		next();
	} catch (error) {
		next(new Error("500: Image processing failed"));
	}
};

module.exports = { uploadImage, optimizeImage };
