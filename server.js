// Load environment variables from .env file
require('dotenv').config();
// Import the HTTP server module and Express app
const http = require('http');
const app = require('./app');

/**
 * Normalize a port into a number, string, or false.
 * @param {string|number} val - The port value to normalize.
 * @returns {number|string|boolean} - The normalized port value.
 */
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

// Set the port for the server using the PORT environment variable
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Handle specific listen errors with friendly messages.
 * @param {Error} error - The error object.
 */
const errorHandler = (error) => {
  if (error.syscall !== 'listen') throw error;

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // Handle specific listen errors with messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
};

// Create the HTTP server
const server = http.createServer(app);

// Set up error handling for the server
server.on('error', errorHandler);

// Set up the listening handler
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Server is listening on ${bind}`);
});

// Start the server
server.listen(port);
