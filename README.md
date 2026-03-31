# @arraypress/safe-filename

Sanitize filenames for safe storage and Content-Disposition headers. Prevents path traversal, header injection, and filesystem issues. Zero dependencies.

## Installation

```bash
npm install @arraypress/safe-filename
```

## Usage

```js
import { sanitize, contentDisposition } from '@arraypress/safe-filename';

// Sanitize user-uploaded filenames
sanitize('report.pdf')                 // 'report.pdf'
sanitize('../../../etc/passwd')         // 'etc_passwd'
sanitize('my "file".txt')              // 'my _file_.txt'
sanitize('file\x00name.zip')           // 'file_name.zip'
sanitize('CON.txt')                    // '_CON.txt'
sanitize('')                           // 'file'

// Build safe Content-Disposition headers
contentDisposition('report.pdf')
// → 'attachment; filename="report.pdf"'

contentDisposition('résumé.pdf')
// → 'attachment; filename="r_sum_.pdf"; filename*=UTF-8\'\'r%C3%A9sum%C3%A9.pdf'

contentDisposition('photo.jpg', 'inline')
// → 'inline; filename="photo.jpg"'
```

## API

### `sanitize(filename, options?)`

Sanitize a filename by removing dangerous characters, preventing path traversal, and blocking Windows reserved names.

Options:
- `fallback` — Name to use if result is empty (default `'file'`)
- `maxLength` — Max filename length (default `255`)
- `replacement` — Character to replace unsafe chars with (default `'_'`)

Handles:
- Path traversal (`../`, `C:\`)
- Null bytes and control characters
- Quotes, angle brackets, pipes (HTTP header/filesystem unsafe)
- Windows reserved names (CON, NUL, COM1, LPT1, etc.)
- Leading/trailing dots and spaces
- Overlong filenames (truncates preserving extension)

### `contentDisposition(filename, disposition?)`

Build a safe Content-Disposition header value. Sanitizes the filename, produces an ASCII `filename` parameter, and adds RFC 5987 `filename*` for non-ASCII characters.

### `getExtension(filename)`

Get the file extension without dot. Returns empty string if none.

### `replaceExtension(filename, ext)`

Replace or add a file extension.

## License

MIT
