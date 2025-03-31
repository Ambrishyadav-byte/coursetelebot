import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiters for different endpoints
const loginLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60 * 15, // per 15 minutes
});

const apiLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 1 minute
});

const telegramLimiter = new RateLimiterMemory({
  points: 20, // 20 attempts
  duration: 60, // per 1 minute
});

// Middleware for rate limiting login attempts
export const loginRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use IP as a key
    const key = req.ip || 'unknown';
    await loginLimiter.consume(key);
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Rate limit error:', error);
    }
    res.status(429).json({ message: 'Too many login attempts, please try again later' });
  }
};

// Middleware for rate limiting API requests
export const apiRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use IP or user ID if authenticated
    const key = req.user ? `user_${req.user.id}` : req.ip || 'unknown';
    await apiLimiter.consume(key);
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Rate limit error:', error);
    }
    res.status(429).json({ message: 'Too many requests, please try again later' });
  }
};

// Function for rate limiting Telegram bot requests
export const telegramRateLimit = async (telegramId: string): Promise<boolean> => {
  try {
    await telegramLimiter.consume(telegramId);
    return true;
  } catch (error) {
    return false;
  }
};
