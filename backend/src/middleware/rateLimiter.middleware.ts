import rateLimit from 'express-rate-limit';

// General API protection against spam & bot enumeration
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after a minute',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

// Strict throttle for flash-sale checkout / reserve buttons to prevent automated scripts
export const reservationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'High reservation volume detected. Please wait before retrying your reservation request.',
      code: 'RESERVATION_RATE_LIMITED'
    }
  }
});
