/**
 * Cliente avanzado para la Shopify API (Soporta Storefront API y Admin REST API).
 * 
 * Permite consultar tus productos reales de Shopify usando tanto tokens de Storefront
 * como credenciales de Admin API (shpss_ / shpat_).
 */

import { Product } from '../types';

const SHOPIFY_STORE_DOMAIN = '023fiq-1b.myshopify.com';
const API_VERSION = '2024-10';

/**
 * Consulta los productos reales en Shopify (intenta Admin API si el token lo requiere, o Storefront API).
 */
export async function fetchShopifyProducts(
  token: string,
  maxProducts: number = 50
): Promise<Product[]> {
  // 0. Intentar primero el catálogo público JSON (/products.json) que no tiene restricciones CORS ni requiere token en producción
  try {
    const publicProducts = await fetchPublicShopifyCatalog();
    if (publicProducts.length > 0) return publicProducts;
  } catch (err: any) {
    console.warn('[Dante Store] Consulta pública /products.json falló, intentando tokens API...', err?.message);
  }

  const cleanToken = token.trim();

  // Si el token es de tipo Admin (empieza por shpss_ o shpat_), intentamos REST Admin API
  if (cleanToken.startsWith('shpss_') || cleanToken.startsWith('shpat_')) {
    try {
      const adminProducts = await fetchAdminProductsREST(cleanToken);
      if (adminProducts.length > 0) return adminProducts;
    } catch (err: any) {
      console.warn('[Dante Store] Consulta Admin API REST falló, intentando GraphQL Storefront...', err?.message);
    }
  }

  // Intentar Storefront GraphQL API
  return await fetchStorefrontProductsGraphQL(cleanToken, maxProducts);
}

/**
 * Consulta el endpoint público de Shopify /products.json para obtener los productos importados de Dropi sin error CORS.
 */
export async function fetchPublicShopifyCatalog(): Promise<Product[]> {
  const endpoints = [
    '/products.json?limit=250',
    `https://${SHOPIFY_STORE_DOMAIN}/products.json?limit=250`,
    'https://latiendadedante.com/products.json?limit=250'
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        const json = await response.json();
        const rawProducts: any[] = json.products || [];
        if (rawProducts.length > 0) {
          return mapShopifyRestProducts(rawProducts);
        }
      }
    } catch (e) {
      // Continuar con el siguiente endpoint
    }
  }
  return [];
}

/**
 * Consulta productos usando Admin REST API (para tokens shpss_ / shpat_)
 */
async function fetchAdminProductsREST(token: string): Promise<Product[]> {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/products.json?status=active`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify Admin API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const rawProducts: any[] = json.products || [];

  return mapShopifyRestProducts(rawProducts);
}

function mapShopifyRestProducts(rawProducts: any[]): Product[] {
  return rawProducts.filter(p => {
    const variant = p.variants?.[0];
    if (variant && variant.available === false) return false;
    return true;
  }).map((p, index) => {
    const variant = p.variants?.[0] || {};
    const price = Math.round(parseFloat(variant.price || '0'));
    const compareAtPrice = variant.compare_at_price ? Math.round(parseFloat(variant.compare_at_price)) : undefined;
    const imageUrl = p.image?.src || p.images?.[0]?.src || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600';

    // Extraer costo de Dropi si está en los tags
    let dropiCost = Math.round(price * 0.4);
    const tagsList = typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : [];
    for (const tag of tagsList) {
      if (tag.toLowerCase().startsWith('dropicost_')) {
        dropiCost = parseInt(tag.replace(/dropicost_/i, ''), 10) || dropiCost;
      }
    }

    return {
      id: `shopify-${p.id}`,
      name: p.title || `Producto #${index + 1}`,
      category: p.product_type || 'Catálogo Principal',
      description: p.body_html || 'Producto de alta calidad con stock verificado.',
      price,
      compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
      imageUrl,
      images: p.images?.map((img: any) => img.src) || [],
      badge: index === 0 ? '⭐ Destacado' : undefined,
      features: [
        '✅ Producto con stock verificado',
        '🚚 Envío contra entrega en toda Colombia',
        '🔒 Pago seguro garantizado',
      ],
      specs: {
        'Bodega': 'Dropi Colombia',
        'Disponibilidad': 'En stock inmediato',
        'Envíos': '1 - 3 días hábiles',
      },
      dropiCost,
      rating: 4.9,
      reviewsCount: 24,
    };
  });
}

/**
 * Consulta productos usando Storefront GraphQL API
 */
async function fetchStorefrontProductsGraphQL(token: string, maxProducts: number): Promise<Product[]> {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/api/${API_VERSION}/graphql.json`;

  const PRODUCTS_QUERY = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            availableForSale
            description
            descriptionHtml
            productType
            tags
            featuredImage {
              url
            }
            images(first: 5) {
              edges {
                node {
                  url
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            compareAtPriceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({
      query: PRODUCTS_QUERY,
      variables: { first: maxProducts },
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify Storefront API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${json.errors[0]?.message || 'Unknown error'}`);
  }

  const edges: any[] = json.data?.products?.edges || [];

  return edges.filter(edge => edge.node.availableForSale !== false).map((edge, index) => {
    const node = edge.node;
    const price = Math.round(parseFloat(node.priceRange.minVariantPrice.amount));
    const compareAtPrice = parseFloat(node.compareAtPriceRange.minVariantPrice.amount);

    return {
      id: `shopify-${node.id.split('/').pop() || index}`,
      name: node.title,
      category: node.productType || 'Favoritos de Dante',
      description: node.descriptionHtml || node.description || 'Producto exclusivo de nuestra tienda 🐾',
      price,
      compareAtPrice: compareAtPrice > price ? Math.round(compareAtPrice) : undefined,
      imageUrl: node.featuredImage?.url || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600',
      images: node.images?.edges?.map((e: any) => e.node.url) || [],
      badge: index === 0 ? '⭐ Destacado' : undefined,
      features: [
        'Calidad premium con garantía',
        'Envío gratis contra entrega a nivel nacional',
      ],
      specs: {
        'Disponibilidad': 'En stock',
        'Envíos': '1 - 3 días hábiles en Colombia',
      },
      dropiCost: Math.round(price * 0.4),
      rating: 4.8,
      reviewsCount: 35,
    };
  });
}
