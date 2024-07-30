const express = require("express");
const userCtrl = require("../controllers/user");

/**
 * @description Router for user authentication endpoints
 * @goal Efficiently manage user registration and login with secure practices
 */
const router = express.Router();

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);

module.exports = router;
