export default function formatCurrency(value: number): string {
    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  
    // If you ever need to show negative amounts, uncomment this:
    // return value < 0 ? `-${formatted}` : formatted;
  
    return formatted;
  }
  