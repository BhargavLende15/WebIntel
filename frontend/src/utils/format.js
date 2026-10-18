/**
 * Shared display-formatting helpers.
 *
 * The punctuation constants below are written as escape sequences on purpose.
 * The literal characters (\u2014, \u2022, \u2026) were previously committed to the
 * source as mojibake (UTF-8 bytes decoded as Windows-1252), which surfaced as
 * "a€”" in the UI. Using escapes makes the code immune to re-encoding damage
 * from any editor or transfer tool.
 */

export const EM_DASH = '\u2014';
export const BULLET = '\u2022';
export const ELLIPSIS = '\u2026';

export const NOT_AVAILABLE = 'Not available';
export const IN_PROGRESS = 'In progress';

/**
 * Matches text that has been through one round of Windows-1252 misdecoding.
 * The lead bytes (\u00C2, \u00C3, \u00E2, \u00F0) are followed by the
 * Windows-1252 code points that a UTF-8 em dash / ellipsis / emoji decode to.
 */
const MOJIBAKE_PATTERN =
  /[\u00c2\u00c3\u00e2\u00f0][\u0080-\u00ff\u0090-\u00bf\u0152\u0178\u2018\u2019\u201c\u201d\u20ac]/;

/**
 * Windows-1252 code point -> original byte, for the 0x80-0x9F block.
 * This is the inverse of the table an editor or transfer tool applies when it
 * decodes UTF-8 bytes as Windows-1252.
 */
const CP1252_HIGH_BYTES = new Map([
  ['\u20ac', 0x80], ['\u201a', 0x82], ['\u0192', 0x83], ['\u201e', 0x84],
  ['\u2026', 0x85], ['\u2020', 0x86], ['\u2021', 0x87], ['\u02c6', 0x88],
  ['\u2030', 0x89], ['\u0160', 0x8a], ['\u2039', 0x8b], ['\u0152', 0x8c],
  ['\u017d', 0x8e], ['\u2018', 0x91], ['\u2019', 0x92], ['\u201c', 0x93],
  ['\u201d', 0x94], ['\u2022', 0x95], ['\u2013', 0x96], ['\u2014', 0x97],
  ['\u02dc', 0x98], ['\u2122', 0x99], ['\u0161', 0x9a], ['\u203a', 0x9b],
  ['\u0153', 0x9c], ['\u017e', 0x9e], ['\u0178', 0x9f],
]);

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

const TRUTHY_TEXT = new Map([
  [true, 'Yes'],
  [false, 'No'],
]);

/**
 * Returns true only for a Date that holds a real, finite instant.
 */
export function isValidDate(value) {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return !Number.isNaN(new Date(value).getTime());
}

/**
 * Formats a timestamp for display. Anything missing, empty or unparseable
 * resolves to `fallback` instead of "Invalid Date" / "undefined".
 */
export function formatDateTime(value, fallback = NOT_AVAILABLE) {
  if (!isValidDate(value)) return fallback;
  return new Date(value).toLocaleString();
}

/**
 * Formats a numeric score in the 0-100 range. Returns `fallback` for anything
 * that is not a finite number so raw values never leak into the UI.
 */
export function formatScore(value, { suffix = false, fallback = EM_DASH } = {}) {
  if (value === null || value === undefined || value === '') return fallback;
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return suffix ? `${score.toFixed(1)}/100` : score.toFixed(1);
}

/**
 * True when the value is a finite number, or a string that parses to one.
 * Used before rendering a value that may arrive as a number or a string.
 */
export function isNumericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') return Number.isFinite(Number(value));
  return false;
}

/**
 * Clamps a score into the 0-100 range for progress bar widths.
 */
export function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

/**
 * Renders an arbitrary backend value as user-facing text.
 *
 * Guarantees the output is never `undefined`, `null`, `[object Object]`,
 * `NaN` or an unrecognised object dump.
 */
export function formatDisplayValue(value, { fallback = NOT_AVAILABLE } = {}) {
  if (value === null || value === undefined) return fallback;

  if (typeof value === 'boolean') return TRUTHY_TEXT.get(value);

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : fallback;
  }

  if (typeof value === 'bigint') return value.toString();

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'NaN') return fallback;
    // Repair the classic mojibake sequence (UTF-8 bytes read as Windows-1252)
    // if it ever reaches us from the API or from stored generated content.
    return decodeMojibake(trimmed);
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return stringifyStructured(value, fallback);
  }

  return fallback;
}

/**
 * Reverses one round of Windows-1252 misdecoding.
 *
 * WebIntel hit this bug for real: an em dash (U+2014) had been committed to
 * the source as its UTF-8 bytes read through Windows-1252, so the UI rendered
 * "a€”". This repairs that class of damage for strings arriving from the API
 * or from stored generated content, and is a no-op for clean text.
 *
 * Returns the input unchanged if anything is not a recoverable single round.
 */
export function decodeMojibake(text) {
  if (typeof text !== 'string' || !MOJIBAKE_PATTERN.test(text)) {
    return text;
  }

  const bytes = [];

  for (const char of text) {
    const code = char.codePointAt(0);
    const mapped = CP1252_HIGH_BYTES.get(char);

    if (mapped !== undefined) {
      bytes.push(mapped);
    } else if (code <= 0xff) {
      bytes.push(code);
    } else {
      // A genuinely multi-byte character alongside a mojibake-looking
      // sequence: refuse to guess, keep the original text.
      return text;
    }
  }

  try {
    return utf8Decoder.decode(new Uint8Array(bytes));
  } catch {
    return text;
  }
}

/**
 * Renders nested structures as a readable one-line summary rather than
 * "[object Object]".
 */
function stringifyStructured(value, fallback) {
  try {
    const parts = Array.isArray(value)
      ? value.slice(0, 3).map((item) => formatDisplayValue(item, { fallback: BULLET }))
      : Object.entries(value).slice(0, 3).map(
          ([key, item]) => `${humanizeKey(key)}: ${formatDisplayValue(item, { fallback: BULLET })}`,
        );

    const joined = parts.filter(Boolean).join(', ');

    if (!joined) return fallback;
    return Array.isArray(value) && value.length > 3
      ? `${joined}, +${value.length - 3} more`
      : joined;
  } catch {
    return fallback;
  }
}

/**
 * Turns a snake_case backend key into a human-readable label.
 * Returns a safe fallback for keys that are not usable strings.
 */
export function humanizeKey(key) {
  if (typeof key !== 'string' || key.trim() === '') return EM_DASH;
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
