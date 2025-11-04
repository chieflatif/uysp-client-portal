/**
 * Jest Setup File
 * 
 * Global configuration for all tests
 */

// Polyfill web APIs for Next.js server components
// These are required for testing API routes that use NextRequest/NextResponse
if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {};
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {};
}

// Add custom matchers or global setup here if needed
