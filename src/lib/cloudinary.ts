import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Singleton, configured-from-env Cloudinary client.
 *
 * Throws if any of the three credentials are missing — callers should
 * gracefully no-op when Cloudinary isn't configured (dev without an account
 * still has the seed defaults).
 */
let configured = false;

export function cloudinaryEnabled(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function cld() {
  if (!cloudinaryEnabled()) {
    throw new Error(
      'Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET in .env.local',
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export function cloudinaryFolder(): string {
  return process.env.CLOUDINARY_FOLDER || 'desi-tryon';
}
