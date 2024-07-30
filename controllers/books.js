const Book = require("../models/Books");
const fs = require("fs");

/**
 * Create a new book entry
 */
exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    });

    book.save()
        .then(() => res.status(201).json({ message: "Book added successfully!" }))
        .catch((error) => res.status(400).json({ error }));
};

/**
 * Modify an existing book entry
 */
exports.modifyBook = (req, res, next) => {
    const bookObject = req.file
        ? {
              ...JSON.parse(req.body.book),
              imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
          }
        : { ...req.body };

    delete bookObject._userId;
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: "Not authorized" });
            } else {
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: "Book updated successfully!" }))
                    .catch((error) => res.status(400).json({ error }));
            }
        })
        .catch((error) => res.status(500).json({ error }));
};

/**
 * Delete a book entry
 */
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: "Not authorized" });
            } else {
                const filename = book.imageUrl.split("/images/")[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: "Book deleted successfully!" }))
                        .catch((error) => res.status(400).json({ error }));
                });
            }
        })
        .catch((error) => res.status(500).json({ error }));
};

/**
 * Retrieve a specific book
 */
exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => res.status(200).json(book))
        .catch((error) => res.status(404).json({ error }));
};

/**
 * Retrieve all books
 */
exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(400).json({ error }));
};

/**
 * Retrieve top 3 rated books
 */
exports.getBestRatedBooks = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(400).json({ error }));
};

/**
 * Rate a book
 */
exports.rateBook = (req, res, next) => {
    const { userId, rating } = req.body;
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.ratings.some((r) => r.userId === userId)) {
                return res.status(400).json({ message: "You have already rated this book" });
            }
            book.ratings.push({ userId, grade: rating });
            book.averageRating = book.ratings.reduce((sum, r) => sum + r.grade, 0) / book.ratings.length;
            return book.save();
        })
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(500).json({ error }));
};
