/**
 * Утилита для форматирования цены в белорусских рублях (BYN)
 */

/**
 * Форматирует число в цену в белорусских рублях
 * @param price - Цена (число или строка)
 * @returns Отформатированная строка с ценой (например, "1 234,56 BYN")
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0,00 BYN';
  }
  
  return new Intl.NumberFormat('be-BY', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

/**
 * Форматирует цену без символа валюты (только число)
 * @param price - Цена (число или строка)
 * @returns Отформатированная строка с ценой (например, "1 234,56")
 */
export function formatPriceNumber(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0,00';
  }
  
  return new Intl.NumberFormat('be-BY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

/**
 * Форматирует цену в кратком формате (только число с 2 знаками после запятой)
 * @param price - Цена (число или строка)
 * @returns Отформатированная строка (например, "1234.56")
 */
export function formatPriceShort(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0.00';
  }
  
  return numPrice.toFixed(2);
}