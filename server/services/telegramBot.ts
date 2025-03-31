import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { verifyOrderPayment } from './woocommerce';
import { logError, logInfo, logUserEvent } from '../utils/logger';
import { sanitizeString, isValidEmail, isValidOrderId } from '../utils/validation';
import { telegramRateLimit } from '../middlewares/rateLimiter';

// Get Telegram token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

// User state management
interface UserState {
  step: 'START' | 'EMAIL' | 'ORDER_ID';
  email?: string;
}

const userStates = new Map<number, UserState>();

// Handle start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(chatId);
  
  // Rate limiting
  if (!await telegramRateLimit(telegramId)) {
    bot.sendMessage(chatId, 'Too many requests. Please try again later.');
    return;
  }
  
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByTelegramId(telegramId);
    
    if (existingUser) {
      if (existingUser.isBanned) {
        bot.sendMessage(chatId, 'Your account has been banned. Please contact support for assistance.');
        return;
      }
      
      if (existingUser.isVerified) {
        bot.sendMessage(chatId, `Welcome back! You are already verified with email: ${existingUser.email}`);
        
        // Send course menu
        sendCourseMenu(chatId);
        return;
      }
      
      bot.sendMessage(chatId, `Welcome back! Your account with email ${existingUser.email} is not verified yet. Please provide your WooCommerce order ID.`);
      userStates.set(chatId, { step: 'ORDER_ID', email: existingUser.email });
      return;
    }
    
    // New user
    bot.sendMessage(chatId, 'Welcome to our course bot! Please provide your email address to verify your purchase.');
    userStates.set(chatId, { step: 'EMAIL' });
    
  } catch (error) {
    handleBotError(chatId, error);
  }
});

// Handle help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    'Available commands:\n' +
    '/start - Start or restart the verification process\n' +
    '/courses - View available courses\n' +
    '/help - Show this help message'
  );
});

// Handle courses command
bot.onText(/\/courses/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(chatId);
  
  try {
    const user = await storage.getUserByTelegramId(telegramId);
    
    if (!user) {
      bot.sendMessage(chatId, 'Please use /start to register and verify your purchase first.');
      return;
    }
    
    if (user.isBanned) {
      bot.sendMessage(chatId, 'Your account has been banned. Please contact support for assistance.');
      return;
    }
    
    if (!user.isVerified) {
      bot.sendMessage(chatId, 'Your account is not verified yet. Please complete the verification process first.');
      return;
    }
    
    sendCourseMenu(chatId);
    
  } catch (error) {
    handleBotError(chatId, error);
  }
});

// Handle text messages (for email, order ID inputs)
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const telegramId = String(chatId);
  const text = msg.text.trim();
  
  // Rate limiting
  if (!await telegramRateLimit(telegramId)) {
    bot.sendMessage(chatId, 'Too many requests. Please try again later.');
    return;
  }
  
  // Get user state
  const state = userStates.get(chatId);
  if (!state) {
    bot.sendMessage(chatId, 'Please use /start to begin the verification process.');
    return;
  }
  
  try {
    // Handle email input
    if (state.step === 'EMAIL') {
      const sanitizedEmail = sanitizeString(text);
      
      if (!isValidEmail(sanitizedEmail)) {
        bot.sendMessage(chatId, 'Please provide a valid email address.');
        return;
      }
      
      // Check if email is already used
      const existingUser = await storage.getUserByEmail(sanitizedEmail);
      if (existingUser) {
        bot.sendMessage(chatId, 'This email is already registered. Please use a different email or contact support.');
        return;
      }
      
      // Update state and ask for order ID
      userStates.set(chatId, { step: 'ORDER_ID', email: sanitizedEmail });
      bot.sendMessage(chatId, `Email registered: ${sanitizedEmail}. Now, please provide your WooCommerce order ID to verify your purchase.`);
      return;
    }
    
    // Handle order ID input
    if (state.step === 'ORDER_ID' && state.email) {
      const sanitizedOrderId = sanitizeString(text);
      
      if (!isValidOrderId(sanitizedOrderId)) {
        bot.sendMessage(chatId, 'Please provide a valid order ID (numeric values only).');
        return;
      }
      
      bot.sendMessage(chatId, 'Verifying your order. Please wait...');
      
      // Verify order with WooCommerce
      const isValid = await verifyOrderPayment(sanitizedOrderId, state.email);
      
      if (!isValid) {
        bot.sendMessage(chatId, 'We could not verify your purchase. Please check your order ID and email, or contact support.');
        return;
      }
      
      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (user) {
        // Update existing user
        user = await storage.updateUser(user.id, {
          isVerified: true,
          orderId: sanitizedOrderId
        });
        
        logUserEvent(`User ${user.email} verified with order ${sanitizedOrderId}`, user.id);
        
      } else {
        // Create new user
        user = await storage.createUser({
          telegramId,
          email: state.email,
          isVerified: true,
          isBanned: false,
          orderId: sanitizedOrderId
        });
        
        logUserEvent(`New user created and verified: ${user.email}`, user.id);
      }
      
      // Clear state
      userStates.delete(chatId);
      
      bot.sendMessage(chatId, 'Your purchase has been verified! You now have access to our courses.');
      sendCourseMenu(chatId);
    }
  } catch (error) {
    handleBotError(chatId, error);
  }
});

// Handle callback queries (course selection)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId) return;
  
  const telegramId = String(chatId);
  const data = callbackQuery.data;
  
  if (!data) return;
  
  try {
    // Check if user is verified
    const user = await storage.getUserByTelegramId(telegramId);
    
    if (!user || !user.isVerified || user.isBanned) {
      bot.answerCallbackQuery(callbackQuery.id, { 
        text: 'You need to be verified to access courses', 
        show_alert: true 
      });
      return;
    }
    
    if (data.startsWith('course_')) {
      const courseId = parseInt(data.replace('course_', ''), 10);
      
      // Get course content
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: 'Course not found', 
          show_alert: true 
        });
        return;
      }
      
      // Send course content
      bot.sendMessage(chatId, 
        `*${course.title}*\n\n${course.description}\n\n${course.content}`, 
        { parse_mode: 'Markdown' }
      );
      
      bot.answerCallbackQuery(callbackQuery.id);
      
      // Log course access
      logUserEvent(`User accessed course: ${course.title}`, user.id);
    }
    
    if (data === 'courses_menu') {
      sendCourseMenu(chatId);
      bot.answerCallbackQuery(callbackQuery.id);
    }
    
  } catch (error) {
    handleBotError(chatId, error);
    bot.answerCallbackQuery(callbackQuery.id, { 
      text: 'An error occurred', 
      show_alert: true 
    });
  }
});

// Send available courses menu
async function sendCourseMenu(chatId: number) {
  try {
    const courses = await storage.getActiveCourses();
    
    if (courses.length === 0) {
      bot.sendMessage(chatId, 'No courses available at the moment.');
      return;
    }
    
    const keyboard = courses.map(course => [
      { text: course.title, callback_data: `course_${course.id}` }
    ]);
    
    bot.sendMessage(chatId, 'Available Courses:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    handleBotError(chatId, error);
  }
}

// Error handler
function handleBotError(chatId: number, error: unknown) {
  if (error instanceof Error) {
    logError(`Telegram bot error: ${error.message}`);
  }
  
  bot.sendMessage(chatId, 'An error occurred. Please try again later or contact support.');
}

// Export bot instance
export { bot };
