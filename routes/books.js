const express = require("express");
const bookCtrl = require("../controllers/books");
const auth = require("../middleware/auth");
const multer = require("../middleware/image");

/**
 * Router for book-related endpoints.
 * Handles CRUD operations and rating functionality for books.
 */
const router = express.Router();

router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRatedBooks);
router.post("/", auth, multer, bookCtrl.createBook);
router.get("/:id", bookCtrl.getOneBook);
router.put("/:id", auth, multer, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);

module.exports = router;