// Regex matching ANSI escape sequences (with ESC prefix, OSC, or bracketed numeric SGR codes)
export const ANSI_REGEX = /(?:\u001b\[([0-9;]*)[a-zA-Z]|\u001b\][^\u0007\u001b]*\u0007|\[([0-9;]+)m)/g;

/**
 * Completely strip all ANSI escape sequences and non-printable control characters.
 * @param {string} str
 * @returns {string}
 */
export function stripAnsi(str) {
  if (!str) return '';
  if (typeof str !== 'string') return String(str);
  return str
    .replace(ANSI_REGEX, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

/**
 * Tokenize a string into text chunks with associated terminal styles.
 * @param {string} text
 * @returns {Array<{ text: string, color?: string, bg?: string, bold?: boolean, dim?: boolean, underline?: boolean }>}
 */
export function parseAnsi(text) {
  if (!text) return [];
  if (typeof text !== 'string') text = String(text);

  // Clean unprintable control characters, preserving newlines and tabs
  const sanitized = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  const parts = [];
  let lastIndex = 0;
  let currentStyle = { bold: false, dim: false, underline: false, color: null, bg: null };

  let match;
  ANSI_REGEX.lastIndex = 0;

  while ((match = ANSI_REGEX.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: sanitized.slice(lastIndex, match.index),
        ...currentStyle
      });
    }

    const codeStr = match[1] !== undefined ? match[1] : match[2];
    const codes = codeStr ? codeStr.split(';').map(Number) : [0];

    for (const code of codes) {
      if (code === 0) {
        currentStyle = { bold: false, dim: false, underline: false, color: null, bg: null };
      } else if (code === 1) {
        currentStyle = { ...currentStyle, bold: true };
      } else if (code === 2) {
        currentStyle = { ...currentStyle, dim: true };
      } else if (code === 4) {
        currentStyle = { ...currentStyle, underline: true };
      } else if (code === 22) {
        currentStyle = { ...currentStyle, bold: false, dim: false };
      } else if (code === 24) {
        currentStyle = { ...currentStyle, underline: false };
      } else if (code === 30) {
        currentStyle = { ...currentStyle, color: 'text-slate-400' };
      } else if (code === 31) {
        currentStyle = { ...currentStyle, color: 'text-red-400' };
      } else if (code === 32) {
        currentStyle = { ...currentStyle, color: 'text-emerald-400' };
      } else if (code === 33) {
        currentStyle = { ...currentStyle, color: 'text-amber-300' };
      } else if (code === 34) {
        currentStyle = { ...currentStyle, color: 'text-blue-400' };
      } else if (code === 35) {
        currentStyle = { ...currentStyle, color: 'text-fuchsia-400' };
      } else if (code === 36) {
        currentStyle = { ...currentStyle, color: 'text-cyan-400' };
      } else if (code === 37) {
        currentStyle = { ...currentStyle, color: 'text-slate-200' };
      } else if (code === 39) {
        currentStyle = { ...currentStyle, color: null };
      } else if (code === 40) {
        currentStyle = { ...currentStyle, bg: null };
      } else if (code === 41) {
        currentStyle = { ...currentStyle, bg: 'bg-red-950/70 text-red-200 px-0.5 rounded' };
      } else if (code === 42) {
        currentStyle = { ...currentStyle, bg: 'bg-emerald-950/70 text-emerald-200 px-0.5 rounded' };
      } else if (code === 43) {
        currentStyle = { ...currentStyle, bg: 'bg-amber-950/70 text-amber-200 px-0.5 rounded' };
      } else if (code === 44) {
        currentStyle = { ...currentStyle, bg: 'bg-blue-950/70 text-blue-200 px-0.5 rounded' };
      } else if (code === 49) {
        currentStyle = { ...currentStyle, bg: null };
      } else if (code === 90) {
        currentStyle = { ...currentStyle, color: 'text-slate-500' };
      } else if (code === 91) {
        currentStyle = { ...currentStyle, color: 'text-red-300' };
      } else if (code === 92) {
        currentStyle = { ...currentStyle, color: 'text-emerald-300' };
      } else if (code === 93) {
        currentStyle = { ...currentStyle, color: 'text-yellow-300' };
      } else if (code === 94) {
        currentStyle = { ...currentStyle, color: 'text-blue-300' };
      } else if (code === 95) {
        currentStyle = { ...currentStyle, color: 'text-fuchsia-300' };
      } else if (code === 96) {
        currentStyle = { ...currentStyle, color: 'text-cyan-300' };
      } else if (code === 97) {
        currentStyle = { ...currentStyle, color: 'text-white' };
      }
    }
    lastIndex = ANSI_REGEX.lastIndex;
  }

  if (lastIndex < sanitized.length) {
    parts.push({
      text: sanitized.slice(lastIndex),
      ...currentStyle
    });
  }

  return parts.filter(p => p.text.length > 0);
}
