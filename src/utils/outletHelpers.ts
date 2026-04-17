import { OutletType } from '@/types';

/**
 * Get the appropriate terminology for the outlet type
 * @param outletType - The outlet type
 * @returns The terminology string
 */
export function getTerminology(outletType: OutletType): string {
  switch (outletType) {
    case 'Restaurant':
      return 'Table';
    case 'Fastfood':
      return 'Counter';
    case 'Roomservice':
      return 'Room';
    case 'Restdirect':
      return 'Table';
    default:
      return 'Table';
  }
}

/**
 * Check if the outlet type requires payment
 * @param outletType - The outlet type
 * @returns True if payment is required
 */
export function requiresPayment(outletType: OutletType): boolean {
  switch (outletType) {
    case 'Restaurant':
      return true; // Payment at bill settlement
    case 'Fastfood':
      return true; // Immediate payment
    case 'Roomservice':
      return false; // No payment required
    case 'Restdirect':
      return true; // Immediate payment
    default:
      return true;
  }
}

/**
 * Check if the outlet type should show the orders page
 * @param outletType - The outlet type
 * @returns True if orders page should be shown
 */
export function showOrdersPage(outletType: OutletType): boolean {
  switch (outletType) {
    case 'Restaurant':
      return true; // Show orders page with bill overlay
    case 'Fastfood':
      return false; // No orders page for Fastfood
    case 'Roomservice':
      return false; // No orders page for Roomservice
    case 'Restdirect':
      return false; // No orders page for Restdirect
    default:
      return true;
  }
}

/**
 * Get the payment flow type for the outlet
 * @param outletType - The outlet type
 * @returns The payment flow type
 */
export function getPaymentFlow(outletType: OutletType): 'immediate' | 'cumulative' | 'none' {
  switch (outletType) {
    case 'Restaurant':
      return 'cumulative'; // Pay at bill settlement
    case 'Fastfood':
      return 'immediate'; // Pay immediately
    case 'Roomservice':
      return 'none'; // No payment required
    case 'Restdirect':
      return 'immediate'; // Pay immediately
    default:
      return 'cumulative';
  }
}

/**
 * Get the display text for payment information
 * @param outletType - The outlet type
 * @returns The payment information text
 */
export function getPaymentInfoText(outletType: OutletType): string {
  switch (outletType) {
    case 'Restaurant':
      return '📋 Payment at bill settlement';
    case 'Fastfood':
      return '💳 Pay now to complete your order';
    case 'Roomservice':
      return '🏨 Order will be charged to room.';
    case 'Restdirect':
      return '💳 Pay now to complete your order';
    default:
      return '📋 Payment at bill settlement';
  }
}

/**
 * Get the button text for placing orders
 * @param outletType - The outlet type
 * @returns The button text
 */
export function getOrderButtonText(outletType: OutletType): string {
  switch (outletType) {
    case 'Restaurant':
      return 'Place Order';
    case 'Fastfood':
      return 'Pay & Place Order';
    case 'Roomservice':
      return 'Place Order';
    case 'Restdirect':
      return 'Pay & Place Order';
    default:
      return 'Place Order';
  }
}

/**
 * Get the cart button text based on outlet type
 * @param outletType - The outlet type
 * @returns The cart button text
 */
export function getCartButtonText(outletType: OutletType): string {
  switch (outletType) {
    case 'Restaurant':
      return 'Place Order';
    case 'Fastfood':
      return 'View Order';
    case 'Roomservice':
      return 'View Order';
    case 'Restdirect':
      return 'View Order';
    default:
      return 'Place Order';
  }
}

/**
 * Check if order should be submitted from cart (Restaurant only)
 * @param outletType - The outlet type
 * @returns True if order should be submitted from cart
 */
export function shouldSubmitOrderFromCart(outletType: OutletType): boolean {
  switch (outletType) {
    case 'Restaurant':
      return true;
    case 'Fastfood':
      return false;
    case 'Roomservice':
      return false;
    case 'Restdirect':
      return false;
    default:
      return true;
  }
}

/**
 * Check if payment is required from cart (Fastfood only)
 * @param outletType - The outlet type
 * @returns True if payment is required from cart
 */
export function requiresPaymentFromCart(outletType: OutletType): boolean {
  switch (outletType) {
    case 'Restaurant':
      return false; // Payment happens later in orders page
    case 'Fastfood':
      return true;
    case 'Roomservice':
      return false;
    case 'Restdirect':
      return true;
    default:
      return false;
  }
}

/**
 * Check if cart should be shown in navigation (shown for all outlet types)
 * @param outletType - The outlet type
 * @returns True if cart should be shown
 */
export function showCartPage(outletType: OutletType): boolean {
  switch (outletType) {
    case 'Restaurant':
      return true;
    case 'Fastfood':
      return true; // Cart is shown in navigation
    case 'Roomservice':
      return true; // Cart is shown in navigation
    case 'Restdirect':
      return true; // Cart is shown in navigation
    default:
      return true;
  }
}
