const http = require("node:http");
const app = require("./app");

/**
 * @description Normalize a port into a number, string, or false
 * @goal Convert port input to a valid number or return the original value if invalid
 */
const normalizePort = (val) => {
    const port = Number.parseInt(val, 10);
    if (Number.isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
};

// Set the port for the server using the apiPort from app.js
const port = normalizePort(app.get("apiPort") || 4000);
app.set("port", port);

/**
 * @description Handle specific listen errors with friendly messages
 * @goal Provide clear, actionable error messages for common server startup issues
 */
const errorHandler = (error) => {
    if (error.syscall !== "listen") throw error;

    // Format the port as a string
    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    switch (error.code) {
        // If the port requires elevated privileges
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        // If the port is already in use
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        // If the port is not valid
        default:
            throw error;
    }
};

// Create the HTTP server
const server = http.createServer(app);

// Set up error handling for the server
server.on("error", errorHandler);

// Set up the listening handler for incoming requests
server.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Server is listening on ${bind}`);
});

// Start the server
server.listen(port);
