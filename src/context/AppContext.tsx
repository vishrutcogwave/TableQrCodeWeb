'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MenuItem, CartItem, Order, TableInfo, OrderSubmitResponse, OutletType } from '@/types';
import { ApiService } from '@/services/api';

interface AppState {
  tableInfo: TableInfo | null;
  outletType: OutletType | null;
  menu: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  currentOrderTotal: number;
  grandTotal: number;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_TABLE_INFO'; payload: TableInfo }
  | { type: 'SET_OUTLET_TYPE'; payload: OutletType }
  | { type: 'SET_MENU'; payload: MenuItem[] }
  | { type: 'ADD_TO_CART'; payload: MenuItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: { id: string; quantity: number; instructions?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'RESTORE_CART'; payload: CartItem[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_TOTALS'; payload: { currentOrderTotal: number; grandTotal: number } };

const initialState: AppState = {
  tableInfo: null,
  outletType: null,
  menu: [],
  cart: [],
  orders: [],
  currentOrderTotal: 0,
  grandTotal: 0,
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TABLE_INFO':
      return { ...state, tableInfo: action.payload };
    
    case 'SET_OUTLET_TYPE':
      return { ...state, outletType: action.payload };
    
    case 'SET_MENU':
      return { ...state, menu: action.payload };
    
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        const updatedCart = state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return { ...state, cart: updatedCart };
      } else {
        const newCartItem: CartItem = {
          id: action.payload.id,
          name: action.payload.name,
          price: action.payload.price,
          quantity: 1,
          category: action.payload.category,
          isVegan: action.payload.isVegan,
          isVegetarian: action.payload.isVegetarian,
          isNonVegetarian: action.payload.isNonVegetarian,
          isEggBased: action.payload.isEggBased,
        };
        return { ...state, cart: [...state.cart, newCartItem] };
      }
    }
    
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.id !== action.payload) };
    
    case 'UPDATE_CART_ITEM': {
      const updatedCart = state.cart.map(item =>
        item.id === action.payload.id
          ? { 
              ...item, 
              quantity: action.payload.quantity,
              instructions: action.payload.instructions
            }
          : item
      ).filter(item => item.quantity > 0);
      return { ...state, cart: updatedCart };
    }
    
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    
    case 'RESTORE_CART':
      return { ...state, cart: action.payload };
    
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'UPDATE_TOTALS':
      return { 
        ...state, 
        currentOrderTotal: action.payload.currentOrderTotal,
        grandTotal: action.payload.grandTotal
      };
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  submitOrder: (guestName: string, mobileNumber: string, qrParams?: any) => Promise<OrderSubmitResponse>;
  loadExistingOrders: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Restore cart from sessionStorage on app initialization
  React.useEffect(() => {
    try {
      const savedCart = sessionStorage.getItem('cart');
      if (savedCart && state.cart.length === 0) {
        const cartItems = JSON.parse(savedCart);
        if (Array.isArray(cartItems) && cartItems.length > 0) {
          dispatch({ type: 'RESTORE_CART', payload: cartItems });
          console.log('Cart restored from sessionStorage:', cartItems.length, 'items');
        }
      }
    } catch (error) {
      console.error('Error restoring cart from sessionStorage:', error);
    }
  }, []); // Only run once on mount

  // Calculate totals whenever cart or orders change
  React.useEffect(() => {
    const currentTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grandTotal = state.orders.reduce((sum, order) => sum + order.totalAmount, 0) + currentTotal;
    
    if (currentTotal !== state.currentOrderTotal || grandTotal !== state.grandTotal) {
      dispatch({ type: 'UPDATE_TOTALS', payload: { currentOrderTotal: currentTotal, grandTotal } });
    }
  }, [state.cart, state.orders, state.currentOrderTotal, state.grandTotal]);

