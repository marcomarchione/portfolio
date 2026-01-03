/**
 * Static File Plugin
 *
 * Serves uploaded media files from the uploads directory.
 * Files are served at /media/{year}/{month}/{filename}
 */
import { Elysia } from 'elysia';
import { join } from 'path';
import { config } from '../config';

/**
 * MIME type mapping for common file types.
 */
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

/**
 * Gets MIME type from file extension.
 */
function getMimeType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Static file serving plugin for media uploads.
 */
export const staticPlugin = new Elysia({ name: 'static' })
  .get('/media/*', async ({ params, set }) => {
    // Get the file path from wildcard
    const filePath = (params as { '*': string })['*'];

    if (!filePath) {
      set.status = 404;
      return { error: 'File not found' };
    }

    // Prevent directory traversal attacks
    if (filePath.includes('..') || filePath.includes('//')) {
      set.status = 400;
      return { error: 'Invalid path' };
    }

    // Build full file path
    const fullPath = join(config.UPLOADS_PATH, filePath);

    try {
      // Check if file exists
      const file = Bun.file(fullPath);
      const exists = await file.exists();

      if (!exists) {
        set.status = 404;
        return { error: 'File not found' };
      }

      // Set appropriate headers
      const mimeType = getMimeType(filePath);
      set.headers['Content-Type'] = mimeType;
      set.headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      set.headers['X-Content-Type-Options'] = 'nosniff';

      // Return file content
      return file;
    } catch (error) {
      console.error(`[STATIC] Error serving file ${filePath}:`, error);
      set.status = 500;
      return { error: 'Failed to serve file' };
    }
  });

export default staticPlugin;
