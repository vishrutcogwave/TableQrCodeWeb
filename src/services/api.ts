import { API_CONFIG, DEFAULT_IMAGE } from '@/config/api';
import { ApiCategory, ApiMenuItem, MenuCategory, MenuItem, OrderSubmitRequest, OrderSubmitResponse, CartItem, TableInfo, Steward, OutletType, RoomServiceDetails } from '@/types';
import { QRCodeParams } from '@/utils/urlParser';

// Payment related types
export interface TaxListItem {
  TaxName: string;
  Taxper: number;
  TaxableAmount: number;
  TaxAmount: number;
}

export interface BillDetails {
  TotalAmount: number;
  TotalQty: number;
  CGSTPer?: number; // Deprecated - use TaxList instead
  CGSTAmt?: number; // Deprecated - use TaxList instead
  SGSTPer?: number; // Deprecated - use TaxList instead
  SGSTAmt?: number; // Deprecated - use TaxList instead
  ServiceChargePer: number;
  ServiceCharge: number;
  GrandTotal: number;
  DiscountPer: number;
  Discount: number;
  DiscountRemarks: string | null;
  RoundOff: number;
  TaxList: TaxListItem[];
}

export interface GetBillRequest {
  UserCode: number;
  Table: string;
  SubTable: string;
  Outlet: number;
  OutletName: string;
  Waiter: number;
  WaiterName: string;
  Pax: number;
  Food: Array<{
    Id: number;
    Food: string;
    code: string;
    Price: number;
    Qty: number;
    Comment: string;
    Category: number;
    OrigQty: number;
  }>;
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

export interface PaymentInitiateRequest {
  Amount: number;
  RedirectUrl: string;
}

export interface PaymentInitiateResponse {
  paymentUrl: string;
  merchantOrderID: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  state: string; // e.g., PENDING, COMPLETED, FAILED
  amount: number; // in paise
  expireAt?: number;
  metaInfo?: Record<string, string>;
  paymentDetails?: Array<{
    paymentMode: string;
    transactionId: string;
    timestamp: number;
    amount: number; // in paise
    state: string;
  }>;
}

export class ApiService {
  private static baseUrl = API_CONFIG.baseUrl;

