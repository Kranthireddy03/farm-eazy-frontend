/**
 * Console Filter Utility
 * 
 * Filters out noise from third-party scripts and browser extensions
 * while preserving all FarmEazy application logs.
 * 
 * FILTERED (noise from extensions/third-party):
 * - RTB fingerprint headers
 * - Accelerometer/devicemotion policy violations
 * - Third-party bundle.min.js warnings
 * - Preload link warnings
 * 
 * PRESERVED (always shown):
 * - All FarmEazy logs (DEBUG, INFO, ERROR)
 * - All actual JavaScript errors
 * - Network errors
 * - React errors
 */

const NOISE_PATTERNS = [
  // Browser extension noise
  /x-rtb-fingerprint/i,
  /rtb-fingerprint-id/i,
  
  // Third-party sensor policy violations
  /permissions policy.*accelerometer/i,
  /permissions policy.*gyroscope/i,
  /devicemotion.*blocked/i,
  /deviceorientation.*blocked/i,
  
  // Common third-party script noise
  /bundle\.min\.js/i,
  /v2-entry\.modern\.js/i,
  
  // Preload warnings (not errors)
  /preloaded using link preload but not used/i,
  
  // Mixed content warnings for localhost (expected in dev)
  /Mixed Content.*localhost/i,
];

// Keywords that should NEVER be filtered (FarmEazy app logs)
const PRESERVE_PATTERNS = [
  /farmeazy/i,
  /\[DEBUG\]/i,
  /\[INFO\]/i,
  /\[ERROR\]/i,
  /\[WARN\]/i,
  /farm/i,
  /crop/i,
  /irrigation/i,
  /order/i,
  /payment/i,
  /razorpay/i,
  /auth/i,
  /login/i,
  /register/i,
  /otp/i,
  /sms/i,
  /api\//i,
];

/**
 * Check if a message should be filtered (hidden)
 */
function shouldFilter(args) {
  const message = args.map(arg => 
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');
  
  // Never filter if it matches preserve patterns
  for (const pattern of PRESERVE_PATTERNS) {
    if (pattern.test(message)) {
      return false;
    }
  }
  
  // Filter if it matches noise patterns
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Initialize console filter
 * Only runs in development mode
 */
export function initConsoleFilter() {
  // Only filter in development
  if (import.meta.env.PROD) {
    return;
  }
  
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Filter console.warn
  console.warn = function(...args) {
    if (!shouldFilter(args)) {
      originalWarn.apply(console, args);
    }
  };
  
  // Filter console.error (but be more careful - only filter known noise)
  console.error = function(...args) {
    if (!shouldFilter(args)) {
      originalError.apply(console, args);
    }
  };
  
  // Log that filter is active (useful for debugging)
  console.log('%c[FarmEazy] Console filter active - hiding third-party noise', 
    'color: #10b981; font-weight: bold;');
}

/**
 * Disable console filter (restore original)
 * Call this if you need to see all console output
 */
export function disableConsoleFilter() {
  // Reload page to restore original console
  console.log('%c[FarmEazy] To disable filter, refresh page and comment out initConsoleFilter() in main.jsx', 
    'color: #f59e0b; font-weight: bold;');
}

export default { initConsoleFilter, disableConsoleFilter };
