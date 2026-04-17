// Mock OTP Service - Replace with real API calls later

import { API_CONFIG } from '@/config/api';

export interface OTPResponse {
  success: boolean;
  message: string;
  otpId?: string;
  otp?: string; // Store the actual OTP for verification
}

export interface OTPVerificationResponse {
  success: boolean;
  message: string;
  token?: string;
}

// Centralized OTP length for UI and validation
export const OTP_LENGTH = 4;

export class OTPService {
  // Mock OTP sending
 static async sendOTP(mobileNumber: string, name: string): Promise<OTPResponse> {
  try {
    if (!mobileNumber || mobileNumber.length < 10) {
      return {
        success: false,
        message: 'Please enter a valid mobile number'
      };
    }

    if (!name || name.trim().length < 2) {
      return {
        success: false,
        message: 'Please enter a valid name'
      };
    }

    const url = `${API_CONFIG.baseUrl}/api/kot/otpNo?MobileNo=${encodeURIComponent(mobileNumber)}`;
    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, message: 'Failed to request OTP' };
    }

    let otpText = (await res.text()).trim();

    try {
      const parsed = JSON.parse(otpText);
      otpText = typeof parsed === 'string' ? parsed : String(parsed);
    } catch {
      if (
        (otpText.startsWith('"') && otpText.endsWith('"')) ||
        (otpText.startsWith("'") && otpText.endsWith("'"))
      ) {
        otpText = otpText.slice(1, -1);
      }
    }

    const otp = otpText.trim();
    const otpId = `otp_${Date.now()}`;

    sessionStorage.setItem(`otp_${otpId}`, otp);

    return {
      success: true,
      message: 'OTP sent successfully',
      otpId
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.'
    };
  }
}
  
  // Mock OTP verification
static async verifyOTP(otpId: string, otp: string): Promise<OTPVerificationResponse> {
  try {
    if (!otp || otp.length !== OTP_LENGTH) {
      return {
        success: false,
        message: `Please enter a valid ${OTP_LENGTH}-digit OTP`
      };
    }

    const storedOtp = sessionStorage.getItem(`otp_${otpId}`);

    if (!storedOtp) {
      return {
        success: false,
        message: 'OTP session expired. Please request a new OTP.'
      };
    }

    if (storedOtp.trim() === otp.trim()) {
      sessionStorage.removeItem(`otp_${otpId}`);

      const token = `token_${Date.now()}`;
      return {
        success: true,
        message: 'OTP verified successfully',
        token
      };
    } else {
      return {
        success: false,
        message: 'Invalid OTP. Please try again.'
      };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    };
  }
}
}
