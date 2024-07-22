const express = require("express");
const app = express();

app.use(express.json());

// Cors
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    next();
});

app.post("/api/books", (req, res, next) => {
    console.log(req.body);
    res.status(201).json({ message: "Book created successfully" });
});

/**
 * Temporary route to simulate book data retrieval
 * This will be replaced with actual database operations in the future
 */
app.get("/api/books", (req, res, next) => {
    const books = [
        {
            _id: "1a2b3c4d5e",
            userId: "user123",
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            imageUrl: "https://picsum.photos/200",
            year: 1925,
            genre: "Novel",
            ratings: [
                { userId: "user456", grade: 4 },
                { userId: "user789", grade: 5 },
            ],
            averageRating: 4.5,
        },
        {
            _id: "2b3c4d5e6f",
            userId: "user234",
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            imageUrl: "https://picsum.photos/201",
            year: 1960,
            genre: "Southern Gothic",
            ratings: [
                { userId: "user567", grade: 5 },
                { userId: "user890", grade: 4 },
            ],
            averageRating: 4.5,
        },
        {
            _id: "3c4d5e6f7g",
            userId: "user345",
            title: "1984",
            author: "George Orwell",
            imageUrl: "https://picsum.photos/202",
            year: 1949,
            genre: "Dystopian Fiction",
            ratings: [
                { userId: "user901", grade: 5 },
                { userId: "user234", grade: 5 },
            ],
            averageRating: 5.0,
        },
        {
            _id: "4d5e6f7g8h",
            userId: "user456",
            title: "Pride and Prejudice",
            author: "Jane Austen",
            imageUrl: "https://picsum.photos/203",
            year: 1813,
            genre: "Romance Novel",
            ratings: [
                { userId: "user345", grade: 4 },
                { userId: "user678", grade: 5 },
            ],
            averageRating: 4.5,
        },
        {
            _id: "5e6f7g8h9i",
            userId: "user567",
            title: "The Catcher in the Rye",
            author: "J.D. Salinger",
            imageUrl: "https://picsum.photos/204",
            year: 1951,
            genre: "Coming-of-age Fiction",
            ratings: [
                { userId: "user789", grade: 3 },
                { userId: "user012", grade: 4 },
            ],
            averageRating: 3.5,
        },
        {
            _id: "6f7g8h9i0j",
            userId: "user678",
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            imageUrl: "https://picsum.photos/205",
            year: 1937,
            genre: "Fantasy",
            ratings: [
                { userId: "user123", grade: 5 },
                { userId: "user456", grade: 5 },
            ],
            averageRating: 5.0,
        },
        {
            _id: "7g8h9i0j1k",
            userId: "user789",
            title: "Moby-Dick",
            author: "Herman Melville",
            imageUrl: "https://picsum.photos/206",
            year: 1851,
            genre: "Adventure Fiction",
            ratings: [
                { userId: "user567", grade: 4 },
                { userId: "user890", grade: 3 },
            ],
            averageRating: 3.5,
        },
    ];
    res.status(200).json(books);
});

module.exports = app;
