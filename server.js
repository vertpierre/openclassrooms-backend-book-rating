/**
 * @description Server configuration and startup for Mon Vieux Grimoire backend
 * @goal Create a robust, scalable, and efficient HTTP server for the book rating application
 */

// Load environment variables from .env file for secure configuration
require("dotenv").config();

// Import the HTTP server module and Express app
// Use the node: protocol for better performance and security
const http = require("http");
const app = require("./app");

/**
 * @description Normalize a port into a number, string, or false
 * @goal Ensure consistent and valid port configuration
 * @returns {number|string|boolean} - The normalized port value
 */
const normalizePort = (val) => {
    const port = Number.parseInt(val, 10);
    if (Number.isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
};

// Set the port for the server using the PORT environment variable
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * @description Handle specific listen errors with friendly messages
 * @goal Improve error handling and debugging
 */
const errorHandler = (error) => {
    if (error.syscall !== "listen") throw error;

    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    // Handle specific listen errors with messages
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};

// Create the HTTP server
// Use http.createServer for better performance compared to Express server
const server = http.createServer(app);

// Set up error handling for the server
server.on("error", errorHandler);

// Set up the listening handler
server.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Server is listening on ${bind}`);
});

// Start the server
// Use the normalized port for consistent behavior across environments
server.listen(port);
