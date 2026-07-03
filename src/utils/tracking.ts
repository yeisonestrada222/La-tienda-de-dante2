// src/utils/tracking.ts
// Pixel de Meta Ads y TikTok Ads — OPT #3 CRO
// ────────────────────────────────────────────
// Para activar: reemplaza 'TU_PIXEL_META_ID' en index.html
// y 'TU_PIXEL_TIKTOK_ID' en el snippet de TikTok
// Todos los eventos ya se disparan automáticamente desde
// ProductLandingPage.tsx y Checkout.tsx

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: { track: (event: string, data?: object) => void };
  }
}

export function trackViewContent(product: { name: string; price: number; id: string }) {
  try {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'COP',
      });
    }
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        content_name: product.name,
        content_id: product.id,
        value: product.price,
        currency: 'COP',
      });
    }
  } catch (e) {
    console.warn('[Dante Tracking] ViewContent error:', e);
  }
}

export function trackInitiateCheckout(totalPrice: number, numItems: number) {
  try {
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: totalPrice,
        currency: 'COP',
        num_items: numItems,
      });
    }
    if (window.ttq) {
      window.ttq.track('InitiateCheckout', {
        value: totalPrice,
        currency: 'COP',
      });
    }
  } catch (e) {
    console.warn('[Dante Tracking] InitiateCheckout error:', e);
  }
}

export function trackPurchase(orderId: string, totalPrice: number, items: { id: string; name: string }[]) {
  try {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: totalPrice,
        currency: 'COP',
        order_id: orderId,
        content_type: 'product',
        content_ids: items.map(i => i.id),
        num_items: items.length,
      });
    }
    if (window.ttq) {
      window.ttq.track('CompletePayment', {
        value: totalPrice,
        currency: 'COP',
        order_id: orderId,
      });
    }
  } catch (e) {
    console.warn('[Dante Tracking] Purchase error:', e);
  }
}
