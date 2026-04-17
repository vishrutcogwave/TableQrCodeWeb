'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { OTPService, OTP_LENGTH } from '@/services/otpService';
import { MenuItem, TableInfo } from '@/types';
import { toTitleCase } from '@/utils/textFormatting';
import { getTerminology } from '@/utils/outletHelpers';

interface OTPOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pendingItem: MenuItem | null;
  tableInfo: TableInfo | null;
}

export default function OTPOverlay({ isOpen, onClose, onSuccess, pendingItem, tableInfo }: OTPOverlayProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpId, setOtpId] = useState<string | null>(null);
  const { dispatch } = useApp();
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setGuestName('');
      setOtp('');
      setError(null);
      setOtpSent(false);
      setCountdown(0);
      setOtpId(null);
    }
  }, [isOpen]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim() || !guestName.trim()) {
      setError('Please enter both name and phone number');
      return;
    }

    if (!tableInfo) {
      setError('Table information not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await OTPService.sendOTP(phoneNumber, guestName);
      
      if (result.success) {
        setOtpId(result.otpId || null);
        setOtpSent(true);
        setStep('otp');
        setCountdown(60); // 60 seconds countdown
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (!tableInfo) {
      setError('Table information not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!otpId) {
        setError('OTP session expired. Please try again.');
        return;
      }

      const result = await OTPService.verifyOTP(otpId, otp);
      
      if (result.success) {
        // Persist to sessionStorage for downstream API calls
        try {
          sessionStorage.setItem('guestName', guestName);
          sessionStorage.setItem('mobileNumber', phoneNumber);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('guestNameUpdated'));
        } catch (_) {
          // ignore storage errors (e.g., SSR or private mode)
        }

        // Store user info in context
        dispatch({ 
          type: 'SET_TABLE_INFO', 
          payload: {
            ...tableInfo
          }
        });
        
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await OTPService.sendOTP(phoneNumber, guestName);
      
      if (result.success) {
        // Clear the OTP input since a new OTP was sent
        setOtp('');
        setOtpId(result.otpId || null);
        setCountdown(60);
        setError(null);
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {step === 'otp' && (
              <button
                onClick={handleBackToPhone}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-900">
              {step === 'phone' ? 'Verify Your Details' : 'Enter OTP'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pending Item Info */}
          {pendingItem && (
            <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#f0f7fc', borderColor: '#e0e0f0', border: '1px solid' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0f7fc' }}>
                  <span className="font-semibold text-sm" style={{ color: '#0476b1' }}>🍽️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-sm">{toTitleCase(pendingItem.name)}</h3>
                  <p className="text-slate-600 text-xs">Ready to add to cart</p>
                </div>
              </div>
            </div>
          )}

          {step === 'phone' ? (
            /* Phone Number Step */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0f7fc' }}>
                  <Smartphone className="w-8 h-8" style={{ color: '#0476b1' }} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  We need your details to continue
                </h3>
                <p className="text-slate-600 text-sm">
                  Please provide your name and phone number to add items to cart
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="guestName" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 transition-colors"
                    style={{ '--tw-ring-color': '#0476b1' } as React.CSSProperties}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 transition-colors"
                    style={{ '--tw-ring-color': '#0476b1' } as React.CSSProperties}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={isLoading || !phoneNumber.trim() || !guestName.trim()}
                className="w-full text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0476b1' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          ) : (
            /* OTP Verification Step */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  OTP Sent Successfully
                </h3>
                <p className="text-slate-600 text-sm">
                  We've sent a {OTP_LENGTH}-digit OTP to <span className="font-medium">{phoneNumber}</span>
                </p>
                {process.env.NODE_ENV !== 'production' && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-xs text-center">
                      <strong>For testing:</strong> Use OTP <span className="font-mono font-bold">{'9'.repeat(OTP_LENGTH)}</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-2">
                  Enter OTP
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                  placeholder={Array.from({ length: OTP_LENGTH }).map(() => '0').join('')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 transition-colors text-center text-2xl font-mono tracking-widest"
                  style={{ '--tw-ring-color': '#0476b1' } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== OTP_LENGTH}
                  className="w-full text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#0476b1' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>

                <button
                  onClick={handleResendOTP}
                  disabled={isLoading || countdown > 0}
                  className="w-full text-slate-600 py-2 px-4 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
