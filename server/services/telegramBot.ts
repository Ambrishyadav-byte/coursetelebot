import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { verifyOrderPayment } from './woocommerce';
import { logError, logInfo, logUserEvent } from '../utils/logger';
import { sanitizeString, isValidEmail, isValidOrderId } from '../utils/validation';
import { telegramRateLimit } from '../middlewares/rateLimiter';
import { getTelegramConfig, initializeApiConfigurations } from './apiConfigManager';

// Type guard for TelegramBot
function isTelegramBot(bot: any): bot is TelegramBot {
  return bot && 
         typeof bot.stopPolling === 'function' && 
         typeof bot.isPolling === 'function';
}

// Helper function to safely stop a bot
async function stopBot(bot: any): Promise<void> {
  if (isTelegramBot(bot) && bot.isPolling()) {
    await bot.stopPolling();
  }
}

// Create a function to initialize and get the Telegram bot
let botInstance: TelegramBot | null = null;
let isInitializing = false;

/**
 * Initialize the Telegram bot with configuration from database
 * This should be called at application startup
 */
export async function bootstrapTelegramBot(): Promise<void> {
  if (isInitializing) {
    logInfo("Telegram bot initialization already in progress");
    return;
  }
  
  isInitializing = true;
  
  try {
    // First ensure API configurations are initialized in the database
    await initializeApiConfigurations();
    
    // Then initialize the bot
    const bot = await initTelegramBot();
    
    if (!bot) {
      logError("Failed to initialize Telegram bot during bootstrap");
    } else {
      logInfo("Telegram bot service bootstrapped successfully");
    }
  } catch (error) {
    if (error instanceof Error) {
      logError(`Error bootstrapping Telegram bot: ${error.message}`);
    } else {
      logError(`Unknown error bootstrapping Telegram bot`);
    }
  } finally {
    isInitializing = false;
  }
}

/**
 * Initialize the Telegram bot instance
 * This handles the actual bot creation and event handler registration
 */
export async function initTelegramBot(): Promise<TelegramBot | null> {
  // If we already have a bot instance, return it
  if (botInstance) {
    return botInstance;
  }

  try {
    // Stop any previous polling
    if (botInstance) {
      try {
        // Safely stop the bot
        await stopBot(botInstance);
      } catch (err) {
        // Ignore errors when stopping polling
        logError(`Error stopping bot polling: ${err instanceof Error ? err.message : String(err)}`);
      }
      botInstance = null;
    }
    
    // Get Telegram configuration from database
    const config = await getTelegramConfig();
    
    if (!config) {
      logError("Telegram configuration not found in database");
      
      // Fallback to environment variable as a temporary measure
      const tokenFromEnv = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
      
      if (!tokenFromEnv) {
        logError("No Telegram bot token available");
        return null;
      }
      
      // Create bot with token from environment
      botInstance = new TelegramBot(tokenFromEnv, { polling: true });
      logInfo("Telegram bot initialized from environment variables");
    } else {
      // Create bot with token from database
      if (!config.credentials.botToken) {
        logError("Bot token is empty in database configuration");
        return null;
      }
      
      botInstance = new TelegramBot(config.credentials.botToken, { polling: true });
      logInfo("Telegram bot initialized from database configuration");
    }
    
    // Register the event handlers
    await registerBotHandlers(botInstance);
    
    return botInstance;
  } catch (error) {
    if (error instanceof Error) {
      logError(`Failed to initialize Telegram bot: ${error.message}`);
    }
    return null;
  }
}

// Export the function to get the bot instance
export async function getBot(): Promise<TelegramBot> {
  const bot = await initTelegramBot();
  if (!bot) {
    throw new Error('Telegram bot is not initialized');
  }
  return bot;
}

// User state management
interface UserState {
  step: 'START' | 'EMAIL' | 'ORDER_ID';
  email?: string;
}

const userStates = new Map<number, UserState>();

// Welcome message
const welcomeMessage = `
🎓 *Welcome to our Course Learning Bot!* 🎓

This bot provides access to our premium educational content.

To get started:
1️⃣ Verify your purchase with your email and order ID
2️⃣ Browse available courses
3️⃣ Access course materials anytime

*Commands:*
/start - Begin or restart verification
/courses - View available courses
/help - Show this help message

If you've already purchased a course from our website, please proceed with verification. Otherwise, visit our website to make a purchase first.
`;

