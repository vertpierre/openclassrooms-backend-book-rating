/**
 * @description Image upload and optimization middleware for Mon Vieux Grimoire
 * @goal Efficiently handle image uploads, validate file types, and optimize images for storage and performance
 */

const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

/**
 * @description Mapping of accepted MIME types to file extensions
 * @goal Ensure only valid image types are processed
 */
const MIME_TYPES = {
	"image/jpg": "jpg",
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

/**
 * @description Multer storage configuration
 * @goal Use memory storage for temporary file handling to improve performance
 */
const storage = multer.memoryStorage();

/**
 * @description File filter for multer
 * @goal Validate incoming files to ensure only accepted image types are processed
 */
const fileFilter = (req, file, cb) => {
	if (MIME_TYPES[file.mimetype]) {
		cb(null, true);
	} else {
		cb(new Error("Invalid file type"), false);
	}
};

/**
 * @description Multer middleware configuration
 * @goal Set up multer for single file uploads with custom storage and file filtering
 */
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
}).single("image");

/**
 * @description Image optimization middleware
 * @goal Process and optimize uploaded images for consistent quality and reduced file size
 * - Resize the image to a maximum of 1080 pixels x or y length
 * - Convert the image to webp format with 70% quality
 */
const optimizeImage = async (req, res, next) => {
	if (!req.file) return next();

	const filename = `${req.file.originalname.split(" ").join("_")}-${Date.now()}.webp`;
	const outputPath = path.join("images", filename);

	try {
		await sharp(req.file.buffer)
			.resize({ width: 1080, height: 1080, fit: "inside" })
			.webp({ quality: 70 })
			.toFile(outputPath);

		req.file.filename = filename;
		next();
	} catch (error) {
		next(error);
	}
};

/**
 * @description Export middleware chain for image handling
 * @goal Provide a reusable middleware setup for image upload and optimization
 */
module.exports = [upload, optimizeImage];
