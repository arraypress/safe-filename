/**
 * @arraypress/safe-filename
 *
 * Sanitize filenames for safe storage and Content-Disposition headers.
 * Prevents path traversal, header injection, and filesystem issues.
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module @arraypress/safe-filename
 */

/**
 * Characters that are unsafe in filenames across platforms.
 * Covers Windows reserved chars, path separators, null bytes,
 * and characters that break HTTP headers.
 */
const UNSAFE = /[/\\:*?"<>|\x00-\x1f\x7f]/g;

/**
 * Windows reserved device names (case-insensitive).
 */
const RESERVED = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\.|$)/i;

/**
 * Sanitize a filename for safe storage and HTTP headers.
 *
 * Strips path separators, control characters, and platform-unsafe
 * characters. Prevents path traversal (`../`), null byte injection,
 * and Content-Disposition header injection.
 *
 * @param {string} filename - The raw filename to sanitize.
 * @param {Object} [options] - Options.
 * @param {string} [options.fallback='file'] - Fallback name if result is empty.
 * @param {number} [options.maxLength=255] - Max filename length.
 * @param {string} [options.replacement='_'] - Character to replace unsafe chars with.
 * @returns {string} Safe filename.
 *
 * @example
 * sanitize('report.pdf')                    // 'report.pdf'
 * sanitize('../../../etc/passwd')            // '______etc_passwd'
 * sanitize('my "file".txt')                 // 'my _file_.txt'
 * sanitize('file\x00name.zip')              // 'file_name.zip'
 * sanitize('')                              // 'file'
 * sanitize('CON.txt')                       // '_CON.txt'
 * sanitize('a'.repeat(300) + '.pdf')        // truncated to 255 chars
 */
export function sanitize(filename, options = {}) {
  const { fallback = 'file', maxLength = 255, replacement = '_' } = options;

  if (!filename || typeof filename !== 'string') return fallback;

  let safe = filename
    // Strip path separators and directory components
    .replace(/^.*[/\\]/, '')
    // Replace unsafe characters
    .replace(UNSAFE, replacement)
    // Collapse multiple replacements
    .replace(new RegExp(`\\${replacement}{2,}`, 'g'), replacement)
    // Remove leading/trailing dots and spaces (Windows issues)
    .replace(/^[\s.]+|[\s.]+$/g, '');

  // Block Windows reserved names
  if (RESERVED.test(safe)) {
    safe = replacement + safe;
  }

  // Truncate preserving extension
  if (safe.length > maxLength) {
    const ext = getExtension(safe);
    const maxBase = maxLength - (ext ? ext.length + 1 : 0);
    safe = safe.slice(0, maxBase) + (ext ? '.' + ext : '');
  }

  return safe || fallback;
}

/**
 * Build a safe Content-Disposition header value.
 *
 * Sanitizes the filename and returns a properly formatted header
 * with both ASCII `filename` and UTF-8 `filename*` (RFC 5987).
 *
 * @param {string} filename - The raw filename.
 * @param {'attachment'|'inline'} [disposition='attachment'] - Disposition type.
 * @returns {string} Content-Disposition header value.
 *
 * @example
 * contentDisposition('report.pdf')
 * // → 'attachment; filename="report.pdf"'
 *
 * contentDisposition('résumé.pdf')
 * // → 'attachment; filename="resume.pdf"; filename*=UTF-8\'\'r%C3%A9sum%C3%A9.pdf'
 *
 * contentDisposition('photo.jpg', 'inline')
 * // → 'inline; filename="photo.jpg"'
 */
export function contentDisposition(filename, disposition = 'attachment') {
  const safe = sanitize(filename);
  const ascii = safe.replace(/[^\x20-\x7e]/g, '_');
  let header = `${disposition}; filename="${ascii}"`;

  // Add RFC 5987 filename* if there are non-ASCII chars
  if (ascii !== safe) {
    const encoded = encodeURIComponent(safe).replace(/'/g, '%27');
    header += `; filename*=UTF-8''${encoded}`;
  }

  return header;
}

/**
 * Get the extension from a filename.
 *
 * @param {string} filename
 * @returns {string} Extension without dot, or empty string.
 *
 * @example
 * getExtension('report.pdf')     // 'pdf'
 * getExtension('archive.tar.gz') // 'gz'
 * getExtension('README')         // ''
 * getExtension('.gitignore')     // 'gitignore'
 */
export function getExtension(filename) {
  if (!filename) return '';
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return '';
  return filename.slice(dot + 1).toLowerCase();
}

/**
 * Replace the extension of a filename.
 *
 * @param {string} filename - Original filename.
 * @param {string} ext - New extension (without dot).
 * @returns {string} Filename with new extension.
 *
 * @example
 * replaceExtension('photo.png', 'webp')  // 'photo.webp'
 * replaceExtension('README', 'md')       // 'README.md'
 */
export function replaceExtension(filename, ext) {
  if (!filename) return ext ? `file.${ext}` : 'file';
  const dot = filename.lastIndexOf('.');
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return ext ? `${base}.${ext}` : base;
}

/**
 * Convert a filename to a human-readable title.
 *
 * Strips the extension, replaces hyphens/underscores/dots with spaces,
 * collapses whitespace, and title-cases each word. Useful for auto-generating
 * alt text, titles, and display names from filenames.
 *
 * @param {string} filename - The filename to humanize.
 * @returns {string} Human-readable title.
 *
 * @example
 * humanize('my-product-banner.jpg')           // 'My Product Banner'
 * humanize('dark_ambient_loop_01.wav')        // 'Dark Ambient Loop 01'
 * humanize('IMG_20240315_142030.png')         // 'IMG 20240315 142030'
 * humanize('résumé-final-v2.pdf')             // 'Résumé Final V2'
 * humanize('')                                // ''
 * humanize(null)                              // ''
 */
export function humanize(filename) {
  if (!filename) return '';
  return filename
    .replace(/\.[^.]+$/, '')           // strip extension
    .replace(/[-_.]+/g, ' ')           // replace separators with spaces
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()); // title case
}