// Register bot event handlers
async function registerBotHandlers(bot: TelegramBot) {
  // Handle start command
  bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(chatId);
  const username = msg.from?.username || msg.from?.first_name || 'User';
  
  // Rate limiting
  if (!await telegramRateLimit(telegramId)) {
    bot.sendMessage(chatId, '⚠️ Too many requests. Please try again later.');
    return;
  }
  
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByTelegramId(telegramId);
    
    if (existingUser) {
      if (existingUser.isBanned) {
        bot.sendMessage(chatId, '🚫 Your account has been banned. Please contact support for assistance.');
        return;
      }
      
      if (existingUser.isVerified) {
        bot.sendMessage(chatId, `👋 Welcome back, ${username}! You are already verified with email: *${existingUser.email}*`, {
          parse_mode: 'Markdown'
        });
        
        // Send course menu
        await sendCourseMenu(chatId);
        return;
      }
      
      bot.sendMessage(chatId, 
        `👋 Welcome back! Your account with email *${existingUser.email}* is not verified yet.\n\nPlease provide your WooCommerce order ID to complete verification.`, 
        { parse_mode: 'Markdown' }
      );
      userStates.set(chatId, { step: 'ORDER_ID', email: existingUser.email });
      return;
    }
    
    // New user
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    bot.sendMessage(chatId, '📧 Please provide your email address to verify your purchase:');
    userStates.set(chatId, { step: 'EMAIL' });
    
    logInfo(`New user started bot: ${username} (${telegramId})`);
    
  } catch (error) {
    handleBotError(chatId, error);
  }
});

