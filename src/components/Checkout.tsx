import { useState, FormEvent } from 'react';
import { Product } from '../types';
import { X, Truck, CheckCircle2, ShieldCheck, PhoneCall } from 'lucide-react';
import { syncOrderToDropi } from '../utils/api';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { product: Product; quantity: number }[];
  singleProduct: Product | null;
  onClearCart: () => void;
  onNewOrderAlert?: (name: string, city: string, productName: string) => void;
}

export default function Checkout({
  isOpen,
  onClose,
  cart,
  singleProduct,
  onClearCart,
  onNewOrderAlert
}: CheckoutProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Bogotá D.C.');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [indications, setIndications] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [dropiId, setDropiId] = useState('');

  const itemsToCheckout = singleProduct 
    ? [{ product: singleProduct, quantity: 1 }]
    : cart;

  const subtotal = itemsToCheckout.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingCost = 20000;
  const totalPrice = subtotal + shippingCost;

  const handleConfirmOrder = async (e: FormEvent) => {
    e.preventDefault();
    // Bug #4: validación de celular colombiano (10 dígitos, empieza en 3)
    const phoneClean = phone.replace(/\s/g, '');
    if (!name.trim()) { alert('Por favor ingresa tu nombre completo.'); return; }
    if (!/^3\d{9}$/.test(phoneClean)) { alert('Ingresa un celular colombiano válido (10 dígitos, ej: 3001234567).'); return; }
    if (!city.trim()) { alert('Por favor ingresa tu ciudad.'); return; }
    if (address.trim().length < 6) { alert('Por favor ingresa una dirección completa (mínimo 6 caracteres).'); return; }

    const randomId = `DNT-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(randomId);

    const dropiToken = localStorage.getItem('dante_dropi_token') || '';
    const dropiBaseUrl = localStorage.getItem('dante_dropi_base_url') || 'https://api.dropi.co';

    // Bug #3: incluir dropiProductId real para que Dropi no reciba id=0
    const items = itemsToCheckout.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      dropiProductId: item.product.id.startsWith('dropi-')
        ? item.product.id.replace('dropi-', '')
        : (item.product as any).dropiId || item.product.id
    }));

    const newOrder = {
      id: randomId,
      customerName: name,
      phone,
      email: 'servicioalcliente@latiendadedante.com',
      department,
      city,
      address,
      indications,
      items,
      totalPrice,
      paymentMethod: 'contra_entrega',
      paymentStatus: 'pending_cod',
      dropiSyncStatus: 'pending',
      date: new Date().toISOString()
    };

    // Auto-sync with Dropi if a token is present
    if (dropiToken.trim()) {
      setIsSyncing(true);
      setSyncError(null);
      setSyncSuccess(false);
      try {
        const result = await syncOrderToDropi(newOrder, dropiToken, dropiBaseUrl);
        newOrder.dropiSyncStatus = 'synced';
        newOrder.dropiOrderId = result.id;
        setDropiId(result.id);
        setSyncSuccess(true);
      } catch (err: any) {
        newOrder.dropiSyncStatus = 'failed';
        newOrder.dropiError = err.message;
        setSyncError(err.message);
      } finally {
        setIsSyncing(false);
      }
    }

    const existingOrdersStr = localStorage.getItem('dante_orders') || '[]';
    let existingOrders = [];
    try {
      existingOrders = JSON.parse(existingOrdersStr);
    } catch (err) {
      existingOrders = [];
    }
    existingOrders.unshift(newOrder);
    localStorage.setItem('dante_orders', JSON.stringify(existingOrders));

    setIsSuccess(true);

    if (onNewOrderAlert) {
      const itemsNames = itemsToCheckout.map(item => `${item.product.name} (x${item.quantity})`).join(' + ');
      onNewOrderAlert(name, city, itemsNames);
    }
  };

  const handleFinish = () => {
    onClearCart();
    onClose();
  };

  // Bug #5: Lista completa de los 32 departamentos de Colombia + Bogotá D.C.
  const departments = [
    'Bogotá D.C.', 'Amazonas', 'Antioquia', 'Arauca', 'Atlántico',
    'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca',
    'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
    'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
    'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
    'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
    'Valle del Cauca', 'Vaupés', 'Vichada'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border-l border-slate-800 w-full max-w-lg h-full max-h-screen overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col justify-between animate-slideLeft">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5 mb-5">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-amber-500" />
            <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider text-white">
              Formulario Contra Entrega
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8">
            <div className="p-4 rounded-full animate-bounce bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-16 w-16" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase font-bold border px-3 py-1 rounded-md text-emerald-400 bg-emerald-950/40 border-emerald-900/30">
                ¡Pedido Contra Entrega Registrado!
              </span>
              <h4 className="font-sans font-extrabold text-2xl text-white mt-4">
                ID de Orden: {orderId}
              </h4>
              
              {isSyncing ? (
                <p className="text-amber-400 text-xs mt-3 max-w-sm mx-auto leading-relaxed flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                  <span>Sincronizando automáticamente con nuestro <strong>centro de despacho</strong>...</span>
                </p>
              ) : syncSuccess ? (
                <div className="space-y-1 mt-2 max-w-sm mx-auto">
                  <p className="text-emerald-400 text-xs font-bold">
                    ¡Orden #{dropiId} lista para despacho! 🎉
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    Hola <strong>{name}</strong>, prepararemos tu envío hoy mismo. Pagas al recibir en tu domicilio.
                  </p>
                </div>
              ) : (
                <p className="text-slate-300 text-xs mt-2 max-w-sm mx-auto">
                  ¡Hola <strong>{name}</strong>! Hemos registrado tu pedido. Pagas al recibir en casa.
                </p>
              )}
            </div>

            {/* VIP RECOMPRA COUPON */}
            <div className="p-4 bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-2xl w-full max-w-sm mx-auto text-center space-y-1.5">
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-extrabold block">
                🎁 Regalo para Recompra VIP
              </span>
              <h4 className="text-white font-bold text-xs">¡15% OFF en tu próxima compra!</h4>
              <div className="inline-block px-4 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg font-mono text-amber-400 font-extrabold tracking-widest text-base select-all">
                DANTE15
              </div>
              <p className="text-[9px] text-slate-400">Guarda este código para usarlo en cualquier producto.</p>
            </div>

            {/* Express WhatsApp Confirmation */}
            <a
              href={`https://wa.me/573108245540?text=Hola%20Tienda%20de%20Dante,%20confirmo%20mi%20pedido%20%23${orderId}%20de%20$%20${totalPrice.toLocaleString('es-CO')}%20COP%20para%20despacho`}
              target="_blank"
              rel="noreferrer"
              className="w-full max-w-sm mx-auto py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 transition-all text-center shadow-lg shadow-emerald-500/20 block"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Confirmar por WhatsApp</span>
            </a>

            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800 cursor-pointer"
            >
              Cerrar y seguir viendo
            </button>
          </div>
        ) : (
          /* Fast Form State */
          <div className="flex-1 flex flex-col justify-between">
            <form onSubmit={handleConfirmOrder} className="space-y-3.5">
              
              {/* Concise Summary */}
              <div className="bg-slate-900/60 p-3.5 border border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                  <span>Envío + Gestión (Con Recaudo):</span>
                  <span className="text-amber-400 font-mono">+${shippingCost.toLocaleString('es-CO')}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold text-amber-400">
                  <span>Total a Pagar en Casa:</span>
                  <span className="font-mono">${totalPrice.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu Nombre y Apellido *"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Tu Celular / WhatsApp *"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad / Municipio *"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección Exacta (Calle, Apto, Barrio) *"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={itemsToCheckout.length === 0}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
              >
                <span>Pedir Contra Entrega Ahora 🚀</span>
              </button>
              <p className="text-center text-[10px] text-slate-500">
                Sin pagos anticipados. Pagas en efectivo al recibir.
              </p>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
