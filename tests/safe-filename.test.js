import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, contentDisposition, getExtension, replaceExtension, humanize } from '../src/index.js';

describe('sanitize', () => {
  // Basic filenames
  it('passes through safe filenames', () => assert.equal(sanitize('report.pdf'), 'report.pdf'));
  it('passes through spaces', () => assert.equal(sanitize('my file.txt'), 'my file.txt'));
  it('passes through dashes and underscores', () => assert.equal(sanitize('my-file_v2.zip'), 'my-file_v2.zip'));

  // Path traversal
  it('strips path traversal', () => assert.equal(sanitize('../../../etc/passwd'), 'passwd'));
  it('strips windows path', () => assert.equal(sanitize('C:\\Users\\admin\\file.exe'), 'file.exe'));
  it('strips unix path', () => assert.equal(sanitize('/var/log/secret.txt'), 'secret.txt'));

  // Dangerous characters
  it('strips null bytes', () => assert.equal(sanitize('file\x00name.zip'), 'file_name.zip'));
  it('strips control chars', () => assert.equal(sanitize('file\x01\x02.txt'), 'file_.txt'));
  it('strips quotes', () => assert.equal(sanitize('my "file".txt'), 'my _file_.txt'));
  it('strips angle brackets', () => assert.equal(sanitize('file<script>.js'), 'file_script_.js'));
  it('strips pipe', () => assert.equal(sanitize('file|name.txt'), 'file_name.txt'));
  it('strips colon', () => assert.equal(sanitize('file:name.txt'), 'file_name.txt'));
  it('strips asterisk', () => assert.equal(sanitize('file*.txt'), 'file_.txt'));
  it('strips question mark', () => assert.equal(sanitize('file?.txt'), 'file_.txt'));

  // Edge cases
  it('empty string → fallback', () => assert.equal(sanitize(''), 'file'));
  it('null → fallback', () => assert.equal(sanitize(null), 'file'));
  it('undefined → fallback', () => assert.equal(sanitize(undefined), 'file'));
  it('only dots → fallback', () => assert.equal(sanitize('...'), 'file'));
  it('only spaces → fallback', () => assert.equal(sanitize('   '), 'file'));
  it('custom fallback', () => assert.equal(sanitize('', { fallback: 'download' }), 'download'));

  // Windows reserved names
  it('blocks CON', () => assert.equal(sanitize('CON'), '_CON'));
  it('blocks CON.txt', () => assert.equal(sanitize('CON.txt'), '_CON.txt'));
  it('blocks NUL', () => assert.equal(sanitize('NUL'), '_NUL'));
  it('blocks COM1', () => assert.equal(sanitize('COM1'), '_COM1'));
  it('blocks LPT1', () => assert.equal(sanitize('LPT1'), '_LPT1'));
  it('blocks PRN', () => assert.equal(sanitize('PRN'), '_PRN'));
  it('allows CONTACT', () => assert.equal(sanitize('CONTACT.pdf'), 'CONTACT.pdf'));

  // Truncation
  it('truncates long filenames', () => {
    const long = 'a'.repeat(300) + '.pdf';
    const result = sanitize(long);
    assert.ok(result.length <= 255);
    assert.ok(result.endsWith('.pdf'));
  });

  it('truncates preserving extension', () => {
    const result = sanitize('a'.repeat(300) + '.tar.gz');
    assert.ok(result.endsWith('.gz'));
  });

  // Custom replacement
  it('custom replacement char', () => {
    assert.equal(sanitize('file<name>.txt', { replacement: '-' }), 'file-name-.txt');
  });

  // Leading/trailing dots
  it('strips leading dots', () => assert.equal(sanitize('.hidden'), 'hidden'));
  it('strips trailing dots', () => assert.equal(sanitize('file...'), 'file'));
});

describe('contentDisposition', () => {
  it('basic attachment', () => {
    assert.equal(contentDisposition('report.pdf'), 'attachment; filename="report.pdf"');
  });

  it('inline disposition', () => {
    assert.equal(contentDisposition('photo.jpg', 'inline'), 'inline; filename="photo.jpg"');
  });

  it('sanitizes unsafe chars', () => {
    const header = contentDisposition('../secret.pdf');
    assert.ok(header.includes('filename="secret.pdf"'));
    assert.ok(!header.includes('..'));
  });

  it('handles non-ASCII with RFC 5987', () => {
    const header = contentDisposition('résumé.pdf');
    assert.ok(header.includes('filename="r_sum_.pdf"'));
    assert.ok(header.includes("filename*=UTF-8''"));
  });
});

describe('getExtension', () => {
  it('simple extension', () => assert.equal(getExtension('file.pdf'), 'pdf'));
  it('double extension', () => assert.equal(getExtension('file.tar.gz'), 'gz'));
  it('no extension', () => assert.equal(getExtension('README'), ''));
  it('dotfile has no extension', () => assert.equal(getExtension('.gitignore'), ''));
  it('empty', () => assert.equal(getExtension(''), ''));
  it('null', () => assert.equal(getExtension(null), ''));
  it('uppercase → lowercase', () => assert.equal(getExtension('FILE.PDF'), 'pdf'));
});

describe('replaceExtension', () => {
  it('replaces extension', () => assert.equal(replaceExtension('photo.png', 'webp'), 'photo.webp'));
  it('adds extension', () => assert.equal(replaceExtension('README', 'md'), 'README.md'));
  it('removes extension', () => assert.equal(replaceExtension('file.txt', ''), 'file'));
  it('null filename', () => assert.equal(replaceExtension(null, 'txt'), 'file.txt'));
});

describe('humanize', () => {
  it('basic filename', () => assert.equal(humanize('my-product-banner.jpg'), 'My Product Banner'));
  it('underscores', () => assert.equal(humanize('dark_ambient_loop_01.wav'), 'Dark Ambient Loop 01'));
  it('camera filename', () => assert.equal(humanize('IMG_20240315_142030.png'), 'IMG 20240315 142030'));
  it('dots as separators', () => assert.equal(humanize('file.name.with.dots.pdf'), 'File Name With Dots'));
  it('mixed separators', () => assert.equal(humanize('my_file-name.test.jpg'), 'My File Name Test'));
  it('no extension', () => assert.equal(humanize('README'), 'README'));
  it('already nice', () => assert.equal(humanize('Report.pdf'), 'Report'));
  it('empty string', () => assert.equal(humanize(''), ''));
  it('null', () => assert.equal(humanize(null), ''));
  it('unicode', () => assert.equal(humanize('résumé-final.pdf'), 'RéSumé Final'));
});
