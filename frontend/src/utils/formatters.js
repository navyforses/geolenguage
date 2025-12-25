/**
 * Format utilities for the Digital Oligopoly Forecast app
 */

/**
 * Format currency value
 */
export function formatCurrency(value, currency = 'USD', options = {}) {
  if (value === null || value === undefined) return 'N/A';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: options.decimals ?? 2,
    maximumFractionDigits: options.decimals ?? 2
  });

  return formatter.format(value);
}

/**
 * Format large numbers with abbreviations
 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined) return 'N/A';

  const { decimals = 1, abbreviate = true } = options;

  if (!abbreviate) {
    return new Intl.NumberFormat('en-US').format(value);
  }

  const abbrevations = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' }
  ];

  for (const { value: threshold, symbol } of abbrevations) {
    if (Math.abs(value) >= threshold) {
      return (value / threshold).toFixed(decimals) + symbol;
    }
  }

  return value.toFixed(decimals);
}

/**
 * Format percentage
 */
export function formatPercent(value, options = {}) {
  if (value === null || value === undefined) return 'N/A';

  const { decimals = 2, showSign = true } = options;
  const formatted = Math.abs(value).toFixed(decimals);

  if (showSign) {
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  }

  return `${formatted}%`;
}

/**
 * Format date
 */
export function formatDate(date, format = 'medium') {
  if (!date) return 'N/A';

  const d = new Date(date);

  const formats = {
    short: { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  };

  return new Intl.DateTimeFormat('en-US', formats[format] || formats.medium).format(d);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date) {
  if (!date) return 'N/A';

  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return formatDate(date, 'short');
}

/**
 * Format sentiment score
 */
export function formatSentiment(value) {
  if (value === null || value === undefined) return { label: 'N/A', color: 'gray' };

  if (value > 0.3) return { label: 'Positive', color: 'green', value: `+${value.toFixed(2)}` };
  if (value < -0.3) return { label: 'Negative', color: 'red', value: value.toFixed(2) };
  return { label: 'Neutral', color: 'yellow', value: value.toFixed(2) };
}

/**
 * Format outlook
 */
export function formatOutlook(outlook) {
  const outlooks = {
    bullish: { label: 'Bullish', color: 'green', icon: '📈' },
    bearish: { label: 'Bearish', color: 'red', icon: '📉' },
    neutral: { label: 'Neutral', color: 'yellow', icon: '➡️' }
  };

  return outlooks[outlook] || outlooks.neutral;
}

/**
 * Format severity
 */
export function formatSeverity(severity) {
  const severities = {
    low: { label: 'Low', color: 'blue' },
    medium: { label: 'Medium', color: 'yellow' },
    high: { label: 'High', color: 'red' },
    critical: { label: 'Critical', color: 'red' }
  };

  return severities[severity] || severities.low;
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format market cap
 */
export function formatMarketCap(value) {
  return formatCurrency(value, 'USD', { decimals: 0 })
    .replace('$', '')
    .trim();
}

/**
 * Calculate percentage change
 */
export function calculateChange(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
