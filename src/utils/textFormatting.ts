/**
 * Text formatting utilities
 */

/**
 * Converts text to title case for display purposes
 * Preserves the original data while providing formatted display text
 * @param text - The text to convert to title case
 * @returns The text in title case format
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
