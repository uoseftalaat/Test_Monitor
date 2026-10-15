/**
 * Format bytes into human-readable unit string (e.g. 1.2 MB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format upload timestamp for Playwright report archives
 */
export function formatUploadTime(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return null;
  }
}

/**
 * Format time to local HH:MM:SS string
 */
export function formatTime(isoString) {
  if (!isoString) return 'Never';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (_) {
    return 'Never';
  }
}

/**
 * Format duration in milliseconds to human readable format (e.g. 120ms, 2.4s)
 */
export function formatDuration(durationMs) {
  if (typeof durationMs !== 'number' || durationMs < 0) return '0ms';
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}
