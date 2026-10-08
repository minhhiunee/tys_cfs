/** Documented limits — enforced server-side in later phases. */
export const SUBMISSION_CONTENT_MIN_LENGTH = 10;
export const SUBMISSION_CONTENT_MAX_LENGTH = 5000;

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGES_PER_SUBMISSION = 5;
export const MAX_VIDEOS_PER_SUBMISSION = 1;

export const PRESIGNED_URL_TTL_SECONDS = 900;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
] as const;
