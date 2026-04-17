'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { CartItem, Order, OutletType } from '@/types';
import { ArrowLeft, Clock, CheckCircle, XCircle, ChefHat, Receipt, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { toTitleCase } from '@/utils/textFormatting';
import BottomNav from '@/components/BottomNav';
import BillConfirmationOverlay from '@/components/BillConfirmationOverlay';
import { ApiService, BillDetails } from '@/services/api';
import { API_CONFIG } from '@/config/api';
import { getTerminology, showOrdersPage, getPaymentFlow } from '@/utils/outletHelpers';

export default function OrdersPage() {
  const { state, dispatch, loadExistingOrders } = useApp();
  const router = useRouter();
  const [hasLoadedOrders, setHasLoadedOrders] = useState(false);
  
  // Payment related state
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isBillOverlayOpen, setIsBillOverlayOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  console.log("Orders Page");
  console.log(state);
  console.log(state.tableInfo);

  const pathname = usePathname();
  // Effect 1: Ensure tableInfo exists (restore from sessionStorage if needed)
  useEffect(() => {
    if (state.tableInfo) return;

    const qrParamsRaw = sessionStorage.getItem('qrParams');
    if (qrParamsRaw) {
      try {
        const qrParams = JSON.parse(qrParamsRaw);
        
        // Restore outlet type from sessionStorage if not in context
        let outletType = state.outletType;
        if (!outletType) {
          const outletTypeRaw = sessionStorage.getItem('outletType');
          if (outletTypeRaw) {
            outletType = outletTypeRaw as OutletType;
            dispatch({ type: 'SET_OUTLET_TYPE', payload: outletType });
          } else {
            console.error('No outlet type found in sessionStorage');
            router.push('/');
            return;
          }
        }
        
        // Check if this outlet type should show orders page
        if (!showOrdersPage(outletType)) {
          // Roomservice users should not access orders page
          router.push('/menu');
          return;
        }
        
        const tableInfoFromQR = {
          tableId: `T${qrParams.tableNumber || '1'}`,
          tableNumber: `${qrParams.tableNumber || '1'}`,
          restaurantId: qrParams.orgOltCode || '1',
          restaurantName: qrParams.orgOltName || 'Restaurant',
          currency: 'INR',
          outletType: outletType
        };
        dispatch({ type: 'SET_TABLE_INFO', payload: tableInfoFromQR });
      } catch (error) {
        console.error('Error restoring tableInfo from QR params:', error);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [state.tableInfo, state.outletType, dispatch, router]);

  // Effect 2: Load existing orders only after tableInfo is available
  useEffect(() => {
    if (!state.tableInfo) return;
    if (hasLoadedOrders) return;
    loadExistingOrders();
    setHasLoadedOrders(true);
  }, [state.tableInfo, hasLoadedOrders, loadExistingOrders]);

  // Fetch company info for logo
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const companyData = await ApiService.getCompanyInfoBill();
        console.log('Company info fetched (Orders):', companyData);
        setCompanyInfo(companyData);
      } catch (error) {
        console.error('Error fetching company info:', error);
        // Silently fail - logo is optional
      }
    };
    fetchCompanyInfo();
  }, []);

  // Fetch bill summary (CGST/SGST/etc) after orders load - only for Restaurant
  useEffect(() => {
    const fetchBillSummary = async () => {
      try {
        if (!state.tableInfo || state.outletType !== 'Restaurant') return;

        const qrParamsRaw = sessionStorage.getItem('qrParams');
        const qrParams = qrParamsRaw ? JSON.parse(qrParamsRaw) : null;

        // Get old cart to build items for getBill
        const oldCart = await ApiService.getOldCart(state.tableInfo!);
        const cartItems: CartItem[] = Array.isArray(oldCart?.Food) ? oldCart.Food.map((foodItem: any) => ({
          id: (foodItem.Id ?? foodItem.id ?? foodItem.code ?? foodItem.Code ?? '').toString(),
          name: (foodItem.Food ?? foodItem.food ?? foodItem.name ?? 'Unknown Item'),
          price: (foodItem.Price ?? foodItem.price ?? foodItem.Rate ?? 0),
          quantity: (foodItem.Qty ?? foodItem.qty ?? foodItem.quantity ?? 1),
          instructions: (foodItem.Comment ?? foodItem.comment ?? foodItem.instructions ?? ''),
          category: (foodItem.Category ?? foodItem.category ?? '').toString(),
          isVegan: false,
          isVegetarian: false,
          isNonVegetarian: true,
          isEggBased: false
        })) : [];

        const guestName = oldCart?.GuestName || sessionStorage.getItem('guestName') || 'Guest';
        const mobileNumber = oldCart?.KotMobileNo || sessionStorage.getItem('mobileNumber') || '';

        // Get bill details
        const bill = await ApiService.getBill(cartItems, state.tableInfo!, qrParams, guestName, mobileNumber);
        setBillDetails(bill);

        // Persist for callback
        sessionStorage.setItem('lastBillDetails', JSON.stringify(bill));

        // Also persist Cart for postbill if not already stored
        try {
          const qr = qrParams || JSON.parse(sessionStorage.getItem('qrParams') || '{}');
          const branch = await ApiService.getBranchCode();
          const cartForPostBill = {
            UserCode: 1,
            Table: state.tableInfo?.tableNumber || 'Table 1',
            SubTable: 'A',
            Outlet: parseInt(qr?.orgOltCode || '1') || 1,
            OutletName: qr?.orgOltName || 'Restaurant',
            Waiter: 1,
            WaiterName: 'Waiter',
            Pax: 1,
            Food: cartItems.map(i => ({
              Id: parseInt(i.id), Food: i.name, code: '0', Price: i.price, Qty: i.quantity, Comment: i.instructions || '', Category: parseInt(i.category), OrigQty: i.quantity
            })),
            Total: cartItems.reduce((s,i)=>s+i.price*i.quantity,0),
            TotQty: cartItems.reduce((s,i)=>s+i.quantity,0),
            Branch: branch,
            Type: 'K', NCCode: 0, NCRemarks: '', Discount: 0, DiscountType: '', DiscountRemarks: '', VRemarks: '0', Mode: 'ADD', SubBillType: 'C', Plan: '',
            GuestName: guestName,
            GuestCode: '',
            CheckInNo: qr?.checkinno || '',
            KotMobileNo: mobileNumber
          };
          sessionStorage.setItem('lastOrderRequest', JSON.stringify(cartForPostBill));
        } catch {}

      } catch (e) {
        console.error('Error fetching bill summary:', e);
      }
    };
    fetchBillSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tableInfo, state.outletType, state.orders.length]);

  // Use orders directly from context instead of fetching from API
  const orders = state.orders;
  const outletType = state.outletType;
  const paymentFlow = outletType ? getPaymentFlow(outletType) : 'cumulative';
  const isImmediate = paymentFlow === 'immediate';
  const latestOrder = isImmediate && orders.length > 0 ? [orders[orders.length - 1]] : orders;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'preparing':
        return <ChefHat className="w-4 h-4" style={{ color: '#0476b1' }} />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'text-white';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Order Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };


  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Payment functions
  const handlePayBill = async () => {
    try {
      setIsPaymentLoading(true);
      setPaymentError(null);

      // Get QR params from session storage
      const qrParamsRaw = sessionStorage.getItem('qrParams');
      const qrParams = qrParamsRaw ? JSON.parse(qrParamsRaw) : null;

      // Call getoldcart to get the old cart items
      console.log("Table number", state.tableInfo?.tableNumber);
      const oldCart = await ApiService.getOldCart(state.tableInfo!);
      
      const cartItems: CartItem[] = [];

      console.log("Old Cart:", oldCart.Food);
      // Process the old cart items
      oldCart.Food.forEach((foodItem: any) => {
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
        cartItems.push(cartItem);
      });
      
      console.log("Old Cart:", oldCart);
      const guestName = oldCart.GuestName;
      const mobileNumber = oldCart.KotMobileNo;

      // Persist Cart (OrderSubmitRequest) for postbill callback using the same items from old cart
      try {
        const qr = qrParams || JSON.parse(sessionStorage.getItem('qrParams') || '{}');
        const branch = await ApiService.getBranchCode();
        const cartForPostBill = {
          UserCode: 1,
          Table: state.tableInfo?.tableNumber || 'Table 1',
          SubTable: 'A',
          Outlet: parseInt(qr?.orgOltCode || '1') || 1,
          OutletName: qr?.orgOltName || 'Restaurant',
          Waiter: 1,
          WaiterName: 'Waiter',
          Pax: 1,
          Food: cartItems.map(i => ({
            Id: parseInt(i.id), Food: i.name, code: '0', Price: i.price, Qty: i.quantity, Comment: i.instructions || '', Category: parseInt(i.category), OrigQty: i.quantity
          })),
          Total: cartItems.reduce((s,i)=>s+i.price*i.quantity,0),
          TotQty: cartItems.reduce((s,i)=>s+i.quantity,0),
          Branch: branch,
          Type: 'K', NCCode: 0, NCRemarks: '', Discount: 0, DiscountType: '', DiscountRemarks: '', VRemarks: '0', Mode: 'ADD', SubBillType: 'C', Plan: '',
          GuestName: guestName || (sessionStorage.getItem('guestName') || 'Guest'),
          GuestCode: '',
          CheckInNo: qr?.checkinno || '',
          KotMobileNo: mobileNumber || (sessionStorage.getItem('mobileNumber') || '')
        };
        sessionStorage.setItem('lastOrderRequest', JSON.stringify(cartForPostBill));
      } catch {}

      // Get bill details
      console.log("Calling get bill");
      const bill = await ApiService.getBill(cartItems, state.tableInfo!, qrParams, guestName, mobileNumber);
      setBillDetails(bill);
    } catch (error) {
      console.error('Error getting bill:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to get bill details');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!billDetails) return;

    try {
      setIsPaymentLoading(true);

      // Initiate payment
      console.log("Grand Total:", billDetails.GrandTotal);
      // Persist bill context for callback page
      try {
        // Save last order request (Cart) and bill details (Tax) for postbill
        const lastOrderRequest = sessionStorage.getItem('lastOrderRequest');
        if (!lastOrderRequest) {
          // Build a minimal fallback from current state if not present
          const qr = JSON.parse(sessionStorage.getItem('qrParams')||'{}');
          const branch = await ApiService.getBranchCode();
          const fallbackOrder = {
            UserCode: 1,
            Table: state.tableInfo?.tableNumber || 'Table 1',
            SubTable: 'A',
            Outlet: parseInt(qr?.orgOltCode || '1') || 1,
            OutletName: qr?.orgOltName || 'Restaurant',
            Waiter: 1,
            WaiterName: 'Waiter',
            Pax: 1,
            Food: state.cart.map(i => ({
              Id: parseInt(i.id), Food: i.name, code: '0', Price: i.price, Qty: i.quantity, Comment: i.instructions || '', Category: parseInt(i.category), OrigQty: i.quantity
            })),
            Total: state.cart.reduce((s,i)=>s+i.price*i.quantity,0),
            TotQty: state.cart.reduce((s,i)=>s+i.quantity,0),
            Branch: branch,
            Type: 'K', NCCode: 0, NCRemarks: '', Discount: 0, DiscountType: '', DiscountRemarks: '', VRemarks: '0', Mode: 'ADD', SubBillType: 'C', Plan: '',
            GuestName: sessionStorage.getItem('guestName') || 'Guest',
            GuestCode: '',
            CheckInNo: qr?.checkinno || '',
            KotMobileNo: sessionStorage.getItem('mobileNumber') || ''
          };
          sessionStorage.setItem('lastOrderRequest', JSON.stringify(fallbackOrder));
        }
        sessionStorage.setItem('lastBillDetails', JSON.stringify(billDetails));
      } catch (error) {
        console.error('Error saving last bill details:', error);
      }

      // Get redirect URL 
      const redirectUrl = `${window.location.origin}/payment/callback`;
      //const redirectUrl = 'https://www.cogwave.in';
      // Initiate payment
      const paymentResponse = await ApiService.initiatePayment(billDetails.GrandTotal, redirectUrl);
      
      // Check if payment URL is available
      if (!paymentResponse.paymentUrl) {
        setPaymentError('Unable to initiate Payment');
        return;
      }
      
      // Store merchant order ID in local storage
      localStorage.setItem('merchantOrderID', paymentResponse.merchantOrderID);

      // Redirect to payment gateway
      window.location.href = paymentResponse.paymentUrl;
    } catch (error) {
      console.error('Error initiating payment:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to initiate payment');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleCloseBillOverlay = () => {};

  const handleCloseError = () => {
    setPaymentError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 main-scroll">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-white/20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start" style={{ minWidth: '80px', width: '80px', height: '50px' }}>
              {companyInfo && companyInfo.Logo ? (
                <img
                  key={companyInfo.Logo}
                  src={companyInfo.Logo.includes('cogwave.in') 
                    ? `/api/logo?url=${encodeURIComponent(companyInfo.Logo)}`
                    : companyInfo.Logo}
                  alt="Restaurant Logo"
                  className="max-h-[50px] w-auto h-auto object-contain"
                  style={{ 
                    display: 'block', 
                    maxWidth: '80px',
                    maxHeight: '50px',
                    width: 'auto',
                    height: 'auto'
                  }}
                  onError={(e) => {
                    console.error('Logo image failed to load:', companyInfo.Logo);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Logo image loaded successfully (Orders):', companyInfo.Logo);
                  }}
                />
              ) : (
                <div style={{ width: '80px', height: '50px' }}></div>
              )}
            </div>
            
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold" style={{ color: '#0476b1' }}>Order Summary</h1>
              {outletType !== 'Fastfood' && (
                <p className="text-sm text-slate-600 font-medium">
                  {outletType && getTerminology(outletType)} {state.tableInfo?.tableNumber}
                </p>
              )}
            </div>

            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Summary Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <p className="text-sm text-slate-600 font-medium mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
            </div>
            <div className="text-center p-4 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #f0f7fc, #e8e8f0)' }}>
              <p className="text-sm text-slate-600 font-medium mb-1">
                {outletType === 'Restaurant' ? 'Total Amount*' : 'Grand Total'}
              </p>
              <p className="text-xl sm:text-2xl font-bold break-words px-1" style={{ color: '#0476b1', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                {formatCurrency((outletType === 'Restaurant' ? totalSpent : (billDetails?.GrandTotal ?? totalSpent)), state.tableInfo?.currency)}
              </p>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-xs text-slate-500">* Taxes Extra</p>
          </div>
        </div>

        {/* Orders List */}
        {latestOrder.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <IndianRupee className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">No orders yet</h3>
            <p className="text-slate-600 mb-8">Start by adding items to your cart from the menu</p>
            <button
              onClick={() => router.push('/menu')}
              className="text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#0476b1' }}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {latestOrder.map((order) => (
              <div key={order.orderId} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-5 hover:shadow-xl transition-all duration-300">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex-shrink-0">
                    <h3 className="font-bold text-slate-900 text-lg">Order #{order.orderId}</h3>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-0">
                    <p className="text-lg sm:text-xl font-bold mt-2 break-words" style={{ color: '#0476b1', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                      {formatCurrency(order.totalAmount, state.tableInfo?.currency)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-slate-50/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-semibold">×{item.quantity}</span>
                        <span className="text-slate-900 font-medium">{toTitleCase(item.name)}</span>
                      </div>
                      <span className="text-slate-700 font-semibold">
                        {formatCurrency(item.price * item.quantity, state.tableInfo?.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Details */}
                {/* Removed status, estimated time and repeated order id */}
              </div>
            ))}
          </div>
        )}

        {/* Removed Cumulative Billing card */}
      </div>
      <BottomNav />

      {/* Pay Bill button for Restaurant only */}
      {outletType === 'Restaurant' && orders.length > 0 && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setIsBillOverlayOpen(true)}
            disabled={isPaymentLoading}
            className="w-full text-white px-6 py-4 rounded-xl font-semibold focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0476b1' }}
          >
            {isPaymentLoading ? 'Processing...' : 'Pay Bill'}
          </button>
        </div>
      )}

      {/* Error Popup */}
      {paymentError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Payment Error</h3>
              <p className="text-slate-600 mb-6">{paymentError}</p>
              <button
                onClick={handleCloseError}
                className="w-full px-6 py-3 rounded-xl text-white font-semibold transition-colors duration-200"
                style={{ backgroundColor: '#0476b1' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Confirmation Overlay for Restaurant */}
      {outletType === 'Restaurant' && (
        <BillConfirmationOverlay
          isOpen={isBillOverlayOpen}
          onClose={() => setIsBillOverlayOpen(false)}
          onProceedToPayment={handleProceedToPayment}
          tableInfo={state.tableInfo!}
          orders={orders}
          isPaymentLoading={isPaymentLoading}
        />
      )}
    </div>
  );
}