  static checkIfImageExistsByLoading(imageUrl: string): Promise<boolean> {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = imageUrl;
      });
  }

  static async fetchCategories(): Promise<ApiCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.categories}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const categories = await response.json();

      for (let i = 0; i < categories.length; i++) {
        
        if(categories[i].thumb == null) {
          // Use relative path for local images, full URL for external images
          let filename = '/images/food/category/' + categories[i].Category.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '') + '.jpg';
          categories[i].thumb = filename;
          //console.log("Category image:", categories[i].thumb);
        }
        else {
          // If thumb already has a full URL, keep it; otherwise prepend baseUrl
          if (!categories[i].thumb.startsWith('http')) {
            categories[i].thumb = this.baseUrl + categories[i].thumb;
          }
          //console.log("Original category image:", categories[i].thumb);
        }
      }

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async fetchItemsByCategory(category: ApiCategory): Promise<ApiMenuItem[]> {
    try {
      let categoryId = category.CategoryId;

      const response = await fetch(
        `${this.baseUrl}${API_CONFIG.endpoints.items}?outlet=1&category=${categoryId}&filter=0`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      //console.log(data.foodmodellist.length);
      for (let i = 0; i < data.foodmodellist.length; i++) {
        
        if(data.foodmodellist[i].thumb == null) {
          // Use relative path for local images, full URL for external images
          let filename = '/images/food/items/' + data.foodmodellist[i].ItemName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '') + '.jpg';
          data.foodmodellist[i].thumb = filename;
          //console.log("Item image:", data.foodmodellist[i].thumb);
        }
        else {
          // If thumb already has a full URL, keep it; otherwise prepend baseUrl
          if (!data.foodmodellist[i].thumb.startsWith('http')) {
            data.foodmodellist[i].thumb = this.baseUrl + data.foodmodellist[i].thumb;
          }
        }
      }
      return data.foodmodellist || [];
    } catch (error) {
      console.error(`Error fetching items for category ${category.CategoryId}:`, error);
      throw error;
    }
    return [];
  }

  static async fetchMenu(): Promise<MenuCategory[]> {
    try {

      console.log("Base URL:", this.baseUrl);
      console.log("Environment Base URL:", process.env.HOTEL360_PUBLIC_API_BASE_URL);
      // Fetch categories first
      const categories = await this.fetchCategories();

      // Fetch items for each category
      const menuCategories: MenuCategory[] = await Promise.all(
        categories.map(async (category) => {
          const items = await this.fetchItemsByCategory(category);

          // TODO: for testing, remove this
          for (let i = 0; i < items.length; i++) {
            items[i].Qty = 5;
            items[i].Avaliable = true;
          }

          return {
            id: category.CategoryId.toString(),
            name: category.Category,
            image: category.thumb || DEFAULT_IMAGE,
            items: items.map(this.transformMenuItem)
          };
        })
      );

      return menuCategories;
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }

  private static transformMenuItem(apiItem: ApiMenuItem): MenuItem {
    return {
      id: apiItem.ItemCode.toString(),
      name: apiItem.ItemName,
      description: apiItem.description || '',
      price: apiItem.CurrentPrize || apiItem.ItemRate,
      isAvailable: apiItem.Avaliable, // Use 'Avaliable' field from API to determine availability (ignore 'Qty')
      category: apiItem.CatCode.toString(),
      subCategory: '', // Not available in API response
      isVegan: apiItem.IsVeg,
      isVegetarian: apiItem.IsVeg, // Assuming IsVeg covers both vegetarian and vegan
      isNonVegetarian: !apiItem.IsVeg,
      isEggBased: false, // Not available in API response
      image: apiItem.thumb || DEFAULT_IMAGE
    };
  }

  private static async fetchStewardName(stewardId: number): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.getStewards}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const stewards = await response.json();

      const steward = stewards.find((steward: Steward) => steward.StewardCode === stewardId);
      return steward ? steward.StewardName : 'Unknown Waiter';
    } catch (error) {
      console.error('Error fetching Stewards:', error);
      return 'Unknown Waiter'; // Fallback instead of throwing error
    }
  }

  static async fetchMenuListByOlt(oltCode: string): Promise<ApiMenuItem[]> {
    try {
      const params = new URLSearchParams({ oltCode });
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.getMenuListByOlt}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const items: ApiMenuItem[] = Array.isArray(data) ? data : (data?.foodmodellist || []);

      // Normalize thumbs like other endpoints
      for (let i = 0; i < items.length; i++) {
        if (items[i].thumb == null) {
          let filename = '/images/food/items/' + items[i].ItemName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '') + '.jpg';
          (items[i] as any).thumb = filename;
        } else if (!String(items[i].thumb).startsWith('http')) {
          (items[i] as any).thumb = this.baseUrl + items[i].thumb;
        }
      }

      return items;
    } catch (error) {
      console.error('Error fetching menu list by OLT:', error);
      return [];
    }
  }

  private static async fetchBranchCode(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.getBranch}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const branches = await response.json();

      // Get the first branch's Branch_Code
      if (Array.isArray(branches) && branches.length > 0) {
        return branches[0].Branch_Code; 
      }
      return ''; // Fallback if no branches found
    } catch (error) {
      console.error('Error fetching Branch:', error);
      return ''; // Fallback instead of throwing error
    }
  }

  // Public wrapper to fetch Branch code for use outside this service
  static async getBranchCode(): Promise<string> {
    return await this.fetchBranchCode();
  }

  static async getOldCart(tableInfo: TableInfo): Promise<any> {
    try {
      // Build query parameters for GET request using correct parameter names
      const params = new URLSearchParams({
        tableno: tableInfo.tableNumber,
        outlet: (parseInt(tableInfo.restaurantId || '1') || 1).toString(),
        subtable: 'A' // Default subtable, can be made configurable
      });
      
      const url = `${this.baseUrl}${API_CONFIG.endpoints.getOldCart}?${params}`;
      console.log("Get Old Cart URL:", url);
      console.log("Table Info:", tableInfo);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add CORS and other fetch options
        mode: 'cors',
        credentials: 'omit'
      });

      console.log("Get Old Cart Response Status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Get Old Cart Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log("Get Old Cart Response:", result);
      return result;
    } catch (error) {
      console.error('Error fetching old cart:', error);
      // Return empty result instead of throwing to prevent loops
      return { Food: [] };
    }
  }

  static async getOutletType(outletCode: string): Promise<OutletType> {
    try {
      const params = new URLSearchParams({
        oltcode: outletCode
      });
      
      const url = `${this.baseUrl}${API_CONFIG.endpoints.getOutletType}?${params}`;
      console.log("Get Outlet Type URL:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });

      console.log("Get Outlet Type Response Status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Get Outlet Type Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log("Get Outlet Type Response:", result);
      
      // Validate the response has OutletType field
      if (!result.OutletType) {
        throw new Error('Invalid response: OutletType field missing');
      }
      
      // Validate the outlet type is one of the expected values
      const validOutletTypes: OutletType[] = ['Restaurant', 'Fastfood', 'Roomservice', 'Restdirect'];
      if (!validOutletTypes.includes(result.OutletType)) {
        throw new Error(`Invalid outlet type: ${result.OutletType}`);
      }
      
      return result.OutletType as OutletType;
    } catch (error) {
      console.error('Error fetching outlet type:', error);
      throw error; // Re-throw to allow calling code to handle
    }
  }

  static async submitOrder(
    cartItems: CartItem[], 
    tableInfo: TableInfo, 
    guestName: string, 
    mobileNumber: string,
    qrParams?: QRCodeParams
  ): Promise<OrderSubmitResponse> {
    try {
      // Calculate totals
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      // Transform cart items to API format
      const foodItems = cartItems.map((item, index) => ({
        Id: parseInt(item.id), // ItemId from the menu item
        Food: item.name,
        code: '0', // Always '0' during submission (string)
        Price: item.price,
        Qty: item.quantity,
        Comment: item.instructions || '',
        Category: parseInt(item.category),
        OrigQty: item.quantity
      }));

      const StewardId = parseInt(qrParams?.stewardNo || '1') || 1; // Default to 1 if not provided
      const StewardName = await this.fetchStewardName(StewardId);
      const BranchCode = await this.fetchBranchCode();

      console.log("Steward Id:", StewardId);
      console.log("Steward Name:", StewardName);
      console.log("Branch Code:", BranchCode);

      console.log ("QR Params:", qrParams);

      // Build order request
      const orderRequest: any = {
        UserCode: 1,
        Table: tableInfo.tableNumber,
        SubTable: 'A',
        Outlet: parseInt(qrParams?.orgOltCode || '1') || 1,
        OutletName: qrParams?.orgOltName || 'Restaurant',
        Waiter: parseInt(StewardId.toString()),
        WaiterName: StewardName,
        Pax: 2, // default 2
        Food: foodItems,
        Total: totalAmount,
        TotQty: totalQuantity,
        Branch: BranchCode, // Dynamically fetched from getbranch API
        Type: 'K', // Default K
        NCCode: 0, // Default 0
        NCRemarks: '', // Default ""
        Discount: 0, // Default 0
        DiscountType: '', // Default ""
        DiscountRemarks: '', // Default ""
        VRemarks: '0', // Default "0"
        Mode: 'ADD', 
        SubBillType: 'C', // Default C
        Plan: '', // Default ""
        GuestName: guestName,
        GuestCode: '', // Default ""
        CheckInNo: qrParams?.checkinno || '',
        KotMobileNo: mobileNumber
      };

      console.log("Submit Order Request:", orderRequest);
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.submitOrder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log("Submit Order Response:", result);

      return {
        success: true,
        orderId: result.orderId || `ORDER_${Date.now()}`,
        message: 'Order submitted successfully'
      };

    } catch (error) {
      console.error('Error submitting order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit order'
      };
    }
  }

  // Payment related methods
  static async getBill(cartItems: CartItem[], tableInfo: TableInfo, qrParams?: QRCodeParams, guestName?: string, mobileNumber?: string): Promise<BillDetails> {
    debugger
    try {
      console.log("Get Bill Cart Items:", cartItems);
      // Get steward and branch info (same as order submission)
      const StewardId = parseInt(qrParams?.stewardNo || '1') || 1;
      const StewardName = await this.fetchStewardName(StewardId);
      const BranchCode = await this.fetchBranchCode();

      console.log("Table Numeber ", tableInfo.tableNumber);
      // Build bill request (similar to order submission)
      const billRequest: GetBillRequest = {
        UserCode: 0,
        Table: tableInfo.tableNumber,
        SubTable: 'A',
        Outlet: parseInt(qrParams?.orgOltCode || '0'),
        OutletName: qrParams?.orgOltName || 'Restaurant',
        Waiter: StewardId,
        WaiterName: StewardName,
        Pax: 1,
        Food: cartItems.map(item => ({
          Id: parseInt(item.id),
          Food: item.name,
          code: '0',
          Price: item.price,
          Qty: item.quantity,
          Comment: item.instructions || '',
          Category: parseInt(item.category),
          OrigQty: item.quantity
        })),
        Total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        TotQty: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        Branch: BranchCode,
        Type: 'K',
        NCCode: 0,
        NCRemarks: '',
        Discount: 0,
        DiscountType: '',
        DiscountRemarks: '',
        VRemarks: '',
        Mode: '',
        SubBillType: 'C',
        Plan: '',
        GuestName: guestName || 'Guest',
        GuestCode: '',
        CheckInNo: '',
        KotMobileNo: mobileNumber || ''
      };

      console.log("Bill Request:", billRequest);
      const response = await fetch(`${this.baseUrl}/api/kot/KotGetBill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billRequest),
        mode: 'cors',
        credentials: 'omit'
      });

      console.log("Get Bill Response:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const billDetails: BillDetails = await response.json();
      return billDetails;
    } catch (error) {
      console.error('Error getting bill:', error);
      throw error;
    }
  }

  static async initiatePayment(amount: number, redirectUrl: string): Promise<PaymentInitiateResponse> {
    try {
      // Check if mock payment is enabled
      if (process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true') {
        console.log("Mock Payment: Initiating payment for amount:", amount);
        
        // Generate a mock merchant order ID
        const mockMerchantOrderID = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Return mock response immediately
        const mockResponse: PaymentInitiateResponse = {
          paymentUrl: redirectUrl, // Use the redirect URL as the payment URL for mock
          merchantOrderID: mockMerchantOrderID
        };
        
        console.log("Mock Payment Response:", mockResponse);
        return mockResponse;
      }

      // Real payment gateway flow
      console.log ("In initiatePayment");
      console.log ("Amount:", amount);
      console.log ("Redirect URL:", redirectUrl);
 
      // Amount to be sent in paise
      const amountPaise = Math.round(amount * 100);
      const params = new URLSearchParams({ Amount: String(amountPaise) });
      // PG expects RedirectUrl parameter
      params.append('RedirectUrl', redirectUrl);

      // Use the same baseUrl as other APIs
      const url = `${this.baseUrl}${API_CONFIG.endpoints.pgCreatePayment}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log("Initiate Payment Response:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log("Initiate Payment Response:", response);

      const raw = await response.json();

      // Normalize possible response shapes based on sample
      // {
      //   orderId: string,
      //   state: 'PENDING' | string,
      //   expireAt: number,
      //   redirectUrl: string,
      //   merchantOrderId: string
      // }
      const paymentResponse: PaymentInitiateResponse = {
        paymentUrl: raw.redirectUrl || raw.paymentUrl || raw.PaymentUrl || raw.url || '',
        merchantOrderID: raw.merchantOrderId || raw.merchantOrderID || raw.MerchantOrderID || raw.orderId || ''
      };

      console.log("Payment Response:", raw);
      return paymentResponse;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  }

  static async getPaymentStatus(merchantOrderId: string, amount?: number, currency?: string): Promise<PaymentStatusResponse> {
    try {
      // Check if mock payment is enabled
      if (process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true') {
        console.log("Mock Payment: Getting payment status for:", merchantOrderId);
        
        // Show mock payment dialog
        const result = await this.showMockPaymentDialog(amount || 0, currency || 'INR');
        
        // Return mock response based on user choice
        const mockResponse: PaymentStatusResponse = {
          orderId: merchantOrderId,
          state: result,
          amount: amount ? Math.round(amount * 100) : 0, // Convert to paise
          paymentDetails: result === 'COMPLETED' ? [{
            paymentMode: 'CARD',
            transactionId: `TXN_${Date.now()}`,
            timestamp: Date.now(),
            amount: amount ? Math.round(amount * 100) : 0,
            state: 'SUCCESS'
          }] : []
        };
        
        console.log("Mock Payment Status Response:", mockResponse);
        return mockResponse;
      }

      // Real payment gateway flow
      const params = new URLSearchParams({ MerchantorderID: merchantOrderId });
      const url = `${this.baseUrl}${API_CONFIG.endpoints.pgPaymentStatus}?${params.toString()}`;
      console.log("Payment Status URL:", url);
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const raw = await response.json();
      return raw as PaymentStatusResponse;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }

  // Helper method to show mock payment dialog
  private static async showMockPaymentDialog(amount: number, currency: string): Promise<'COMPLETED' | 'FAILED'> {
    return new Promise((resolve) => {
      // Create a simple confirmation dialog
      const result = confirm(
        `Mock Payment Dialog\n\nAmount: ${amount} ${currency}\n\nClick OK for Success, Cancel for Fail`
      );
      
      resolve(result ? 'COMPLETED' : 'FAILED');
    });
  }

  static async pollPaymentStatus(merchantOrderId: string, totalMs: number = 180000, intervalMs: number = 30000, signal?: AbortSignal): Promise<PaymentStatusResponse> {
    // Check if mock payment is enabled
    if (process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true') {
      console.log("Mock Payment: Polling payment status for:", merchantOrderId);
      // In mock mode, return the status immediately (no polling needed)
      return { orderId: merchantOrderId, state: 'PENDING', amount: 0 } as PaymentStatusResponse;
    }

    // Real payment gateway polling
    const start = Date.now();
    let last: PaymentStatusResponse | null = null;
    while (Date.now() - start < totalMs) {
      if (signal?.aborted) throw new Error('Polling aborted');
      // Use PGGetPaymentStatus for subsequent polls
      const params = new URLSearchParams({ MerchantorderID: merchantOrderId });
      const url = `${this.baseUrl}${API_CONFIG.endpoints.pgGetPaymentStatus}?${params.toString()}`;
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const parsed = (await resp.json()) as PaymentStatusResponse | null;
      if (parsed) {
        last = parsed;
        if (last.state && last.state !== 'PENDING') return last as PaymentStatusResponse;
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    // Timeout; return last known or PENDING
    if (last) return last;
    return { orderId: merchantOrderId, state: 'PENDING', amount: 0 } as PaymentStatusResponse;
  }

  static async postBill(cart: OrderSubmitRequest, tax: BillDetails, billingType: string, subBillingType: string, paymentStatus: PaymentStatusResponse, merchantOrderID?: string): Promise<boolean> {
    try {
      console.log("Inside postBill");
      // Construct paymentresponse from PG status
      const firstDetail = paymentStatus.paymentDetails && paymentStatus.paymentDetails[0];
      const paymentresponse = {
        success: paymentStatus.state === 'COMPLETED',
        code: paymentStatus.state,
        message: paymentStatus.state,
        data: {
          transactionId: firstDetail?.transactionId || '',
          amount: (firstDetail?.amount ?? paymentStatus.amount ?? 0) / 100,
          merchantId: merchantOrderID || '',
          providerReferenceId: paymentStatus.orderId || '',
          qrString: ''
        }
      };

      const payload = {
        Cart: cart,
        Tax: tax,
        BillingType: billingType,
        SubBillingType: subBillingType,
        paymentresponse
      };

      console.log("Payload:", payload);
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.postBill}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = (await response.text()).trim().toLowerCase();
      console.log("Post Bill Response:", text);
      return text === 'true';
    } catch (error) {
      console.error('Error posting bill:', error);
      throw error;
    }
  }

  static async submitOrderfastfoodbill(cart: OrderSubmitRequest, tax: BillDetails, billingType: string, subBillingType: string, paymentStatus: PaymentStatusResponse, merchantOrderID?: string): Promise<boolean> {
    try {
      console.log("Inside submitOrderfastfoodbill");
      // Construct paymentresponse from PG status
      const firstDetail = paymentStatus.paymentDetails && paymentStatus.paymentDetails[0];
      const paymentresponse = {
        success: paymentStatus.state === 'COMPLETED',
        code: paymentStatus.state,
        message: paymentStatus.state,
        data: {
          transactionId: firstDetail?.transactionId || '',
          amount: (firstDetail?.amount ?? paymentStatus.amount ?? 0) / 100,
          merchantId: merchantOrderID || '',
          providerReferenceId: paymentStatus.orderId || '',
          qrString: ''
        }
      };

      const payload = {
        Cart: cart,
        Tax: tax,
        BillingType: billingType,
        SubBillingType: subBillingType,
        paymentresponse
      };

      console.log("Payload:", payload);
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.submitOrderfastfoodbill}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Submit Order Fastfood Bill Response:", data);
      return data.success === true;
    } catch (error) {
      console.error('Error submitting fastfood bill:', error);
      throw error;
    }
  }

  static async getRoomServiceDetails(roomNo: string): Promise<RoomServiceDetails> {
    try {
      console.log("Fetching room service details for room:", roomNo);
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.getRoomServiceDetails}?roomno=${roomNo}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Room Service Details Response:", data);
      return data;
    } catch (error) {
      console.error('Error fetching room service details:', error);
      throw error;
    }
  }

  static async getCompanyInfoBill(): Promise<any> {
    try {
      console.log("Fetching company info for bill");
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.getCompanyInfoBill}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Company Info Response:", data);
      return data;
    } catch (error) {
      console.error('Error fetching company info:', error);
      throw error;
    }
  }

  static async getBillNoByOrderId(merchantOrderId: string): Promise<any> {
    try {
      // Check if we're in local/development environment
      const isLocal = process.env.NODE_ENV === 'development' || 
                      (typeof window !== 'undefined' && window.location.hostname === 'localhost');

      if (isLocal) {
        console.log("Mock: Fetching bill details by order ID (local environment):", merchantOrderId);
        
        // Mock response structure
        const mockResponse = {
          Cart: {
            UserCode: 1,
            Table: "4",
            SubTable: "A",
            Outlet: 1,
            OutletName: "BAR & RESTAURANT",
            Waiter: 1,
            WaiterName: "Waiter",
            Pax: 1,
            Food: [
              {
                Id: 10,
                Food: "EGG CHEESE",
                code: "0",
                Price: 50,
                Qty: 1,
                Comment: "",
                Category: 0,
                OrigQty: 1
              },
              {
                Id: 402,
                Food: "BUFFET BREAKFAST",
                code: "0",
                Price: 238,
                Qty: 1,
                Comment: "",
                Category: 0,
                OrigQty: 1
              }
            ],
            Total: 288,
            TotQty: 2,
            Branch: "DEROY",
            Type: "K",
            NCCode: 0,
            NCRemarks: "",
            Discount: 0,
            DiscountType: "",
            DiscountRemarks: "",
            VRemarks: "0",
            Mode: "ADD",
            SubBillType: "C",
            Plan: "",
            GuestName: "Kasi",
            GuestCode: "",
            CheckInNo: "0",
            KotMobileNo: "8072169648",
            HomeDelivary: null
          },
          Tax: {
            TotalAmount: 288,
            TotalQty: 2,
            CGSTPer: 2.5,
            CGSTAmt: 7.2,
            SGSTPer: 2.5,
            SGSTAmt: 7.2,
            ServiceChargePer: 0,
            ServiceCharge: 0,
            GrandTotal: 302,
            DiscountPer: 0,
            Discount: 0,
            DiscountRemarks: null,
            RoundOff: -0.4,
            TaxList: [
              {
                TaxName: "SGST 2.5%",
                Taxper: 2.5,
                TaxableAmount: 288,
                TaxAmount: 7.2
              },
              {
                TaxName: "CGST 2.5%",
                Taxper: 2.5,
                TaxableAmount: 288,
                TaxAmount: 7.2
              }
            ]
          },
          BillingType: "ADD",
          SubBillingType: "C",
          paymentresponse: {
            success: true,
            code: "COMPLETED",
            message: "COMPLETED",
            data: {
              transactionId: "OM25111216043263",
              amount: 302,
              merchantId: merchantOrderId,
              providerReferenceId: "OM25111216043263",
              qrString: ""
            }
          },
          billdetails: {
            Billno: "3",
            BillDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            BillTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
            OutletName: "BAR & RESTAURANT",
            TokenNo: null,
            OrderId: merchantOrderId // Replace with the passed OrderId
          }
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("Mock: Bill No By Order ID Response:", mockResponse);
        return mockResponse;
      }

      // Production: Call actual API
      console.log("Fetching bill details by order ID:", merchantOrderId);
      const params = new URLSearchParams({ OrderId: merchantOrderId });
      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.getBillNoByOrderId}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Bill No By Order ID Response:", data);
      return data;
    } catch (error) {
      console.error('Error fetching bill details by order ID:', error);
      throw error;
    }
  }
}
