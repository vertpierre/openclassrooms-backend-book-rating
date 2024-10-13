const express = require("express");
const bookCtrl = require("../controllers/books");
const { isAuth, isOwner, isRated } = require("../middleware/access");
const { uploadImage, optimizeImage } = require("../middleware/image");
const { validateBookInput, validateRatingInput } = require("../middleware/validateInput");

const router = express.Router();

/**
 * @description Public routes (no authentication required)
 * @goal Allow unrestricted access to book information
 */
router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRatedBooks);
router.get("/:id", bookCtrl.getOneBook);

/**
 * @description Protected routes (authentication required)
 * @goal Secure book manipulation operations and user-specific actions
 * - Uses auth middleware to ensure user authentication before accessing sensitive operations
 * - Implements image middleware for efficient file upload handling in create and update operations
 */
router.post("/", isAuth, uploadImage, validateBookInput, optimizeImage, bookCtrl.createBook);
router.put("/:id", isAuth, isOwner, uploadImage, validateBookInput, optimizeImage, bookCtrl.modifyBook);
router.delete("/:id", isAuth, isOwner, bookCtrl.deleteBook);
router.post("/:id/rating", isAuth, isRated, validateRatingInput, bookCtrl.rateBook);

module.exports = router;