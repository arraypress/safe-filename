export interface SanitizeOptions {
  /** Fallback name if result is empty. Default: 'file'. */
  fallback?: string;
  /** Max filename length. Default: 255. */
  maxLength?: number;
  /** Replacement character for unsafe chars. Default: '_'. */
  replacement?: string;
}

/** Sanitize a filename for safe storage and HTTP headers. */
export function sanitize(filename: string, options?: SanitizeOptions): string;

/** Build a safe Content-Disposition header value with RFC 5987 support. */
export function contentDisposition(filename: string, disposition?: 'attachment' | 'inline'): string;

/** Get the extension from a filename (without dot). */
export function getExtension(filename: string): string;

/** Replace the extension of a filename. */
export function replaceExtension(filename: string, ext: string): string;

/** Convert a filename to a human-readable title (strip ext, replace separators, title case). */
export function humanize(filename: string): string;
