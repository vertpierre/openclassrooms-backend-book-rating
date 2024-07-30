const express = require("express");
const userCtrl = require("../controllers/user");

/**
 * Router for user authentication endpoints.
 * This router handles user registration and login functionality.
 */
const router = express.Router();

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);

module.exports = router;