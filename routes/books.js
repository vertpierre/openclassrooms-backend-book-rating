const express = require("express");
const router = express.Router();
const bookCtrl = require("../controllers/books");
const { isAuth, isOwner, isRated } = require("../middleware/access");
const {
	validateBookInput,
	validateRatingInput,
} = require("../middleware/validateInput");
const { uploadImage, optimizeImage } = require("../middleware/image");

// Group routes by access level and operation type
const PUBLIC_ROUTES = {
	GET: [
		{ path: "/", handler: bookCtrl.getAllBooks },
		{ path: "/bestrating", handler: bookCtrl.getBestRatedBooks },
		{ path: "/:id", handler: bookCtrl.getOneBook },
		{ path: "/:id/image", handler: bookCtrl.getBookImage },
	],
};

const PROTECTED_ROUTES = {
	POST: [
		{
			path: "/",
			middleware: [isAuth, uploadImage, validateBookInput, optimizeImage],
			handler: bookCtrl.createBook,
		},
		{
			path: "/:id/rating",
			middleware: [isAuth, isRated, validateRatingInput],
			handler: bookCtrl.rateBook,
		},
	],
	PUT: [
		{
			path: "/:id",
			middleware: [
				isAuth,
				isOwner,
				uploadImage,
				validateBookInput,
				optimizeImage,
			],
			handler: bookCtrl.modifyBook,
		},
	],
	DELETE: [
		{
			path: "/:id",
			middleware: [isAuth, isOwner],
			handler: bookCtrl.deleteBook,
		},
	],
};

// Register public routes
for (const route of PUBLIC_ROUTES.GET) {
	router.get(route.path, route.handler);
}

// Register protected routes
for (const [method, routes] of Object.entries(PROTECTED_ROUTES)) {
	for (const route of routes) {
		router[method.toLowerCase()](
			route.path,
			...route.middleware,
			route.handler,
		);
	}
}

module.exports = router;
