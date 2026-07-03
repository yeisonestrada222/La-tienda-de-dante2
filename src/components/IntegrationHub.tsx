import { useState, useEffect } from 'react';
import { 
  FileCode, 
  Link, 
  Server, 
  HelpCircle, 
  Check, 
  Copy, 
  Laptop, 
  RefreshCw, 
  Calculator, 
  DollarSign, 
  Key, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  ArrowRight,
  Database
} from 'lucide-react';
import { SHOPIFY_LIQUID_CODE, DROPI_INTEGRATION_STEPS } from '../data';
import { Product } from '../types';
import { syncOrderToDropi } from '../utils/api';

interface IntegrationHubProps {
  products: Product[];
  onClose: () => void;
}

interface LocalOrder {
  id: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  city: string;
  address: string;
  indications?: string;
  items: { productName: string; quantity: number; price: number; dropiProductId: string }[];
  totalPrice: number;
  paymentMethod: 'contra_entrega' | 'wompi';
  paymentStatus: string;
  dropiSyncStatus: 'pending' | 'synced' | 'failed';
  dropiOrderId?: string;
  dropiError?: string;
  date: string;
}

export default function IntegrationHub({ products, onClose }: IntegrationHubProps) {
  const [activeTab, setActiveTab] = useState<'dropi-wompi' | 'steps' | 'cli' | 'liquid' | 'margins'>('dropi-wompi');
  const [copied, setCopied] = useState(false);
  
  // Custom margin calculations
  const [salePrices, setSalePrices] = useState<{ [key: string]: number }>(
    products.reduce((acc, p) => ({ ...acc, [p.id]: p.price }), {})
  );

  // Dropi, Wompi, Shopify & n8n Credentials
  const [dropiToken, setDropiToken] = useState('');
  const [dropiBaseUrl, setDropiBaseUrl] = useState('https://api.dropi.co');
  const [wompiPublicKey, setWompiPublicKey] = useState('');
  const [shopifyStorefrontToken, setShopifyStorefrontToken] = useState('');
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  // Product mappings
  const [productDropiIds, setProductDropiIds] = useState<{ [key: string]: string }>({});

  // Local Orders
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  
  // Load credentials and orders on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('dante_dropi_token') || '';
    const savedBaseUrl = localStorage.getItem('dante_dropi_base_url') || 'https://api.dropi.co';
    const savedWompiKey = localStorage.getItem('dante_wompi_public_key') || '';
    const savedStorefrontToken = localStorage.getItem('dante_shopify_storefront_token') || '';
    const savedN8n = localStorage.getItem('dante_n8n_webhook_url') || '';
    setDropiToken(savedToken);
    setDropiBaseUrl(savedBaseUrl);
    setWompiPublicKey(savedWompiKey);
    setShopifyStorefrontToken(savedStorefrontToken);
    setN8nWebhookUrl(savedN8n);

    const savedDropiIds = localStorage.getItem('dante_product_dropi_ids') || '{}';
    try {
      setProductDropiIds(JSON.parse(savedDropiIds));
    } catch (e) {
      setProductDropiIds({});
    }

    const savedOrdersStr = localStorage.getItem('dante_orders') || '[]';
    try {
      setOrders(JSON.parse(savedOrdersStr));
    } catch (e) {
      setOrders([]);
    }
  }, []);

  const handleSaveCredentials = () => {
    localStorage.setItem('dante_dropi_token', dropiToken.trim());
    localStorage.setItem('dante_dropi_base_url', dropiBaseUrl.trim());
    localStorage.setItem('dante_wompi_public_key', wompiPublicKey.trim());
    localStorage.setItem('dante_shopify_storefront_token', shopifyStorefrontToken.trim());
    localStorage.setItem('dante_n8n_webhook_url', n8nWebhookUrl.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    // Recargar la página para que App.tsx recargue los productos de Shopify
    if (shopifyStorefrontToken.trim()) {
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SHOPIFY_LIQUID_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePriceChange = (productId: string, val: number) => {
    setSalePrices(prev => ({ ...prev, [productId]: val }));
  };

  const handleDropiIdChange = (productId: string, val: string) => {
    const updated = { ...productDropiIds, [productId]: val };
    setProductDropiIds(updated);
    localStorage.setItem('dante_product_dropi_ids', JSON.stringify(updated));
  };

  const handleSyncWithDropi = async (orderId: string) => {
    setSyncingOrderId(orderId);
    
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      setSyncingOrderId(null);
      return;
    }

    if (!dropiToken.trim()) {
      alert("⚠️ Debes configurar tu Token API de Dropi en la pestaña de credenciales antes de sincronizar.");
      setSyncingOrderId(null);
      return;
    }

    try {
      // Execute actual API synchronization to Dropi
      const result = await syncOrderToDropi(order as any, dropiToken, dropiBaseUrl);
      
      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            dropiSyncStatus: 'synced' as const,
            dropiOrderId: result.id,
            dropiError: undefined
          };
        }
        return o;
      });
      
      localStorage.setItem('dante_orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      alert(`🎉 ¡Orden ${orderId} sincronizada con Dropi con éxito! ID de Pedido generado: ${result.id}`);
    } catch (err: any) {
      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            dropiSyncStatus: 'failed' as const,
            dropiError: err.message
          };
        }
        return o;
      });
      
      localStorage.setItem('dante_orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      alert(`❌ Error al sincronizar con Dropi:\n${err.message}`);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleClearOrders = () => {
    if (confirm("¿Seguro que deseas limpiar el historial de órdenes de prueba?")) {
      localStorage.removeItem('dante_orders');
      setOrders([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-850">
          <div>
            <h2 className="font-sans font-extrabold text-xl text-white flex items-center gap-2">
              Centro de Sincronización <span className="text-amber-500">Dropi & Wompi</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gestiona credenciales reales de Dropi y Wompi, controla el margen de tus productos y automatiza tu logística contra entrega.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Navigation */}
        <div className="flex border-b border-slate-900 bg-slate-950/40 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dropi-wompi')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dropi-wompi' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>🔑 Conectar Dropi / Wompi</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'steps' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Guía de Conexión</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cli' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Shopify CLI</span>
          </button>

          <button
            onClick={() => setActiveTab('liquid')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'liquid' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>Código Liquid (Shopify)</span>
          </button>

          <button
            onClick={() => setActiveTab('margins')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'margins' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Precios & Margen Neta</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8">
          
          {/* TAB 0: Dropi & Wompi Live Connection */}
          {activeTab === 'dropi-wompi' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* DROPI SETUP CARD */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Database className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-sm text-white">Integración con Dropi</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Dropshipping automatizado</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                      dropiToken ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 'bg-slate-950 text-slate-500'
                    }`}>
                      {dropiToken ? '🟢 Conectado' : '🔴 Desconectado'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ingresa tu token API para despachar automáticamente las órdenes registradas por contra entrega o pagadas con Wompi directamente a las bodegas de Dropi.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">API Base URL de Dropi</label>
                    <input
                      type="text"
                      value={dropiBaseUrl}
                      onChange={(e) => setDropiBaseUrl(e.target.value)}
                      placeholder="https://api.dropi.co"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[9px] text-slate-500">Por defecto: https://api.dropi.co. Útil si tu cuenta es de otro país (ej. México, Ecuador).</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Token de API Dropi (Bearer Token)</label>
                    <input
                      type="password"
                      value={dropiToken}
                      onChange={(e) => setDropiToken(e.target.value)}
                      placeholder="Pega tu token de seguridad Bearer..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[9px] text-slate-500">Consigue tu token en tu cuenta de Dropi &gt; Configuración &gt; Desarrolladores.</p>
                  </div>
                </div>

                {/* SHOPIFY STOREFRONT API CARD */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Database className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-sm text-white">2. Shopify Storefront API</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Catálogo Dinámico</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                      shopifyStorefrontToken ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 'bg-slate-950 text-slate-500'
                    }`}>
                      {shopifyStorefrontToken ? '🟢 Conectado' : '🔴 Sin Conectar'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Conecta tu tienda Shopify para que los productos importados de Dropi aparezcan automáticamente en tu catálogo. Sin este token, se mostrarán los productos de demostración.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Storefront Access Token</label>
                    <input
                      type="password"
                      value={shopifyStorefrontToken}
                      onChange={(e) => setShopifyStorefrontToken(e.target.value)}
                      placeholder="shpat_... (tu Storefront Access Token)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[9px] text-slate-500">Shopify Admin → Settings → Apps → Develop apps → Storefront API → Access Token.</p>
                  </div>
                </div>

                {/* Card 3: n8n Automations */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-sm text-white">3. Webhook de n8n (Automatizaciones)</h4>
                        <p className="text-[11px] text-slate-400">Envío instantáneo de leads y formularios de contacto</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border bg-slate-950 text-emerald-400 border-emerald-500/30">
                      {n8nWebhookUrl ? '🟢 Conectado' : '⚪ Opcional'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pega aquí la URL de producción de tu nodo Webhook en n8n. Cada vez que un cliente complete el formulario de soporte de Dante, se enviará un POST en tiempo real con sus datos para que actives bots de WhatsApp, correos o Google Sheets.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">URL del Webhook de n8n</label>
                    <input
                      type="url"
                      value={n8nWebhookUrl}
                      onChange={(e) => setN8nWebhookUrl(e.target.value)}
                      placeholder="https://n8n.tudominio.com/webhook/dante-contacto..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

              </div>

              {/* SAVE BUTTON */}
              <div className="flex items-center justify-between bg-slate-900/50 p-4 border border-slate-900 rounded-xl">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>Tus llaves se guardan de forma local e invisible en el navegador para máxima seguridad.</span>
                </div>
                
                <button
                  onClick={handleSaveCredentials}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>¡Guardado con Éxito!</span>
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4" />
                      <span>Guardar Ajustes de Sincronización</span>
                    </>
                  )}
                </button>
              </div>

              {/* LIVE ORDERS TRACKER */}
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-sans font-extrabold text-base text-white">Historial de Órdenes & Sincronización Dropi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Aquí puedes ver los pedidos realizados en la landing y enviarlos directamente a tu panel de Dropi para el despacho automático.</p>
                  </div>

                  {orders.length > 0 && (
                    <button
                      onClick={handleClearOrders}
                      className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-wider"
                    >
                      Limpiar Órdenes
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="bg-slate-900/30 border border-dashed border-slate-850 p-8 rounded-2xl text-center space-y-3">
                    <p className="text-xs text-slate-400">Aún no hay órdenes registradas en esta sesión.</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      ¡Realiza una compra de prueba desde el carrito de la tienda (eligiendo Contra Entrega o simulando Wompi) para verla reflejada aquí y testear el despacho en Dropi!
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950 overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-850">
                          <th className="p-3">ID Orden</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Productos</th>
                          <th className="p-3">Total / Pago</th>
                          <th className="p-3">Sincronización Dropi</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-white whitespace-nowrap">{o.id}</td>
                            <td className="p-3">
                              <div className="font-semibold text-white">{o.name}</div>
                              <div className="text-[10px] text-slate-400">{o.phone} • {o.city}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-slate-200 max-w-xs truncate">
                                {o.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-mono font-semibold text-white">${o.totalPrice.toLocaleString('es-CO')} COP</div>
                              <div className="mt-1 flex gap-1 items-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  o.paymentMethod === 'wompi' ? 'bg-blue-950 text-blue-400' : 'bg-slate-900 text-slate-400'
                                }`}>
                                  {o.paymentMethod === 'wompi' ? 'Wompi Online' : 'Contra Entrega'}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  o.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                                }`}>
                                  {o.paymentStatus === 'paid' ? 'Pagado' : o.paymentMethod === 'wompi' ? 'Pendiente' : 'Pendiente COD'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {o.dropiSyncStatus === 'synced' ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                                    <CheckCircle2 className="h-3 w-3" /> Enviado a Dropi
                                  </span>
                                  <div className="text-[9px] text-slate-500 font-mono">{o.dropiOrderId}</div>
                                </div>
                              ) : o.dropiSyncStatus === 'failed' ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[10px]">
                                    ⚠️ Fallido
                                  </span>
                                  <div className="text-[9px] text-red-500/80 max-w-[140px] truncate" title={o.dropiError}>
                                    {o.dropiError || 'Error de API'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono text-[10px] uppercase">🕒 Pendiente de Envío</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {o.dropiSyncStatus === 'synced' ? (
                                <span className="text-[10px] font-bold text-slate-500">Listo para despacho</span>
                              ) : (
                                <button
                                  onClick={() => handleSyncWithDropi(o.id)}
                                  disabled={syncingOrderId === o.id}
                                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-sans font-extrabold text-[9px] uppercase tracking-wider rounded transition-all disabled:opacity-50"
                                >
                                  {syncingOrderId === o.id ? 'Sincronizando...' : 'Enviar a Dropi 📦'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 1: Guía de Conexión Dropi */}
          {activeTab === 'steps' && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-400 text-xs leading-relaxed max-w-3xl">
                📢 <strong>Estrategia contra entrega (LATAM):</strong> El 80% de las ventas de dropshipping en Colombia, México y Ecuador se concretan pagando en efectivo al mensajero. La combinación de esta landing page, Shopify y el fulfillment de Dropi garantiza la máxima tasa de entrega.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DROPI_INTEGRATION_STEPS.map((step) => (
                  <div key={step.step} className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-3 relative overflow-hidden group">
                    <span className="absolute -top-1 right-2 font-mono font-extrabold text-5xl text-slate-800/40 select-none group-hover:text-amber-500/10 transition-colors">
                      0{step.step}
                    </span>
                    <h3 className="font-sans font-bold text-sm text-white flex items-center">
                      <span className="bg-amber-500 text-black rounded-full w-5 h-5 inline-flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0">
                        {step.step}
                      </span>
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Developer Tip */}
              <div className="border border-slate-900 p-4 rounded-xl bg-slate-950/60 flex items-start space-x-3 text-xs text-slate-400">
                <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Tip de Dante:</strong> Una vez conectado Dropi, habilita transportadoras confiables como Servientrega o Coordinadora. Asegura siempre realizar una llamada de confirmación de pedido por WhatsApp antes de despachar para bajar la tasa de devolución al mínimo.
                </div>
              </div>
            </div>
          )}

          {/* TAB 1.5: Shopify CLI Guide */}
          {activeTab === 'cli' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-sans font-bold text-white text-base">Despliegue Profesional con Shopify CLI 🛠️</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  El Shopify CLI (Command Line Interface) es la herramienta oficial preferida por desarrolladores para trabajar de forma ágil, segura y directa sobre temas de Shopify sin usar el navegador.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest font-bold">Flujo de Trabajo Paso a Paso</h4>
                
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start space-x-4">
                    <span className="bg-slate-950 border border-slate-800 text-amber-500 font-mono text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-sans font-bold text-xs text-white">Instalar Node.js y Shopify CLI</h5>
                      <p className="text-xs text-slate-400 leading-normal">
                        Asegúrate de tener instalado Node.js en tu computador local. Instala la herramienta oficial de Shopify globalmente ejecutando en tu terminal:
                      </p>
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs text-emerald-400 font-mono select-all">
                        npm install -g @shopify/cli @shopify/theme
                      </pre>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-4">
                    <span className="bg-slate-950 border border-slate-800 text-amber-500 font-mono text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-sans font-bold text-xs text-white">Iniciar Sesión y Vincular tu Tienda</h5>
                      <p className="text-xs text-slate-400 leading-normal">
                        Autentica tu CLI con la cuenta de Shopify Partner o administrador de tu tienda ejecutando el siguiente comando (reemplaza con tu subdominio de Shopify):
                      </p>
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs text-emerald-400 font-mono select-all">
                        shopify login --store mi-tienda-dante.myshopify.com
                      </pre>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start space-x-4">
                    <span className="bg-slate-950 border border-slate-800 text-amber-500 font-mono text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
                      3
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-sans font-bold text-xs text-white">Descargar tu Tema Actual</h5>
                      <p className="text-xs text-slate-400 leading-normal">
                        Crea una carpeta en tu computador llamada <code className="text-amber-500 bg-slate-950 px-1 py-0.5 rounded font-mono">tema-dante</code>, navega dentro de ella en la terminal, y descarga los archivos de tu tienda:
                      </p>
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs text-emerald-400 font-mono">
                        cd tema-dante{"\n"}
                        shopify theme pull
                      </pre>
                      <p className="text-[10px] text-slate-500">
                        * El CLI te preguntará cuál de tus temas activos o borradores deseas clonar localmente.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start space-x-4">
                    <span className="bg-slate-950 border border-slate-800 text-amber-500 font-mono text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
                      4
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-sans font-bold text-xs text-white">Crear la Sección Dante en tu Local</h5>
                      <p className="text-xs text-slate-400 leading-normal">
                        Abre la carpeta del tema con tu editor favorito (como VS Code). Dentro de la carpeta <code className="text-amber-500 bg-slate-950 px-1 py-0.5 rounded font-mono">sections/</code>, crea un archivo llamado <code className="text-white bg-slate-950 px-1.5 py-0.5 rounded font-mono font-semibold">dante-product-hero.liquid</code> y pega todo el código provisto en la pestaña <strong>Código Liquid</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start space-x-4">
                    <span className="bg-slate-950 border border-slate-800 text-amber-500 font-mono text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
                      5
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-sans font-bold text-xs text-white">Previsualizar Cambios en Vivo Localmente</h5>
                      <p className="text-xs text-slate-400 leading-normal">
                        Inicia el servidor local de desarrollo de Shopify para probar la sección en tu tienda sin afectar a tus clientes reales:
                      </p>
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs text-emerald-400 font-mono">
                        shopify theme dev
                      </pre>
                      <p className="text-[10px] text-slate-500">
                        El CLI te entregará una URL secreta de previsualización para abrir en el navegador. Podrás ir al editor de temas y añadir la sección "Dante Product Hero" en vivo.
                      </p>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="flex items-start space-x-4">
                    <span className="bg-slate-950 border border-slate-800 text-amber-500 font-mono text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
                      6
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <h5 className="font-sans font-bold text-xs text-white">Subir Cambios y Publicar</h5>
                      <p className="text-xs text-slate-400 leading-normal">
                        Cuando estés feliz con el resultado, sube los cambios para guardarlos permanentemente en la biblioteca de temas de tu tienda en la nube:
                      </p>
                      <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs text-emerald-400 font-mono">
                        shopify theme push
                      </pre>
                    </div>
                  </div>

                </div>
              </div>

              {/* Pro-Tips Callout */}
              <div className="border border-slate-900 p-4 rounded-xl bg-slate-950/60 flex items-start space-x-3 text-xs text-slate-400">
                <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Tip de Arquitectura Shopify:</strong> Trabajar con Shopify CLI evita perder código por errores en el navegador, te permite usar sistemas de control de versiones como Git, e integra de forma nativa tu desarrollo local con la biblioteca de temas de Shopify en un flujo continuo y profesional.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Liquid Code Export */}
          {activeTab === 'liquid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-white text-base">Sección Personalizada Dante Product Hero</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copia y pega este código Liquid en tu tema de Shopify para crear secciones con diseño de Dante Store.
                  </p>
                </div>
                
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre Container */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-[10px] font-mono text-slate-500">
                  <span>dante-product-hero.liquid</span>
                  <span>HTML / LIQUID / SCHEMA</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed max-h-80 overflow-y-auto">
                  <code>{SHOPIFY_LIQUID_CODE}</code>
                </pre>
              </div>

              {/* Steps to insert Code */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-xs text-slate-300">
                <h4 className="font-sans font-bold text-white uppercase tracking-wider text-[11px]">¿Cómo subir este diseño a Shopify?</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 leading-relaxed">
                  <li>Ingresa a tu administrador de Shopify, ve a <strong>Tienda Online &gt; Temas</strong>.</li>
                  <li>Haz clic en el botón de los tres puntos junto a tu tema activo y selecciona <strong>Editar código</strong>.</li>
                  <li>En el menú de la izquierda, ve a la carpeta <strong>Secciones</strong> y haz clic en <strong>Agregar una nueva sección</strong>.</li>
                  <li>Nómbrala exactamente <code className="text-amber-500 bg-slate-900 px-1 py-0.5 rounded font-mono">dante-product-hero</code> y haz clic en crear.</li>
                  <li>Reemplaza todo el contenido predeterminado con el código copiado arriba y haz clic en <strong>Guardar</strong>.</li>
                  <li>¡Listo! Ve al personalizador visual de tu tema y ya puedes arrastrar la sección "Dante Product Hero" en cualquier página.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Profit Margins calculation */}
          {activeTab === 'margins' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-sans font-bold text-white text-base">Planificador de Precios y Rentabilidad</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Establece el precio de tus campañas en Shopify basándote en el costo del inventario de Dropi.
                </p>
              </div>

              <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950 text-xs font-sans">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 bg-slate-900 p-3.5 font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  <div className="col-span-3">Producto Dante</div>
                  <div className="col-span-2 text-right">Costo Dropi</div>
                  <div className="col-span-3 text-center">Precio de Venta</div>
                  <div className="col-span-2 text-center">ID Producto Dropi</div>
                  <div className="col-span-2 text-right">Ganancia Neta</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-900">
                  {products.map((p) => {
                    const priceVal = salePrices[p.id] || p.price;
                    const profit = priceVal - p.dropiCost;
                    const marginPercent = ((profit / priceVal) * 100).toFixed(0);
                    const dropiIdVal = productDropiIds[p.id] || '';

                    return (
                      <div key={p.id} className="grid grid-cols-12 gap-2 p-3.5 items-center">
                        <div className="col-span-3 flex items-center space-x-3">
                          <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                          <span className="font-semibold text-white truncate">{p.name}</span>
                        </div>
                        
                        <div className="col-span-2 text-right text-slate-400 font-mono">
                          ${p.dropiCost.toLocaleString('es-CO')}
                        </div>

                        <div className="col-span-3 text-center px-4">
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-slate-500 font-mono">$</span>
                            <input
                              type="number"
                              value={priceVal || ''}
                              onChange={(e) => handlePriceChange(p.id, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg pl-6 pr-3 py-1.5 text-center text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="col-span-2 text-center px-1">
                          <input
                            type="text"
                            value={dropiIdVal}
                            onChange={(e) => handleDropiIdChange(p.id, e.target.value)}
                            placeholder="Ej. 10001"
                            className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2 py-1.5 text-center text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="col-span-2 text-right">
                          <span className="font-bold text-emerald-400 font-mono text-sm block">
                            +${profit.toLocaleString('es-CO')} COP
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono uppercase block">
                            Retorno: {marginPercent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary stats */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center sm:text-left">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Promedio de Margen LATAM</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">55% - 68% Nivel Óptimo</span>
                </div>
                <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-6 pt-3 sm:pt-0">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Costo de Envío Promedio (Dropi)</span>
                  <span className="text-xl font-extrabold text-amber-500 mt-1 block">$13,000 COP</span>
                </div>
                <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-6 pt-3 sm:pt-0">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Estrategia Contra Entrega</span>
                  <span className="text-xl font-extrabold text-emerald-400 mt-1 block">¡Altísima Conversión!</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
