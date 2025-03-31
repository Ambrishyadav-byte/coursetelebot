import { storage } from '../storage';
import { logError, logInfo } from '../utils/logger';
import { WooCommerceConfig, TelegramConfig } from '@shared/schema';

/**
 * API Configuration Manager
 * 
 * This service provides centralized access to API configuration settings
 * that are stored in the database and can be managed through the admin panel.
 */

// Configuration names
export const API_CONFIGS = {
  WOOCOMMERCE: 'woocommerce',
  TELEGRAM: 'telegram'
};

/**
 * Initialize default API configurations if they don't exist
 */
export async function initializeApiConfigurations() {
  try {
    // Check if WooCommerce config exists
    const wooCommerceConfig = await storage.getApiConfigurationByName(API_CONFIGS.WOOCOMMERCE);
    if (!wooCommerceConfig) {
      // Create default WooCommerce config
      await storage.createApiConfiguration({
        name: API_CONFIGS.WOOCOMMERCE,
        url: process.env.WOOCOMMERCE_STORE_URL || 'https://lastbreakup.com/',
        credentials: {
          consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
          consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || ''
        },
        isActive: true,
        updatedBy: 1 // Default admin ID
      });
      logInfo('Default WooCommerce API configuration created');
    }

    // Check if Telegram config exists
    const telegramConfig = await storage.getApiConfigurationByName(API_CONFIGS.TELEGRAM);
    if (!telegramConfig) {
      // Create default Telegram config
      await storage.createApiConfiguration({
        name: API_CONFIGS.TELEGRAM,
        url: 'https://api.telegram.org',
        credentials: {
          botToken: process.env.TELEGRAM_BOT_TOKEN || ''
        },
        isActive: true,
        updatedBy: 1 // Default admin ID
      });
      logInfo('Default Telegram API configuration created');
    }
  } catch (error) {
    if (error instanceof Error) {
      logError(`Failed to initialize API configurations: ${error.message}`);
    }
  }
}

/**
 * Get WooCommerce API configuration
 */
export async function getWooCommerceConfig(): Promise<{
  url: string;
  credentials: WooCommerceConfig;
} | null> {
  try {
    const config = await storage.getApiConfigurationByName(API_CONFIGS.WOOCOMMERCE);
    if (!config || !config.isActive) {
      logError('WooCommerce API configuration not found or inactive');
      return null;
    }
    
    return {
      url: config.url,
      credentials: config.credentials as WooCommerceConfig
    };
  } catch (error) {
    if (error instanceof Error) {
      logError(`Failed to get WooCommerce API configuration: ${error.message}`);
    }
    return null;
  }
}

/**
 * Get Telegram API configuration
 */
export async function getTelegramConfig(): Promise<{
  url: string;
  credentials: TelegramConfig;
} | null> {
  try {
    const config = await storage.getApiConfigurationByName(API_CONFIGS.TELEGRAM);
    if (!config || !config.isActive) {
      logError('Telegram API configuration not found or inactive');
      return null;
    }
    
    return {
      url: config.url,
      credentials: config.credentials as TelegramConfig
    };
  } catch (error) {
    if (error instanceof Error) {
      logError(`Failed to get Telegram API configuration: ${error.message}`);
    }
    return null;
  }
}