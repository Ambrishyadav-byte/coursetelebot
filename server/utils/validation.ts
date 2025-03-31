import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Generic validation middleware
export function validateRequest<T extends z.ZodType>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await schema.parseAsync(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

// Sanitize a string to prevent SQL injection
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, '\\\\') // Escape backslashes
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Telegram ID format (numeric string)
export function isValidTelegramId(id: string): boolean {
  return /^\d+$/.test(id);
}

// Validate WooCommerce order ID format
export function isValidOrderId(id: string): boolean {
  return /^\d+$/.test(id);
}

// Extract and sanitize telegram ID from potential formats
export function extractTelegramId(input: string): string | null {
  // Remove any non-numeric characters
  const id = input.replace(/\D/g, '');
  return id.length > 0 ? id : null;
}
