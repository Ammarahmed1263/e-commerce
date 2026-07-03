import { Types } from 'mongoose';

/**
 * Recursively transform a Mongoose document or plain object:
 * - Replace `_id` with `id` (as string)
 * - Ensure image fields `thumbnail`, `avatar`, `image` are objects { url, publicId? }
 * - If a product's `thumbnail` is missing, fall back to first entry of `images`
 */
export function transformResponse(data: any): any {
  if (Array.isArray(data)) {
    return data.map(transformResponse);
  }
  if (data && typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === '_id') {
        result.id = String(value);
        continue;
      }
      if (['thumbnail', 'avatar', 'image'].includes(key)) {
        // If it's a string, wrap it
        if (typeof value === 'string') {
          result[key] = { url: value };
        } else if (value && typeof value === 'object') {
          result[key] = value;
        } else {
          result[key] = null;
        }
        continue;
      }
      // Recurse for nested objects
      if (value && typeof value === 'object') {
        result[key] = transformResponse(value);
      } else {
        result[key] = value;
      }
    }
    // Product specific fallback for missing thumbnail
    if (result.images && Array.isArray(result.images) && (!result.thumbnail || !result.thumbnail.url)) {
      const firstImg = result.images.find((img: any) => img && img.url);
      if (firstImg) {
        result.thumbnail = { url: firstImg.url, publicId: firstImg.publicId };
      }
    }
    return result;
  }
  return data;
}
