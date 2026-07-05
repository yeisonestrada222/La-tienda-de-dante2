/**
 * Utilitarios de API para las integraciones de Wompi y Dropi.
 * Se ejecutan en el cliente (navegador) y usan los tokens guardados localmente.
 */

// --- WOMPI API ---

interface WompiTransactionResponse {
  data: {
    id: string;
    status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
    reference: string;
    amount_in_cents: number;
    currency: string;
    payment_method_type: string;
    status_message?: string;
  };
}

/**
 * Consulta el estado de una transacción directamente en Wompi usando la llave pública.
 */
export async function verifyWompiTransaction(
  transactionId: string,
  publicKey: string
): Promise<WompiTransactionResponse['data']> {
  const isProd = publicKey.startsWith('pub_prod_');
  const baseUrl = isProd 
    ? 'https://production.wompi.co/v1' 
    : 'https://sandbox.wompi.co/v1';

  const response = await fetch(`${baseUrl}/transactions/${transactionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${publicKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.reason || `Error consultando transacción Wompi: ${response.statusText}`
    );
  }

  const result: WompiTransactionResponse = await response.json();
  return result.data;
}

// --- DROPI API ---

interface DropiSyncOrder {
  id: string;
  name: string;
  phone: string;
  email?: string;
  department: string;
  city: string;
  address: string;
  indications?: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    dropiProductId: string; // ID real en la bodega de Dropi
  }[];
  totalPrice: number;
  paymentMethod: 'contra_entrega' | 'wompi';
}

interface DropiSyncResponse {
  success: boolean;
  message?: string;
  data?: {
    id?: string;
    order_id?: string;
    tracking_number?: string;
    guide?: string;
  };
}

/**
 * Envía los detalles de un pedido a Dropi mediante su API de integraciones.
 */
export async function syncOrderToDropi(
  order: DropiSyncOrder,
  dropiToken: string,
  dropiBaseUrl: string = 'https://api.dropi.co'
): Promise<NonNullable<DropiSyncResponse['data']>> {
  const cleanBaseUrl = dropiBaseUrl.replace(/\/$/, ''); // Quitar barra final si existe
  
  // Endpoint estándar de Dropi para creación de órdenes por integración
  const url = `${cleanBaseUrl}/api/v2/orders`;

  const payload = {
    shop_order_id: order.id,
    EnvioConCobro: order.paymentMethod === 'contra_entrega',
    amount: order.totalPrice,
    datos_cliente: {
      nombre: order.name,
      direccion: order.address,
      telefono: order.phone,
      correo: order.email || 'servicioalcliente@latiendadedante.com',
      departamento: order.department,
      ciudad: order.city,
      barrio: order.indications || ''
    },
    productos: order.items
      .filter(item => parseInt(item.dropiProductId, 10) > 0)
      .map(item => ({
        id: parseInt(item.dropiProductId, 10),
        cantidad: item.quantity,
        precio_venta: item.price
      }))
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${dropiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.message || errorData?.error || `Error en la API de Dropi: ${response.statusText}`
    );
  }

  const result = await response.json();
  
  // Dropi suele retornar un objeto indicando éxito o fallas lógicas
  if (result.success === false) {
    throw new Error(result.message || 'La API de Dropi rechazó el pedido por un error de validación.');
  }

  return {
    id: result.data?.id || result.id || `DRP-${Math.floor(100000 + Math.random() * 900000)}`,
    tracking_number: result.data?.tracking_number || result.tracking_number || '',
    guide: result.data?.guide || result.guide || ''
  };
}

/**
 * Envia el pedido al CRM central (Shopify Admin API vía Vercel Backend)
 * Esto evade el bloqueo de CORS y crea el pedido directamente en tu Shopify.
 */
export async function syncOrderToCRM(order: any): Promise<void> {
  // FIX #2: adminToken NO se envía desde el cliente. El backend lo lee de process.env.SHOPIFY_ADMIN_TOKEN.
  // Solo se envía el dominio (dato no sensible) para que el backend sepa a qué tienda apuntar.
  const shopifyDomain = localStorage.getItem('dante_shopify_domain') || import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || '';

  if (!shopifyDomain) {
    return; // No Shopify CRM configured
  }

  try {
    // SEGURIDAD: payload sin adminToken — el backend usa process.env.SHOPIFY_ADMIN_TOKEN
    const payload = {
      order,
      shopifyDomain,
    };

    // Llamamos a nuestro propio backend Serverless alojado en Vercel
    const response = await fetch('/api/shopify-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('[CRM Sync] Error al crear pedido en Shopify:', errorData);
    } else {
      console.log('[CRM Sync] ✅ Pedido creado en Shopify Admin exitosamente.');
    }
  } catch (err) {
    console.error('[CRM Sync] Fallo de red al contactar Vercel Backend:', err);
  }
}
