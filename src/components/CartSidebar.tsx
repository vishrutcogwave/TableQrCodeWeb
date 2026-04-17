'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { X, Plus, Minus, Trash2, CreditCard, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { toTitleCase } from '@/utils/textFormatting';
import { QRCodeParams } from '@/utils/urlParser';
import { getPaymentInfoText, getOrderButtonText, getPaymentFlow, getCartButtonText, shouldSubmitOrderFromCart } from '@/utils/outletHelpers';
import { BillDetails, ApiService } from '@/services/api';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrderTotal: number;
  grandTotal: number;
}

interface SwipeableCartItemProps {
  item: any;
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateInstructions: (itemId: string, instructions: string) => void;
  currency?: string;
}

function SwipeableCartItem({ item, onQuantityChange, onRemoveItem, onUpdateInstructions, currency }: SwipeableCartItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipeActive) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchStartX.current - touchX;
    const deltaY = Math.abs(touchStartY.current - touchY);
    
    // Only allow horizontal swipe if vertical movement is minimal
    if (deltaY < 50 && deltaX > 0) {
      setSwipeOffset(Math.min(deltaX, 80)); // Max swipe distance of 80px
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 40) {
      // Swipe threshold reached, remove item
      onRemoveItem(item.id);
    }
    setSwipeOffset(0);
    setIsSwipeActive(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete Action Background */}
      <div className="absolute inset-0 flex items-center justify-end pr-4" style={{ backgroundColor: '#0476b1' }}>
        <Trash2 className="w-6 h-6 text-white" />
      </div>
      
      {/* Cart Item */}
      <div
        ref={itemRef}
        className="relative backdrop-blur-sm rounded p-4 border shadow-sm transition-transform duration-200"
        style={{ backgroundColor: '#f0f7fc', borderColor: '#e0e0f0', transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-0">{toTitleCase(item.name)}</h3>
            <p className="text-sm font-medium" style={{ color: '#0476b1' }}>{formatCurrency(item.price, currency)} each</p>
          </div>
          <button
            onClick={() => onRemoveItem(item.id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-xl p-1" style={{ backgroundColor: '#f0f7fc' }}>
            <button
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm transition-all duration-200"
              style={{ color: '#0476b1' }}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
            <button
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm transition-all duration-200"
              style={{ color: '#0476b1' }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="font-bold text-slate-900 text-lg">
            {formatCurrency(item.price * item.quantity, currency)}
          </span>
        </div>

        {/* Special Instructions */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Special instructions (optional)"
            value={item.instructions || ''}
            onChange={(e) => onUpdateInstructions(item.id, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 bg-white/50 text-slate-700 transition-all duration-200"
            style={{ '--tw-ring-color': '#0476b1' } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}

export default function CartSidebar({ isOpen, onClose, currentOrderTotal, grandTotal }: CartSidebarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [isLoadingBill, setIsLoadingBill] = useState(false);
  const { state, dispatch, submitOrder } = useApp();
  const router = useRouter();

  // Fetch bill details when sidebar opens for Fastfood/Roomservice/Restdirect
  useEffect(() => {
    if (isOpen && state.outletType && (state.outletType === 'Fastfood' || state.outletType === 'Roomservice' || state.outletType === 'Restdirect') && state.cart.length > 0) {
      fetchBillDetails();
    }
  }, [isOpen, state.outletType, state.cart]);

  const fetchBillDetails = async () => {
    try {
      setIsLoadingBill(true);
      setBillDetails(null);

      const qrParamsRaw = sessionStorage.getItem('qrParams');
      const qrParams = qrParamsRaw ? JSON.parse(qrParamsRaw) : null;
      const guestName = sessionStorage.getItem('guestName') || 'Guest';
      const mobileNumber = sessionStorage.getItem('mobileNumber') || '';

      // Get bill details using current cart items
      const bill = await ApiService.getBill(state.cart, state.tableInfo!, qrParams, guestName, mobileNumber);
      setBillDetails(bill);

      // Persist for callback (for Fastfood payment flow)
      sessionStorage.setItem('lastBillDetails', JSON.stringify(bill));

    } catch (err) {
      console.error('Error fetching bill details:', err);
    } finally {
      setIsLoadingBill(false);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { id: itemId, quantity: newQuantity } });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const handlePlaceOrder = async () => {
    if (state.cart.length === 0) return;

    setIsProcessing(true);
    try {
      if (state.outletType === 'Restaurant') {
        // Restaurant flow: Submit order and go to orders page
        await handleRestaurantOrder();
      } else if (state.outletType === 'Fastfood' || state.outletType === 'Restdirect') {
        // Fastfood/Restdirect flow: Initiate payment directly
        await handleFastfoodPayment();
      } else if (state.outletType === 'Roomservice') {
        // Roomservice flow: Submit order directly (no payment)
        await handleRoomserviceOrder();
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestaurantOrder = async () => {
    // Get guest information from sessionStorage (from auth flow)
    console.log("inside handleRestaurantOrder");
    console.log("sessionStorage:", sessionStorage);
    const guestName = sessionStorage.getItem('guestName') || 'Guest';
    const mobileNumber = sessionStorage.getItem('mobileNumber') || '';
    const qrParams: QRCodeParams | undefined = JSON.parse(sessionStorage.getItem('qrParams') || 'null');

    console.log("Guest Name:", guestName);
    console.log("Mobile Number:", mobileNumber);
    console.log("QR Params:", qrParams);
    const result = await submitOrder(guestName, mobileNumber, qrParams);
    
    if (result.success) {
      onClose();
      // Go to orders page for Restaurant
      router.push('/orders');
    } else {
      alert(`Failed to place order: ${result.error}`);
    }
  };

  const handleFastfoodPayment = async () => {
    if (!billDetails) {
      alert('Bill details not available. Please try again.');
      return;
    }

    try {
      const qrParamsRaw = sessionStorage.getItem('qrParams');
      const qrParams = qrParamsRaw ? JSON.parse(qrParamsRaw) : null;
      const guestName = sessionStorage.getItem('guestName') || 'Guest';
      const mobileNumber = sessionStorage.getItem('mobileNumber') || '';

      // Build cart for postBill (similar to orders page)
      const branch = await ApiService.getBranchCode();
      const cartForPostBill = {
        UserCode: 1,
        Table: state.tableInfo!.tableNumber,
        SubTable: 'A',
        Outlet: parseInt(qrParams?.orgOltCode || '1') || 1,
        OutletName: qrParams?.orgOltName || 'Restaurant',
        Waiter: 1,
        WaiterName: 'Waiter',
        Pax: 1,
        Food: state.cart.map(i => ({
          Id: parseInt(i.id), 
           
          Food: i.name, 
          code: '0', 
          Price: i.price, 
          Qty: i.quantity, 
          Comment: i.instructions || '', 
          Category: parseInt(i.category), 
          OrigQty: i.quantity
        })),
        Total: state.cart.reduce((s,i)=>s+i.price*i.quantity,0),
        TotQty: state.cart.reduce((s,i)=>s+i.quantity,0),
        Branch: branch,
        Type: 'K', 
        NCCode: 0, 
        NCRemarks: '', 
        Discount: 0, 
        DiscountType: '', 
        DiscountRemarks: '', 
        VRemarks: '0', 
        Mode: 'ADD', 
        SubBillType: 'C', 
        Plan: '',
        GuestName: guestName,
        GuestCode: '',
        CheckInNo: qrParams?.checkinno || '',
        KotMobileNo: mobileNumber
      };

      // Store cart data for payment callback
      sessionStorage.setItem('lastOrderRequest', JSON.stringify(cartForPostBill));
      
      // Store current cart items in session storage for recovery in case of payment issues
      sessionStorage.setItem('cart', JSON.stringify(state.cart));
      sessionStorage.setItem('cartBackup', JSON.stringify(state.cart)); // Backup copy

      // Build redirect URL
      const redirectUrl = `${window.location.origin}/payment/callback`;

      // Initiate payment
      const paymentResponse = await ApiService.initiatePayment(billDetails.GrandTotal, redirectUrl);
      
      if (!paymentResponse.paymentUrl) {
        alert('Unable to initiate Payment');
        return;
      }

      // Store merchant order ID
      localStorage.setItem('merchantOrderID', paymentResponse.merchantOrderID);
      
      // Redirect to payment gateway
      window.location.href = paymentResponse.paymentUrl;

    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const handleRoomserviceOrder = async () => {
    try {
      const qrParamsRaw = sessionStorage.getItem('qrParams');
      const qrParams = qrParamsRaw ? JSON.parse(qrParamsRaw) : null;
      const guestName = sessionStorage.getItem('guestName') || 'Guest';
      const mobileNumber = sessionStorage.getItem('mobileNumber') || '';

      // Submit order using existing API
      const result = await ApiService.submitOrder(state.cart, state.tableInfo!, guestName, mobileNumber, qrParams);
      
      if (result.success) {
        // Clear cart items for Roomservice after successful order submission
        dispatch({ type: 'CLEAR_CART' });
        
        // Success - close sidebar and redirect to menu
        onClose();
        router.push('/menu');
      } else {
        alert(result.error || 'Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    }
  };

  // Handle close button click
  const handleClose = (e: React.MouseEvent) => {
    console.log("handleClose called");
    e.preventDefault();
    e.stopPropagation();
    console.log("onClose function:", onClose);
    onClose();
    console.log("onClose called");
  };

  const handlePayment = async (orderId: string, amount: number) => {
    try {
      const paymentData = {
        orderId,
        amount,
        method: 'card'
      };

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Payment successful! Transaction ID: ${result.data.transactionId}`);
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  console.log("CartSidebar render - isOpen:", isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Sidebar */}
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-l border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/50" style={{ background: 'linear-gradient(to right, #f0f7fc, #e8e8f0)' }}>
            <h2 className="text-xl font-bold text-slate-900">Your Order</h2>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-5">
            {state.cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.cart.map((item) => (
                  <SwipeableCartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemoveItem={handleRemoveItem}
                    onUpdateInstructions={(itemId, instructions) => dispatch({
                      type: 'UPDATE_CART_ITEM',
                      payload: { id: itemId, quantity: item.quantity, instructions }
                    })}
                    currency={state.tableInfo?.currency}
                  />
                ))}
              </div>
            )}

            {/* Bill Summary for Fastfood, Roomservice, and Restdirect */}
            {state.cart.length > 0 && state.outletType && (state.outletType === 'Fastfood' || state.outletType === 'Roomservice' || state.outletType === 'Restdirect') && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Bill Summary</h3>
                {isLoadingBill ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-600 text-sm">Loading bill details...</p>
                  </div>
                ) : billDetails ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(billDetails.TotalAmount, state.tableInfo?.currency)}</span>
                    </div>
                    {billDetails.TaxList && billDetails.TaxList.map((taxItem, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-slate-600">{taxItem.TaxName} on {formatCurrency(taxItem.TaxableAmount, state.tableInfo?.currency)}</span>
                        <span className="font-medium">{formatCurrency(taxItem.TaxAmount, state.tableInfo?.currency)}</span>
                      </div>
                    ))}
                    {billDetails.ServiceCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Service Charge{billDetails.ServiceChargePer > 0 ? ` (${billDetails.ServiceChargePer}%)` : ''}</span>
                        <span className="font-medium">{formatCurrency(billDetails.ServiceCharge, state.tableInfo?.currency)}</span>
                      </div>
                    )}
                    {billDetails.Discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Discount{billDetails.DiscountPer > 0 ? ` (${billDetails.DiscountPer}%)` : ''}</span>
                        <span className="font-medium text-green-600">-{formatCurrency(billDetails.Discount, state.tableInfo?.currency)}</span>
                      </div>
                    )}
                    {billDetails.RoundOff !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Round Off</span>
                        <span className="font-medium">{formatCurrency(billDetails.RoundOff, state.tableInfo?.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2 mt-2">
                      <span className="text-slate-900">Grand Total</span>
                      <span style={{ color: '#0476b1' }}>{formatCurrency(billDetails.GrandTotal, state.tableInfo?.currency)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500 text-sm">Unable to load bill details</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary - Show for Restaurant only */}
          {state.cart.length > 0 && state.outletType === 'Restaurant' && (
            <div className="border-t border-slate-200/50 p-6 space-y-5" style={{ background: 'linear-gradient(to right, #f8fafc, #f0f7fc)' }}>
              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Current Order</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(currentOrderTotal, state.tableInfo?.currency)}</span>
                </div>
                {state.orders.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Previous Orders</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(grandTotal - currentOrderTotal, state.tableInfo?.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t border-slate-200 pt-3">
                  <span className="text-slate-900">Total</span>
                  <span style={{ color: '#0476b1' }}>{formatCurrency(grandTotal, state.tableInfo?.currency)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="text-sm text-slate-600 bg-blue-50/80 p-3 rounded-xl border border-blue-100">
                <span className="font-medium">
                  {state.outletType ? getPaymentInfoText(state.outletType) : '📋 Payment at bill settlement'}
                </span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full text-white py-4 px-6 rounded-xl font-semibold focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0476b1' }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {state.outletType ? (
                      <>
                        {getPaymentFlow(state.outletType) === 'immediate' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : (
                          <ShoppingBag className="w-5 h-5" />
                        )}
                        Place Order
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        Place Order
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Place Order Button for Fastfood, Roomservice, and Restdirect */}
          {state.cart.length > 0 && state.outletType && (state.outletType === 'Fastfood' || state.outletType === 'Roomservice' || state.outletType === 'Restdirect') && (
            <div className="border-t border-slate-200/50 p-6 space-y-5" style={{ background: 'linear-gradient(to right, #f8fafc, #f0f7fc)' }}>
              {/* Payment Info */}
              <div className="text-sm text-slate-600 bg-blue-50/80 p-3 rounded-xl border border-blue-100">
                <span className="font-medium">
                  {state.outletType ? getPaymentInfoText(state.outletType) : '📋 Payment at bill settlement'}
                </span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing || ((state.outletType === 'Fastfood' || state.outletType === 'Restdirect') && !billDetails)}
                className="w-full text-white py-4 px-6 rounded-xl font-semibold focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0476b1' }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {state.outletType ? (
                      <>
                        {getPaymentFlow(state.outletType) === 'immediate' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : (
                          <ShoppingBag className="w-5 h-5" />
                        )}
                        Place Order
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        Place Order
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
