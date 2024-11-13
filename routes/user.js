const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");

const AUTH_ROUTES = {
	POST: [
		{ path: "/signup", handler: userCtrl.signup },
		{ path: "/login", handler: userCtrl.login },
	],
};

// Register authentication routes
for (const route of AUTH_ROUTES.POST) {
	router.post(route.path, route.handler);
}

module.exports = router;
