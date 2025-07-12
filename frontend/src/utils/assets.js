/**
 * Load a collection of image assets.
 *
 * In a browser environment this creates ``HTMLImageElement`` instances.
 * When running under Node (such as during unit tests) it falls back to
 * simple objects containing only the ``src`` property so code can still
 * reference the images without requiring a DOM.
 *
 * @param {Record<string, string>} paths - Map of keys to image file paths.
 * @returns {Record<string, HTMLImageElement|{src:string}>} Loaded images keyed
 *   by their original identifier.
 */
export function loadImages(paths) {
  const images = {};
  for (const [key, src] of Object.entries(paths)) {
    if (typeof Image !== "undefined") {
      const img = new Image();
      img.src = src;
      images[key] = img;
    } else {
      images[key] = { src };
    }
  }
  return images;
}
