import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { logError, logInfo } from '../utils/logger';

// Initialize WooCommerce API client
const WooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL || 'https://your-store.com',
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  version: 'wc/v3'
});

interface OrderData {
  id: number;
  status: string;
  billing: {
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    product_id: number;
    name: string;
  }>;
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<OrderData | null> {
  try {
    logInfo(`Fetching WooCommerce order: ${orderId}`);
    const response = await WooCommerce.get(`orders/${orderId}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      logError(`Failed to fetch WooCommerce order: ${error.message}`);
    }
    return null;
  }
}

// Check if order is paid/completed
export function isOrderPaid(order: OrderData): boolean {
  const paidStatuses = ['completed', 'processing'];
  return paidStatuses.includes(order.status);
}

// Get customer email from order
export function getOrderEmail(order: OrderData): string {
  return order.billing.email;
}

// Verify if an order exists and is paid
export async function verifyOrderPayment(orderId: string, email: string): Promise<boolean> {
  try {
    const order = await getOrderById(orderId);
    
    if (!order) {
      logInfo(`Order not found: ${orderId}`);
      return false;
    }
    
    // Verify order belongs to the correct customer
    if (getOrderEmail(order).toLowerCase() !== email.toLowerCase()) {
      logInfo(`Email mismatch for order ${orderId}`);
      return false;
    }
    
    // Check if order is paid
    if (!isOrderPaid(order)) {
      logInfo(`Order not paid: ${orderId}`);
      return false;
    }
    
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logError(`Error verifying order payment: ${error.message}`);
    }
    return false;
  }
}
