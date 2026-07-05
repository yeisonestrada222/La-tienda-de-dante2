/**
 * Utilitario de promociones y cupones de descuento para La Tienda de Dante.
 * Centraliza la lógica de cupones para evitar strings hardcodeados en los componentes.
 */

export const COUPON_CODES: Record<string, number> = {
  'DANTE15': 0.15,
  'DANTE10': 0.10,
};

/**
 * Aplica un cupón de descuento a un precio.
 * @returns El precio con descuento o el precio original si el cupón no es válido.
 */
export function applyCoupon(code: string, price: number): number {
  const discount = COUPON_CODES[code.toUpperCase().trim()];
  return discount ? Math.round(price * (1 - discount)) : price;
}

/**
 * Verifica si un código de cupón es válido.
 */
export function isValidCoupon(code: string): boolean {
  return code.toUpperCase().trim() in COUPON_CODES;
}
