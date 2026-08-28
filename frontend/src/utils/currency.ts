// Default exchange rate: 1 USD = 120 ETB (Change this as needed)
export const EXCHANGE_RATE_ETB = 120;

/**
 * Formats a given amount into a dual currency string: USD and ETB.
 * Example: formatCurrency(10) => "$10.00 / 1,200.00 ETB"
 * 
 * @param amount - The price in USD to be formatted
 * @returns Formatted string with both currencies
 */
export const formatCurrency = (amount: number | string): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle invalid numbers gracefully
    if (isNaN(numericAmount)) {
        return '$0.00 / 0.00 ETB';
    }

    const usdStr = numericAmount.toFixed(2);
    const etbAmount = numericAmount * EXCHANGE_RATE_ETB;
    
    // Use Intl.NumberFormat for ETB to add thousands separators
    const etbStr = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(etbAmount);

    return `$${usdStr} / ${etbStr} ETB`;
};
