import { storage } from '../storage';
import { InsertActivity } from '@shared/schema';

// Log levels
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

// Interface for log data
interface LogData {
  message: string;
  userId?: number;
  adminId?: number;
  metadata?: Record<string, any>;
}

// Log to console
function consoleLog(level: LogLevel, data: LogData): void {
  const timestamp = new Date().toISOString();
  const userId = data.userId ? `User ID: ${data.userId}` : '';
  const adminId = data.adminId ? `Admin ID: ${data.adminId}` : '';
  const metadata = data.metadata ? JSON.stringify(data.metadata) : '';
  
  console.log(
    `[${timestamp}] [${level}] ${data.message} ${userId} ${adminId} ${metadata}`
  );
}

// Log to database
async function dbLog(level: LogLevel, data: LogData): Promise<void> {
  try {
    const activity: InsertActivity = {
      type: level,
      description: data.message,
      userId: data.userId,
      adminId: data.adminId,
    };
    
    await storage.createActivity(activity);
  } catch (error) {
    // Fallback to console if database logging fails
    console.error('Failed to log to database:', error);
  }
}

// Logger function
export async function logger(level: LogLevel, data: LogData): Promise<void> {
  // Always log to console
  consoleLog(level, data);
  
  // Log to database for important events
  if (level !== LogLevel.INFO) {
    await dbLog(level, data);
  }
}

// Helper methods
export const logInfo = (message: string, metadata?: Record<string, any>) => 
  logger(LogLevel.INFO, { message, metadata });

export const logWarning = (message: string, userId?: number, adminId?: number, metadata?: Record<string, any>) => 
  logger(LogLevel.WARNING, { message, userId, adminId, metadata });

export const logError = (message: string, userId?: number, adminId?: number, metadata?: Record<string, any>) => 
  logger(LogLevel.ERROR, { message, userId, adminId, metadata });

// Log user events
export const logUserEvent = async (description: string, userId?: number): Promise<void> => {
  try {
    const activity: InsertActivity = {
      type: 'USER',
      description,
      userId,
    };
    
    await storage.createActivity(activity);
  } catch (error) {
    console.error('Failed to log user event:', error);
  }
};

// Log admin events
export const logAdminEvent = async (description: string, adminId?: number): Promise<void> => {
  try {
    const activity: InsertActivity = {
      type: 'ADMIN',
      description,
      adminId,
    };
    
    await storage.createActivity(activity);
  } catch (error) {
    console.error('Failed to log admin event:', error);
  }
};
