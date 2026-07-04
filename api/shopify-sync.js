export default async function handler(req, res) {
  // Configurar headers de CORS por si acaso (aunque la app de React y esta API comparten el mismo dominio en Vercel)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Shopify-Token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { order, shopifyDomain, adminToken } = req.body;

    if (!shopifyDomain || !adminToken) {
      return res.status(400).json({ error: 'Faltan credenciales de Shopify Admin.' });
    }

    // Formatear el pedido para Shopify REST Admin API
    const shopifyOrderPayload = {
      order: {
        email: order.email || "cliente@latiendadedante.com",
        phone: order.phone,
        financial_status: "pending", // Porque es pago contra entrega
        tags: "Dante Store, Pago Contra Entrega",
        note: `Pedido Contra Entrega\nDocumento: ${order.document || 'N/A'}\nNotas: ${order.notes || 'Ninguna'}`,
        line_items: order.items.map(item => ({
          title: item.name || item,
          price: item.price || 0,
          quantity: item.quantity || 1
        })),
        customer: {
          first_name: order.name,
          email: order.email,
          phone: order.phone
        },
        shipping_address: {
          first_name: order.name,
          address1: order.address,
          phone: order.phone,
          city: order.city,
          province: order.department,
          country: "Colombia"
        }
      }
    };

    // La URL de Shopify Admin API
    const cleanDomain = shopifyDomain.replace('https://', '').replace('http://', '').replace(/\/$/, '');
    const apiUrl = `https://${cleanDomain}/admin/api/2024-01/orders.json`;

    console.log('[Shopify Sync] Enviando pedido a:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken
      },
      body: JSON.stringify(shopifyOrderPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Shopify Sync] Error de Shopify:', data);
      return res.status(response.status).json({ error: 'Shopify rechazó el pedido', details: data });
    }

    return res.status(200).json({ success: true, shopifyOrder: data.order });
  } catch (error) {
    console.error('[Shopify Sync] Error interno:', error);
    return res.status(500).json({ error: 'Fallo interno del servidor Vercel', details: error.message });
  }
}
