export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean; // Based on API 'Avaliable' field
  category: string;
  subCategory: string;
  isVegan: boolean;
  isVegetarian: boolean;
  isNonVegetarian: boolean;
  isEggBased: boolean;
  image: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  image: string;
  items: MenuItem[];
}

// API Response Types
export interface ApiCategory {
  CategoryId: number;
  Category: string;
  thumb: string | null;
}

export interface ApiMenuItem {
  ItemCode: number;
  ItemName: string;
  ItemRate: number;
  CatCode: number;
  Qty: number;
  thumb: string | null;
  Avaliable: boolean;
  description: string | null;
  CurrentPrize: number;
  VATPER: number;
  Rating: number;
  IsVeg: boolean;
  Category: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  instructions?: string;
  category: string;
  isVegan: boolean;
  isVegetarian: boolean;
  isNonVegetarian: boolean;
  isEggBased: boolean;
}

export interface Order {
  orderId: string;
  tableId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  estimatedTime: string;
}

export type OutletType = 'Restaurant' | 'Fastfood' | 'Roomservice' | 'Restdirect';

export interface TableInfo {
  tableId: string;
  tableNumber: string;
  restaurantId: string;
  outletType: OutletType;
  restaurantName: string;
  currency: string;
}

export interface PaymentInfo {
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  method: string;
  transactionId: string;
  processedAt: string;
}

// Order Submission API Types
export interface OrderSubmitFoodItem {
  id: number;
  Food: string;
  code: string;
  Price: number;
  Qty: number;
  Comment: string;
  Category: number;
  OrigQty: number;
}

export interface OrderSubmitRequest {
  UserCode: number;
  Table: string;
  SubTable: string;
  Outlet: number;
  OutletName: string;
  Waiter: number;
  WaiterName: string;
  Pax: number;
  Food: OrderSubmitFoodItem[];
  Total: number;
  TotQty: number;
  Branch: string;
  Type: string;
  NCCode: number;
  NCRemarks: string;
  Discount: number;
  DiscountType: string;
  DiscountRemarks: string;
  VRemarks: string;
  Mode: string;
  SubBillType: string;
  Plan: string;
  GuestName: string;
  GuestCode: string;
  CheckInNo: string;
  KotMobileNo: string;
}

export interface OrderSubmitResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string;
}

// Steward/Waiter API Types
export interface Steward {
  StewardCode: number;
  StewardName: string;
  MobNo: string;
}

export interface RoomServiceDetails {
  CheckInNo: string;
  GuestCode: string;
  GuestName: string;
  Mobile: string;
}
