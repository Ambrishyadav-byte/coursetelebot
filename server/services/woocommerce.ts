import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { logError, logInfo } from '../utils/logger';
import { getWooCommerceConfig } from './apiConfigManager';

// Create a function to get a configured WooCommerce client
async function getWooCommerceClient(): Promise<WooCommerceRestApi | null> {
  try {
    const config = await getWooCommerceConfig();
    
    if (!config) {
      logError('Failed to get WooCommerce configuration from database');
      return null;
    }
    
    return new WooCommerceRestApi({
      url: config.url,
      consumerKey: config.credentials.consumerKey,
      consumerSecret: config.credentials.consumerSecret,
      version: 'wc/v3'
    });
  } catch (error) {
    if (error instanceof Error) {
      logError(`Error creating WooCommerce client: ${error.message}`);
    }
    return null;
  }
}

// Based on the actual WooCommerce response structure
interface OrderData {
  id: number;
  parent_id: number;
  status: string;
  currency: string;
  version: string;
  prices_include_tax: boolean;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_note: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    taxes: any[];
    meta_data: any[];
    sku: string;
    price: number;
    parent_name: string | null;
  }>;
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<OrderData | null> {
  try {
    logInfo(`Fetching WooCommerce order: ${orderId}`);
    
    const wooCommerce = await getWooCommerceClient();
    if (!wooCommerce) {
      logError('WooCommerce client initialization failed');
      return null;
    }
    
    const response = await wooCommerce.get(`orders/${orderId}`);
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
