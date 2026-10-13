import { app } from './app.js';
import { ENV } from './config/env.js';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏛️  CulturaSafe Backend REST API is running!`);
  console.log(`🚀  Server listening on: http://localhost:${PORT}`);
  console.log(`📖  Interactive API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`💓  Health check:        http://localhost:${PORT}/api/health`);
  console.log(`🛡️  Environment:         ${ENV.NODE_ENV}`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
