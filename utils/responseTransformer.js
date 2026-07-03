export function transformResponse(data, seen = new WeakSet()) {
  // Guard against null/undefined or primitive values
  if (!data || typeof data !== 'object') return data;

  // If this object has been processed already (circular reference), return as‑is
  if (seen.has(data)) return data;
  seen.add(data);

  // Mongoose document: convert to plain object first
  if (typeof data.toObject === 'function') {
    return transformResponse(data.toObject(), seen);
  }

  // Arrays – map each element with the same seen set
  if (Array.isArray(data)) {
    return data.map(item => transformResponse(item, seen));
  }

  // Plain object transformation
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === '_id') {
      result.id = String(value);
      continue;
    }
    if (['thumbnail', 'avatar', 'image'].includes(key)) {
      if (typeof value === 'string') {
        result[key] = { url: value };
      } else if (value && typeof value === 'object') {
        result[key] = value;
      } else {
        result[key] = null;
      }
      continue;
    }
    if (value && typeof value === 'object') {
      result[key] = transformResponse(value, seen);
    } else {
      result[key] = value;
    }
  }

  // Product specific fallback for missing thumbnail
  if (result.images && Array.isArray(result.images) && (!result.thumbnail || !result.thumbnail.url)) {
    const firstImg = result.images.find(img => img && img.url);
    if (firstImg) {
      result.thumbnail = { url: firstImg.url, publicId: firstImg.publicId };
    }
  }
  return result;
}