// Handle help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle courses command
bot.onText(/\/courses/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(chatId);
  
  try {
    const user = await storage.getUserByTelegramId(telegramId);
    
    if (!user) {
      bot.sendMessage(chatId, '⚠️ Please use /start to register and verify your purchase first.');
      return;
    }
    
    if (user.isBanned) {
      bot.sendMessage(chatId, '🚫 Your account has been banned. Please contact support for assistance.');
      return;
    }
    
    if (!user.isVerified) {
      bot.sendMessage(chatId, '⚠️ Your account is not verified yet. Please complete the verification process first.');
      return;
    }
    
    await sendCourseMenu(chatId);
    
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
    bot.sendMessage(chatId, '⚠️ Too many requests. Please try again later.');
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
        bot.sendMessage(chatId, '❌ Please provide a valid email address.');
        return;
      }
      
      // Check if email is already used by another Telegram ID
      const existingUser = await storage.getUserByEmail(sanitizedEmail);
      if (existingUser && existingUser.telegramId !== telegramId) {
        bot.sendMessage(chatId, '❌ This email is already registered with another Telegram account. Each email can only be connected to one Telegram account. Please use a different email or contact support.');
        return;
      }
      
      // Update state and ask for order ID
      userStates.set(chatId, { step: 'ORDER_ID', email: sanitizedEmail });
      bot.sendMessage(chatId, `✅ Email registered: *${sanitizedEmail}*\n\nNow, please provide your WooCommerce order ID to verify your purchase.`, {
        parse_mode: 'Markdown'
      });
      
      logInfo(`User provided email: ${sanitizedEmail} (${telegramId})`);
      return;
    }
    
    // Handle order ID input
    if (state.step === 'ORDER_ID' && state.email) {
      const sanitizedOrderId = sanitizeString(text);
      
      if (!isValidOrderId(sanitizedOrderId)) {
        bot.sendMessage(chatId, '❌ Please provide a valid order ID (numeric values only).');
        return;
      }
      
      const waitMessage = await bot.sendMessage(chatId, '🔍 Verifying your order. Please wait...');
      
      // Verify order with WooCommerce
      const isValid = await verifyOrderPayment(sanitizedOrderId, state.email);
      
      if (!isValid) {
        bot.sendMessage(chatId, '❌ We could not verify your purchase. Please check your order ID and email, or contact support.');
        return;
      }
      
      // Check if user exists with this Telegram ID
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (user) {
        // Update existing user
        const updatedUser = await storage.updateUser(user.id, {
          isVerified: true,
          orderId: sanitizedOrderId,
          email: state.email // Update email in case it changed
        });
        
        if (updatedUser) {
          logUserEvent(`User updated and verified: ${updatedUser.email} with order ${sanitizedOrderId}`, updatedUser.id);
        } else {
          logError(`Failed to update user ${user.id} during verification`);
        }
      } else {
        // Create new user
        user = await storage.createUser({
          telegramId,
          email: state.email,
          isVerified: true,
          isBanned: false,
          orderId: sanitizedOrderId
        });
        
        logUserEvent(`New user created and verified: ${user.email} with order ${sanitizedOrderId}`, user.id);
      }
      
      // Clear state
      userStates.delete(chatId);
      
      // Edit the wait message to show verification success
      await bot.editMessageText('✅ Verification successful!', {
        chat_id: chatId,
        message_id: waitMessage.message_id
      });
      
      // Send success message and course menu
      bot.sendMessage(chatId, 
        `🎉 Congratulations! Your purchase has been verified!\n\nYou now have access to our courses. Use /courses anytime to browse the available content.`, 
        { parse_mode: 'Markdown' }
      );
      
      // Send course menu after a small delay
      setTimeout(() => {
        sendCourseMenu(chatId);
      }, 1000);
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
      
      // Get course subcontents
      const subcontents = await storage.getCourseSubcontents(courseId);
      
      // Send course details
      let courseMessage = `*${course.title}*\n\n${course.description}\n\n`;
      
      // Add main content (shortened if very long)
      const maxContentLength = 500;
      courseMessage += course.content.length > maxContentLength 
        ? course.content.substring(0, maxContentLength) + '...' 
        : course.content;
      
      await bot.sendMessage(chatId, courseMessage, { parse_mode: 'Markdown' });
      
      // Create keyboard for subcontents if available
      if (subcontents.length > 0) {
        const subcontentKeyboard = subcontents.map(subcontent => [
          { text: subcontent.title, callback_data: `subcontent_${subcontent.id}` }
        ]);
        
        // Add back button
        subcontentKeyboard.push([{ text: '« Back to Courses', callback_data: 'courses_menu' }]);
        
        await bot.sendMessage(chatId, '📚 *Lessons & Materials:*', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: subcontentKeyboard
          }
        });
      } else {
        // Just add a back button if no subcontents
        await bot.sendMessage(chatId, '« Back to course list:', {
          reply_markup: {
            inline_keyboard: [[
              { text: 'Back to Courses', callback_data: 'courses_menu' }
            ]]
          }
        });
      }
      
      bot.answerCallbackQuery(callbackQuery.id);
      
      // Log course access
      logUserEvent(`User accessed course: ${course.title}`, user.id);
      return;
    }
    
    if (data.startsWith('subcontent_')) {
      const subcontentId = parseInt(data.replace('subcontent_', ''), 10);
      
      // Get subcontent
      const subcontent = await storage.getCourseSubcontent(subcontentId);
      
      if (!subcontent) {
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: 'Content not found', 
          show_alert: true 
        });
        return;
      }
      
      // Send subcontent
      await bot.sendMessage(chatId, `*${subcontent.title}*\n\n${subcontent.content}`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '« Back to Course', callback_data: `course_${subcontent.courseId}` }
          ]]
        }
      });
      
      bot.answerCallbackQuery(callbackQuery.id);
      
      // Log subcontent access
      logUserEvent(`User accessed lesson: ${subcontent.title} (Course ID: ${subcontent.courseId})`, user.id);
      return;
    }
    
    if (data === 'courses_menu') {
      await sendCourseMenu(chatId);
      bot.answerCallbackQuery(callbackQuery.id);
      return;
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
    const bot = await getBot();
    
    if (courses.length === 0) {
      bot.sendMessage(chatId, '📕 No courses available at the moment.');
      return;
    }
    
    const keyboard = courses.map(course => [
      { text: course.title, callback_data: `course_${course.id}` }
    ]);
    
    await bot.sendMessage(chatId, '📚 *Available Courses:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    handleBotError(chatId, error);
  }
}

// Error handler
async function handleBotError(chatId: number, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logError(`Telegram bot error: ${errorMessage}`);
  
  try {
    const bot = await getBot();
    bot.sendMessage(chatId, '❌ An error occurred. Please try again later or contact support.');
  } catch (err) {
    logError(`Failed to send error message to user: ${err}`);
  }
}

}
