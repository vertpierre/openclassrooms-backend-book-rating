require("dotenv").config();

const http = require("node:http");
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

// Set the port for the server using the apiPort from app.js
const port = normalizePort(process.env.PORT || 4000);
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
server.listen(port);
