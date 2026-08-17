// To'lov miqdorini optimallashtirish funksiyasi (TRLN, MLRD, MLN formatida)
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') return '-';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount === 0) return '0 so\'m';
  if (numAmount < 0) return `-${formatCurrency(Math.abs(numAmount))}`;

  // Trillionlar uchun (1,000,000,000,000+)
  if (numAmount >= 1000000000000) {
    const trillions = numAmount / 1000000000000;
    if (trillions >= 10) {
      return `${Math.round(trillions)} TRLN so'm`;
    } else {
      return `${trillions.toFixed(1)} TRLN so'm`;
    }
  }

  // Milliardlar uchun (1,000,000,000+)
  if (numAmount >= 1000000000) {
    const billions = numAmount / 1000000000;
    if (billions >= 10) {
      return `${Math.round(billions)} MLRD so'm`;
    } else {
      return `${billions.toFixed(1)} MLRD so'm`;
    }
  }

  // Millionlar uchun (1,000,000+)
  if (numAmount >= 1000000) {
    const millions = numAmount / 1000000;
    if (millions >= 10) {
      return `${millions.toFixed(1)} MLN so'm`;
    } else {
      return `${millions.toFixed(1)} MLN so'm`;
    }
  }
  
  // Minglar uchun (1,000+)
  if (numAmount >= 1000) {
    const thousands = numAmount / 1000;
    if (thousands >= 10) {
      return `${Math.round(thousands)}K so'm`;
    } else {
      return `${thousands.toFixed(1)}K so'm`;
    }
  }
  
  // 1000 dan kichik miqdorlar uchun
  return `${Math.round(numAmount)} so'm`;
};

// Batafsil to'lov ko'rsatish uchun (modal va detaillar uchun)
export const formatCurrencyDetailed = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') return '-';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '-';

  return numAmount.toLocaleString('uz-UZ').replace(/,/g, ' ') + ' so\'m';
};

// Sana formatini optimallashtirish
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch {
    return dateString;
  }
};