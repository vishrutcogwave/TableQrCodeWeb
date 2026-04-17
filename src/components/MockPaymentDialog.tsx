'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface MockPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: 'COMPLETED' | 'FAILED') => void;
  amount: number;
  currency: string;
}

export default function MockPaymentDialog({
  isOpen,
  onClose,
  onResult,
  amount,
  currency
}: MockPaymentDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResult = async (result: 'COMPLETED' | 'FAILED') => {
    setIsProcessing(true);
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    onResult(result);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mock Payment</h2>
              <p className="text-sm text-slate-600">Choose payment result</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(amount, currency)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Payment Amount</h3>
            <p className="text-slate-600">Choose the payment result for testing</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleResult('COMPLETED')}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Success
                </>
              )}
            </button>

            <button
              onClick={() => handleResult('FAILED')}
              disabled={isProcessing}
              className="w-full bg-red-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Fail
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 text-center">
              💡 This is a mock payment dialog for development testing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
