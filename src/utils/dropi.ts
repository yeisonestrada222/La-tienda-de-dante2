/**
 * Cliente para la API de Dropi Colombia.
 * 
 * Permite consultar los productos del catálogo de Dropi usando el token
 * de integración del usuario. Los productos se mapean al tipo Product
 * de la aplicación.
 * 
 * Documentación base: https://api.dropi.co
 * Endpoint de productos: POST /products/index
 */

import { Product } from '../types';

const DROPI_PROD_BASE = 'https://api.dropi.co';

interface DropiProductResponse {
  objects?: DropiProduct[];
  data?: DropiProduct[];
  results?: DropiProduct[];
  products?: DropiProduct[];
}

interface DropiProduct {
  id: number | string;
  name?: string;
  nombre?: string;
  description?: string;
  descripcion?: string;
  price?: number;
  precio?: number;
  precio_venta?: number;
  sale_price?: number;
  cost?: number;
  costo?: number;
  precio_base?: number;
  image?: string;
  imagen?: string;
  img?: string;
  image_url?: string;
  images?: string[];
  imagenes?: string[];
  gallery?: { url: string }[];
  category?: string | { name: string };
  categoria?: string | { nombre: string };
  stock?: number;
  cantidad?: number;
  available?: boolean;
  activo?: boolean;
  active?: boolean;
  sku?: string;
  referencia?: string;
  weight?: number;
  peso?: number;
}

/**
 * Consulta los productos disponibles en la bodega de Dropi.
 * 
 * @param dropiToken - Token de integración Bearer del usuario
 * @param baseUrl - URL base de la API de Dropi (producción o test)
 * @returns Array de productos mapeados al tipo Product de la aplicación
 */
export async function fetchDropiProducts(
  dropiToken: string,
  baseUrl: string = DROPI_PROD_BASE
): Promise<Product[]> {
  const cleanBase = baseUrl.replace(/\/$/, '');

  // Intentar múltiples endpoints conocidos de Dropi
  const endpoints = [
    { url: `${cleanBase}/api/v2/products/index`, method: 'POST', body: JSON.stringify({ page: 1, per_page: 100 }) },
    { url: `${cleanBase}/api/v2/products`, method: 'GET', body: undefined },
    { url: `${cleanBase}/products/index`, method: 'POST', body: JSON.stringify({ page: 1, per_page: 100 }) },
    { url: `${cleanBase}/api/v2/product/list`, method: 'POST', body: JSON.stringify({ page: 1, per_page: 100 }) },
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${dropiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: endpoint.body,
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 401 || status === 403) {
          throw new Error('Token de Dropi inválido o expirado. Regenera tu token en el panel de Dropi.');
        }
        // Intentar siguiente endpoint si este da 404 o 405
        if (status === 404 || status === 405) continue;
        throw new Error(`Error de Dropi (${status}): ${response.statusText}`);
      }

      const data: DropiProductResponse = await response.json();
      
      // Dropi puede retornar los productos en diferentes formatos
      const rawProducts = data.objects || data.data || data.results || data.products || [];
      
      if (!Array.isArray(rawProducts) || rawProducts.length === 0) continue;

      const mappedProducts = rawProducts
        .filter(p => {
          const isActive = p.activo !== false && p.active !== false;
          return isActive;
        })
        .map((p, index) => mapDropiToProduct(p, index));

      if (mappedProducts.length > 0) {
        console.log(`[Dante Store] ✅ ${mappedProducts.length} productos cargados desde Dropi`);
        return mappedProducts;
      }
    } catch (err: any) {
      lastError = err;
      // Si es un error de autenticación, no seguir probando
      if (err.message.includes('inválido') || err.message.includes('expirado')) {
        throw err;
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error('No se encontraron productos en tu cuenta de Dropi. Verifica que tengas productos importados en tu bodega.');
}

/**
 * Mapea un producto de Dropi al tipo Product de la aplicación.
 */
function mapDropiToProduct(raw: DropiProduct, index: number): Product {
  const name = raw.name || raw.nombre || `Producto Dropi #${raw.id}`;
  const description = raw.description || raw.descripcion || 'Producto de calidad disponible con envío a toda Colombia 🇨🇴';
  
  // Precio de venta
  const price = raw.precio_venta || raw.sale_price || raw.price || raw.precio || 0;
  
  // Costo en Dropi (para calcular margen)
  const dropiCost = raw.cost || raw.costo || raw.precio_base || raw.price || raw.precio || Math.round(price * 0.4);
  
  // Precio de comparación (mayor al de venta para mostrar descuento)
  const compareAtPrice = price > dropiCost ? Math.round(price * 1.4) : undefined;
  
  // Imagen principal
  const imageUrl = extractImage(raw) || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600';
  
  // Categoría
  let category = 'Productos Dropi';
  if (typeof raw.category === 'string') category = raw.category;
  else if (raw.category && typeof raw.category === 'object' && 'name' in raw.category) category = raw.category.name;
  else if (typeof raw.categoria === 'string') category = raw.categoria;
  else if (raw.categoria && typeof raw.categoria === 'object' && 'nombre' in raw.categoria) category = raw.categoria.nombre;

  return {
    id: `dropi-${raw.id}`,
    name,
    category,
    description,
    price: Math.round(price),
    compareAtPrice,
    imageUrl,
    badge: index === 0 ? '⭐ Destacado' : undefined,
    features: [
      '✅ Producto verificado con stock en bodega Dropi',
      '🚚 Envío contra entrega a toda Colombia',
      '🔒 Pago seguro con Wompi o contra entrega',
      '📦 Despacho en 1-3 días hábiles',
    ],
    specs: {
      'ID Dropi': String(raw.id),
      'SKU': raw.sku || raw.referencia || 'N/A',
      'Stock': raw.stock !== undefined ? `${raw.stock} unidades` : (raw.cantidad !== undefined ? `${raw.cantidad} unidades` : 'Disponible'),
      'Peso': raw.weight ? `${raw.weight}g` : (raw.peso ? `${raw.peso}g` : 'Estándar'),
      'Envío': 'Nacional Colombia',
    },
    dropiCost: Math.round(dropiCost),
    rating: 4.7 + Math.random() * 0.3,
    reviewsCount: 15 + Math.floor(Math.random() * 50),
  };
}

/**
 * Extrae la URL de la imagen principal de un producto de Dropi.
 */
function extractImage(raw: DropiProduct): string | null {
  if (raw.image_url) return raw.image_url;
  if (raw.image) return raw.image;
  if (raw.imagen) return raw.imagen;
  if (raw.img) return raw.img;
  if (raw.images && raw.images.length > 0) return raw.images[0];
  if (raw.imagenes && raw.imagenes.length > 0) return raw.imagenes[0];
  if (raw.gallery && raw.gallery.length > 0) return raw.gallery[0].url;
  return null;
}
