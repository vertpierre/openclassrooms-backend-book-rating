const express = require("express");
const bookCtrl = require("../controllers/books");
const auth = require("../middleware/auth");
const multer = require("../middleware/image");

/**
 * @description Router for book-related endpoints
 * @goal Efficiently manage book-related operations with proper authentication and file handling
 * - Separates public and protected routes for better security
 * - Uses middleware chaining for protected routes to ensure proper request processing
 * - Implements RESTful API design principles for clear and consistent endpoint structure
 */
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
 * - Implements multer middleware for efficient file upload handling in create and update operations
 */
router.post("/", auth, multer, bookCtrl.createBook);
router.put("/:id", auth, multer, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);

module.exports = router;
