/**
 * Utility functions for handling image fallbacks
 */

import { DEFAULT_IMAGE } from '@/config/api';

/**
 * Handles image loading errors by setting a fallback image
 * @param event - The error event from the image element
 * @param fallbackImage - Optional custom fallback image path
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackImage: string = DEFAULT_IMAGE
) => {
  const target = event.target as HTMLImageElement;
  target.src = fallbackImage;
};

/**
 * Checks if an image URL is valid (not null, not empty, and not already a fallback)
 * @param imageUrl - The image URL to check
 * @param fallbackImage - The fallback image path to compare against
 * @returns boolean indicating if the image should be displayed
 */
export const hasValidImage = (
  imageUrl: string | null | undefined,
  fallbackImage: string = DEFAULT_IMAGE
): boolean => {
  return !!(imageUrl && imageUrl !== fallbackImage && imageUrl !== null);
};

/**
 * Gets the appropriate image source, falling back to default if needed
 * @param imageUrl - The original image URL
 * @param fallbackImage - The fallback image path
 * @returns The image URL to use
 */
export const getImageSource = (
  imageUrl: string | null | undefined,
  fallbackImage: string = DEFAULT_IMAGE
): string => {
  return hasValidImage(imageUrl) ? imageUrl! : fallbackImage;
};
