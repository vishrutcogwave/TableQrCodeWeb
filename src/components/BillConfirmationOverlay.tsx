'use client';

import { useState, useEffect } from 'react';
import { X, Receipt, CreditCard, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { ApiService, BillDetails } from '@/services/api';
import { CartItem, TableInfo } from '@/types';

interface BillConfirmationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: () => void;
  tableInfo: TableInfo;
  orders: any[];
  isPaymentLoading: boolean;
}

export default function BillConfirmationOverlay({
  isOpen,
  onClose,
  onProceedToPayment,
  tableInfo,
  orders,
  isPaymentLoading
}: BillConfirmationOverlayProps) {
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !billDetails) {
      fetchBillDetails();
    }
  }, [isOpen]);

  const fetchBillDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const qrParamsRaw = sessionStorage.getItem('qrParams');
      const qrParams = qrParamsRaw ? JSON.parse(qrParamsRaw) : null;

      // Get old cart to build items for getBill
      const oldCart = await ApiService.getOldCart(tableInfo);
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
      const bill = await ApiService.getBill(cartItems, tableInfo, qrParams, guestName, mobileNumber);
      setBillDetails(bill);

      // Persist for callback
      sessionStorage.setItem('lastBillDetails', JSON.stringify(bill));

    } catch (err) {
      console.error('Error fetching bill details:', err);
      setError('Failed to load bill details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBillDetails(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f0f7fc' }}>
              <IndianRupee className="w-5 h-5" style={{ color: '#0476b1' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bill Confirmation</h2>
              <p className="text-sm text-slate-600">Table {tableInfo.tableNumber}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading bill details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Error</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={fetchBillDetails}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : billDetails ? (
            <div className="space-y-6">
              {/* Collated Order Items */}
              <div>
                <div className="space-y-3">
                  {(() => {
                    // Collate all items across all orders
                    const collatedItems = new Map();
                    
                    orders.forEach((order) => {
                      order.items.forEach((item: any) => {
                        const key = `${item.name}-${item.instructions || ''}`;
                        if (collatedItems.has(key)) {
                          const existing = collatedItems.get(key);
                          existing.quantity += item.quantity;
                          existing.totalPrice += item.price * item.quantity;
                        } else {
                          collatedItems.set(key, {
                            name: item.name,
                            instructions: item.instructions,
                            price: item.price,
                            quantity: item.quantity,
                            totalPrice: item.price * item.quantity
                          });
                        }
                      });
                    });
                    
                    return Array.from(collatedItems.values()).map((item, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            {item.instructions && (
                              <p className="text-xs text-slate-500 mt-1">{item.instructions}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900">
                              {formatCurrency(item.totalPrice, tableInfo.currency)}
                            </p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Bill Summary</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span>{formatCurrency(billDetails.TotalAmount, tableInfo.currency)}</span>
                  </div>
                  {billDetails.TaxList && billDetails.TaxList.map((taxItem, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{taxItem.TaxName} on {formatCurrency(taxItem.TaxableAmount, tableInfo.currency)}</span>
                      <span>{formatCurrency(taxItem.TaxAmount, tableInfo.currency)}</span>
                    </div>
                  ))}
                  {billDetails.ServiceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge{billDetails.ServiceChargePer > 0 ? ` (${billDetails.ServiceChargePer}%)` : ''}</span>
                      <span>{formatCurrency(billDetails.ServiceCharge, tableInfo.currency)}</span>
                    </div>
                  )}
                  {billDetails.Discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount{billDetails.DiscountPer > 0 ? ` (${billDetails.DiscountPer}%)` : ''}</span>
                      <span>-{formatCurrency(billDetails.Discount, tableInfo.currency)}</span>
                    </div>
                  )}
                  {billDetails.RoundOff !== 0 && (
                    <div className="flex justify-between">
                      <span>Round Off</span>
                      <span>{formatCurrency(billDetails.RoundOff, tableInfo.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-base font-bold text-slate-900">
                    <span>Grand Total</span>
                    <span>{formatCurrency(billDetails.GrandTotal, tableInfo.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer - Fixed at bottom */}
        {billDetails && !isLoading && !error && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <button
              onClick={onProceedToPayment}
              disabled={isPaymentLoading || billDetails.GrandTotal <= 0}
              className="w-full text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0476b1' }}
            >
              {isPaymentLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Proceed to Payment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
