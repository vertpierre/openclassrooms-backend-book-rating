const multer = require("multer");
const sharp = require("sharp");
const path = require("node:path");

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
 * - Use memory storage for temporary file handling to improve performance
 */
const uploadImage = multer({
	storage: multer.memoryStorage(),
	fileFilter: fileFilter,
}).single("image");

/**
 * @description Image optimization middleware
 * @goal Process and optimize uploaded images for consistent quality, reduced file size, and 1:1.26 aspect ratio
 * - Resize the image to maintain a 1:1.26 aspect ratio
 * - With a fixed height of 1080 pixels
 * - Convert the image to webp format with 60% quality
 */
const optimizeImage = async (req, res, next) => {

	if (!req.file) return next();

	const filename = `${req.file.originalname.split(" ").join("_")}-${Date.now()}.webp`;
	const outputPath = path.join(__dirname, "..", req.app.get("mediaURI"));

	try {
		const image = sharp(req.file.buffer);
		const aspectRatio = 1 / 1.26;

		const height = 1080;
		const width = Math.round(height * aspectRatio);

		await image
			.resize({ width, height, fit: "cover" })
			.webp({ quality: 60 })
			.toFile(path.join(outputPath, filename));

		req.file.filename = filename;
		req.optimizedImageUrl = `${req.app.get("apiURI")}/${req.app.get("mediaURI")}/${filename}`;
		next();
	} catch (error) {
		next(error);
	}
};

module.exports = { uploadImage, optimizeImage };