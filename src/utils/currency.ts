export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const currencySymbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};

export const getCurrencySymbol = (currency: string = 'INR'): string => {
  const currencySymbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  return currencySymbols[currency] || currency;
};
