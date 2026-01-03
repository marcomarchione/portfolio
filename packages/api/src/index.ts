/**
 * API Server Initialization
 *
 * Main entry point for the Elysia API server.
 * Configures middleware, plugins, and routes.
 */
import { Elysia } from 'elysia';
import { config, isDevelopment } from './config';
import { errorHandler, corsMiddleware } from './middleware';
import { databasePlugin, swaggerPlugin, staticPlugin } from './plugins';
import { apiRoutes } from './routes';

/**
 * Creates and configures the Elysia application.
 * Can be used for testing without starting the server.
 *
 * @returns Configured Elysia application
 */
export function createApp() {
  const app = new Elysia({ name: 'api' })
    // Global error handling
    .use(errorHandler)
    // CORS configuration
    .use(corsMiddleware)
    // Database injection
    .use(databasePlugin)
    // OpenAPI/Swagger (dev only)
    .use(swaggerPlugin)
    // Static file serving for uploads
    .use(staticPlugin)
    // API routes with /api/v1 prefix
    .use(apiRoutes);

  return app;
}

/**
 * Starts the API server.
 * Sets up graceful shutdown handling for SIGTERM/SIGINT.
 */
export function startServer() {
  const app = createApp();

  // Graceful shutdown handler
  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[SERVER] ${signal} received, shutting down gracefully...`);

    // Stop accepting new connections
    app.stop().then(() => {
      console.log('[SERVER] Server stopped');
      process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
      console.error('[SERVER] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start listening
  app.listen(config.PORT);

  const envMode = isDevelopment() ? 'development' : 'production';
  const pkgVersion = process.env.npm_package_version || '0.1.0';
  console.log(`[SERVER] API v${pkgVersion} started on port ${config.PORT} (${envMode})`);

  if (isDevelopment()) {
    console.log(`[SERVER] Swagger UI available at http://localhost:${config.PORT}/api/docs`);
  }

  console.log(`[SERVER] Health check at http://localhost:${config.PORT}/api/v1/health`);

  return app;
}

// Start server if this file is run directly
if (import.meta.main) {
  startServer();
}
