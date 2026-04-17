'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService, BillDetails, PaymentStatusResponse } from '@/services/api';
import { OrderSubmitRequest, TableInfo } from '@/types';
import { WhatsAppService } from '@/services/whatsappService';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'posting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setStatus('loading');
        // Read merchantOrderID from localStorage (set during initiation)
        const merchantOrderID = localStorage.getItem('merchantOrderID') || sessionStorage.getItem('merchantOrderID');
        if (!merchantOrderID) {
          setStatus('error');
          setMessage('Missing merchantOrderID');
          return;
        }

        // Get amount from stored bill details for mock payment
        let amount = 0;
        let currency = 'INR';
        try {
          const taxRaw = sessionStorage.getItem('lastBillDetails') || localStorage.getItem('lastBillDetails');
          if (taxRaw) {
            const tax = JSON.parse(taxRaw);
            amount = tax.GrandTotal || 0;
            currency = 'INR'; // Default currency
          }
        } catch (error) {
          console.error('Error parsing bill details:', error);
        }

        let statusResp = await ApiService.getPaymentStatus(merchantOrderID, amount, currency);
        console.log("Payment status response:", statusResp);
        setPaymentStatus(statusResp);

        if (statusResp.state === 'PENDING') {
          console.log("Payment is pending. Waiting for confirmation...");
          setStatus('pending');
          setMessage('Payment is pending. Waiting for confirmation...');
          statusResp = await ApiService.pollPaymentStatus(merchantOrderID, 180000, 30000);
          setPaymentStatus(statusResp);
        }

        if (statusResp.state === 'COMPLETED') {
          console.log("Payment is completed. Posting bill...");
          setStatus('posting');
          // Rebuild Cart and Tax from storage
          const cartRaw = sessionStorage.getItem('lastOrderRequest') || localStorage.getItem('lastOrderRequest');
          const taxRaw = sessionStorage.getItem('lastBillDetails') || localStorage.getItem('lastBillDetails');

          if (!cartRaw || !taxRaw) {
            setStatus('error');
            setMessage('Missing bill context to post bill');
            return;
          }

          const cart: OrderSubmitRequest = JSON.parse(cartRaw);
          const tax: BillDetails = JSON.parse(taxRaw);

          // Check outlet type to determine which API to call
          const outletType = sessionStorage.getItem('outletType');
          let ok: boolean;
          
          if (outletType === 'Fastfood' || outletType === 'Restdirect') {
            ok = await ApiService.submitOrderfastfoodbill(cart, tax, 'ADD', 'C', statusResp, merchantOrderID);
          } else {
            ok = await ApiService.postBill(cart, tax, 'ADD', 'C', statusResp, merchantOrderID);
          }
          if (ok) {
            console.log("Payment successful. Bill posted.");
            setStatus('success');
            setMessage('Payment successful. Bill posted.');
            
            // Get merchantOrderID to fetch bill details
            const merchantOrderID = localStorage.getItem('merchantOrderID') || sessionStorage.getItem('merchantOrderID');
            
            // Fetch bill details using merchantOrderID
            let billDetails: any = null;
            if (merchantOrderID) {
              try {
                const billResponse = await ApiService.getBillNoByOrderId(merchantOrderID);
                billDetails = billResponse.billdetails;
                console.log('Bill details fetched:', billDetails);
              } catch (error) {
                console.error('Error fetching bill details:', error);
                // Continue even if bill details fetch fails
              }
            }

            // Send WhatsApp message
            if (billDetails && billDetails.OrderId && cart.GuestName && cart.KotMobileNo) {
              try {
                // Determine orderNumber based on outlet type
                let orderNumber: string;
                if (outletType === 'Fastfood' || outletType === 'Restdirect') {
                  orderNumber = billDetails.TokenNo || billDetails.Billno || '';
                } else {
                  // Restaurant or Roomservice
                  orderNumber = billDetails.Billno || '';
                }

                // Use billdetails.OrderId for bill URL
                const billUrl = `${window.location.origin}/bill/view/${billDetails.OrderId}`;
                
                const whatsappResult = await WhatsAppService.sendReceiptMessage({
                  phone: cart.KotMobileNo,
                  guestName: cart.GuestName,
                  amount: tax.GrandTotal,
                  orderNumber: orderNumber,
                  billUrl
                });

                if (whatsappResult.success) {
                  console.log('WhatsApp message sent successfully');
                } else {
                  console.error('Failed to send WhatsApp message:', whatsappResult.error);
                }
              } catch (error) {
                console.error('Error sending WhatsApp message:', error);
                // Don't block payment success if WhatsApp fails
              }
            } else {
              console.warn('Missing data for WhatsApp message:', {
                hasBillDetails: !!billDetails,
                hasOrderId: !!billDetails?.OrderId,
                hasGuestName: !!cart.GuestName,
                hasMobileNumber: !!cart.KotMobileNo
              });
            }

            // Clear stored context
            try {
              sessionStorage.removeItem('lastOrderRequest');
              sessionStorage.removeItem('lastBillDetails');
              sessionStorage.removeItem('merchantOrderID');
              localStorage.removeItem('lastOrderRequest');
              localStorage.removeItem('lastBillDetails');
              localStorage.removeItem('merchantOrderID');
            } catch {}
            
            // Clear cart for Fastfood/Restdirect when submitOrderfastfoodbill is successful
            if (outletType === 'Fastfood' || outletType === 'Restdirect') {
              sessionStorage.removeItem('cart');
              sessionStorage.removeItem('cartBackup'); // Clean up backup as well
              
              // Set flag to clear cart when menu page loads
              sessionStorage.setItem('shouldClearCart', 'true');
              
              console.log("Cart cleared for Fastfood after successful submitOrderfastfoodbill");
            }
            
            // Navigate based on outlet type
            if (outletType === 'Fastfood' || outletType === 'Restdirect') {
              // For Fastfood/Restdirect, go back to menu since orders page is hidden
              setTimeout(() => router.push('/menu'), 2000);
            } else {
              // For Restaurant, go to orders page
              setTimeout(() => router.push('/orders'), 2000);
            }
          } else {
            console.log("Payment successful. Bill not posted.");
            setStatus('error');
            setMessage('There was an error in saving the bill. Contact staff.');
            // Navigate users to orders or home
            setTimeout(() => router.push('/menu'), 5000);

          }
        } else if (statusResp.state === 'FAILED') {
          console.log("Payment failed. Please try again.");
          setStatus('error');
          setMessage('Payment failed. Please try again.');
          
          // Redirect based on outlet type
          const outletType = sessionStorage.getItem('outletType');
          if (outletType === 'Fastfood' || outletType === 'Restdirect') {
            // For Fastfood/Restdirect, restore cart items from backup and go back to menu
            try {
              const cartBackup = sessionStorage.getItem('cartBackup');
              if (cartBackup) {
                sessionStorage.setItem('cart', cartBackup);
                console.log('Cart items restored from backup for Fastfood/Restdirect payment failure');
              }
            } catch (error) {
              console.error('Error restoring cart backup:', error);
            }
            // For Fastfood, go back to menu since orders page is hidden
            setTimeout(() => router.push('/menu'), 2000);
          } else {
            // For Restaurant, go to orders page
            setTimeout(() => router.push('/orders'), 2000);
          }
        } else {
          console.log("Payment status: ", statusResp.state);
          setStatus('error');
          setMessage(`Payment status: ${statusResp.state}`);
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Failed to process payment callback');
      }
    };
    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Processing Payment</h1>
        {status === 'loading' && <p className="text-slate-600">Checking payment status...</p>}
        {status === 'pending' && (
          <p className="text-slate-600 animate-pulse">PENDING... waiting up to 3 minutes for confirmation</p>
        )}
        {status === 'posting' && <p className="text-slate-600">Posting bill...</p>}
        {status === 'success' && <p className="text-green-600 font-semibold">{message}</p>}
        {status === 'error' && (
          <div>
            <p className="text-red-600 mb-4">{message}</p>
          </div>
        )}
        {paymentStatus && (
          <div className="mt-4 text-left text-sm text-slate-600">
            <div><span className="font-semibold">Order:</span> {paymentStatus.orderId}</div>
            <div><span className="font-semibold">State:</span> {paymentStatus.state}</div>
            <div><span className="font-semibold">Amount:</span> {(paymentStatus.amount || 0) / 100}</div>
          </div>
        )}
      </div>
    </div>
  );
}