  // Process old cart data from getoldcart API response
  const processOldCartData = (foodArray: any[], tableInfo: TableInfo): Order[] => {
    const ordersMap = new Map<string, Order>();
    
    foodArray.forEach((foodItem: any) => {
      // Use code field as order ID; support different casings
      const orderId = (foodItem.code ?? foodItem.Code ?? foodItem.ORDERNO ?? foodItem.orderno ?? `ORDER_${Date.now()}`);
      
      if (!ordersMap.has(orderId)) {
        // Create new order
        ordersMap.set(orderId, {
          orderId: orderId,
          tableId: tableInfo.tableId,
          items: [],
          totalAmount: 0,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });
      }
      
      const order = ordersMap.get(orderId)!;
      
      // Add item to order
      const cartItem: CartItem = {
        id: (foodItem.Id ?? foodItem.id ?? foodItem.code ?? foodItem.Code ?? '').toString(),
        name: (foodItem.Food ?? foodItem.food ?? foodItem.name ?? 'Unknown Item'),
        price: (foodItem.Price ?? foodItem.price ?? foodItem.Rate ?? 0),
        quantity: (foodItem.Qty ?? foodItem.qty ?? foodItem.quantity ?? 1),
        instructions: (foodItem.Comment ?? foodItem.comment ?? foodItem.instructions ?? ''),
        category: (foodItem.Category ?? foodItem.category ?? '').toString(),
        isVegan: false, // Default values, can be enhanced based on API response
        isVegetarian: false,
        isNonVegetarian: true,
        isEggBased: false
      };
      
      order.items.push(cartItem);
      order.totalAmount += (cartItem.price * cartItem.quantity);
    });
    
    return Array.from(ordersMap.values());
  };

  // Submit order function
  const submitOrder = async (guestName: string, mobileNumber: string, qrParams?: any): Promise<OrderSubmitResponse> => {
    if (!state.tableInfo || state.cart.length === 0) {
      return {
        success: false,
        error: 'No table info or cart items available'
      };
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log("Submitting order");
      console.log("Guest Name:", guestName);
      console.log("Mobile Number:", mobileNumber);
      console.log("QR Params:", qrParams);
      const result = await ApiService.submitOrder(
        state.cart,
        state.tableInfo,
        guestName,
        mobileNumber,
        qrParams
      );

      
      if (result.success) {
        try {
          // Fetch old cart data after successful order submission
          const oldCartData = await ApiService.getOldCart(state.tableInfo);
          
          const foodArray = (oldCartData && (oldCartData.Food || oldCartData.food || (oldCartData.data && oldCartData.data.food))) || [];
          if (Array.isArray(foodArray) && foodArray.length > 0) {
            // Process the food array from getoldcart response
            const processedOrders = processOldCartData(foodArray, state.tableInfo);
            
            // Replace all orders with the fresh data from getoldcart
            dispatch({ type: 'SET_ORDERS', payload: processedOrders });
          } else {
            console.log("No food items found in getoldcart response");
          }
          
          // Clear cart after successful processing
          dispatch({ type: 'CLEAR_CART' });
        } catch (error) {
          console.error('Error fetching old cart data:', error);
          // Clear cart even if getoldcart fails
          dispatch({ type: 'CLEAR_CART' });
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
      return result;

    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to submit order' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit order'
      };
    }
  };

  // Load existing orders from getoldcart API
  const loadExistingOrders = async (): Promise<void> => {
    if (!state.tableInfo) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const oldCartData = await ApiService.getOldCart(state.tableInfo);
      
      // Extract and save GuestName and KotMobileNo from getoldcart response
      if (oldCartData) {
        try {
          if (oldCartData.GuestName && !sessionStorage.getItem('guestName')) {
            sessionStorage.setItem('guestName', oldCartData.GuestName);
            console.log('Restored GuestName from getoldcart:', oldCartData.GuestName);
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('guestNameUpdated'));
          }
          if (oldCartData.KotMobileNo && !sessionStorage.getItem('mobileNumber')) {
            sessionStorage.setItem('mobileNumber', oldCartData.KotMobileNo);
            console.log('Restored KotMobileNo from getoldcart:', oldCartData.KotMobileNo);
          }
        } catch (storageError) {
          console.error('Error saving guest info to sessionStorage:', storageError);
        }
      }
      
      // Check if we got valid data
      if (oldCartData && (oldCartData.Food || oldCartData.food || (oldCartData.data && oldCartData.data.food))) {
        const foodArray = (oldCartData.Food || oldCartData.food || (oldCartData.data && oldCartData.data.food)) || [];
        if (Array.isArray(foodArray) && foodArray.length > 0) {
          const processedOrders = processOldCartData(foodArray, state.tableInfo);
          dispatch({ type: 'SET_ORDERS', payload: processedOrders });
        } else {
          console.log("No food items found in getoldcart response");
        }
      } else {
        console.log("No valid data found in getoldcart response:", oldCartData);
      }
    } catch (error) {
      console.error('Error loading existing orders:', error);
      // Don't throw error to prevent infinite loops
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, submitOrder, loadExistingOrders }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
