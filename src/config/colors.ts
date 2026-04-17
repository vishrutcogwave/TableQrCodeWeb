/**
 * Color configuration for the Hotel 360 Restaurant App
 * 
 * This file centralizes all color definitions to make it easy to change
 * the app's color scheme in the future.
 */

export const colors = {
  // Primary brand color
  primary: '#0476b1',
  
  // Primary color variations (for gradients and hover states)
  primaryDark: '#035a87', // Slightly darker version for gradients
  
  // Light background color used with primary text
  primaryLight: '#f0f7fc',
  
  // Legacy colors (kept for reference)
  // primary: '#017675',
  // primaryDark: '#015a5a',
  // primary: '#313084',
  // primaryDark: '#2a2a6b',
} as const;

export type Colors = typeof colors;
