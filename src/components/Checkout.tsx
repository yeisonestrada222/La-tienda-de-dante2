import { useState, FormEvent } from 'react';
import { Product } from '../types';
import { X, Truck, CheckCircle2, ShieldCheck, PhoneCall } from 'lucide-react';
import { syncOrderToDropi, syncOrderToCRM } from '../utils/api';
import { trackInitiateCheckout, trackPurchase } from '../utils/tracking';
import { colombiaDepartments, colombiaLocations } from '../utils/colombiaLocations';

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
  const [email, setEmail] = useState('');  // OPT #2: captura email real del comprador
  const [department, setDepartment] = useState(colombiaDepartments[0]);
  const [city, setCity] = useState(colombiaLocations[colombiaDepartments[0]][0]);
  const [address, setAddress] = useState('');
  const [indications, setIndications] = useState('');

  // CRO Opt 3: Order Bump
  const [addOrderBump, setAddOrderBump] = useState(false);
  const orderBumpPrice = 12900;

  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [personalCoupon, setPersonalCoupon] = useState('DANTE15');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [dropiId, setDropiId] = useState('');

  const itemsToCheckout = singleProduct 
    ? [{ product: singleProduct, quantity: 1 }]
    : cart;

  const subtotal = itemsToCheckout.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  // Envío siempre gratis según solicitud
  const shippingCost = 0;
  const baseTotalPrice = subtotal + shippingCost;
  const totalPrice = baseTotalPrice + (addOrderBump ? orderBumpPrice : 0);

  // OPT #6: Cupón personalizado único por cliente (sin backend)
  const generatePersonalCoupon = (customerName: string, oId: string): string => {
    const prefix = customerName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const suffix = oId.replace('DNT-', '').substring(0, 3);
    return `DANTE${prefix}${suffix}`;
  };

  const handleConfirmOrder = async (e: FormEvent) => {
    e.preventDefault();
    // Bug #4: validación de celular colombiano (10 dígitos, empieza en 3)
    const phoneClean = phone.replace(/\s/g, '');
    if (!name.trim()) { alert('Por favor ingresa tu nombre completo.'); return; }
    if (!/^3\d{9}$/.test(phoneClean)) { alert('Ingresa un celular colombiano válido (10 dígitos, ej: 3001234567).'); return; }
    if (!city.trim()) { alert('Por favor ingresa tu ciudad.'); return; }
    if (address.trim().length < 6) { alert('Por favor ingresa una dirección completa (mínimo 6 caracteres).'); return; }

    // OPT #3: Evento de tracking al iniciar checkout
    trackInitiateCheckout(totalPrice, itemsToCheckout.length);

    setIsSubmitting(true);

    try {
      const randomId = `DNT-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(randomId);
      const coupon = generatePersonalCoupon(name, randomId);
      setPersonalCoupon(coupon);

    // FIX #3: tokens sensibles en sessionStorage
    const dropiToken = sessionStorage.getItem('dante_dropi_token') || '';
    const dropiBaseUrl = sessionStorage.getItem('dante_dropi_base_url') || 'https://api.dropi.co';

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
    
    if (addOrderBump) {
      items.push({
        id: 'bump-001',
        name: 'Seguro de Envío Prioritario VIP',
        price: orderBumpPrice,
        quantity: 1,
        dropiProductId: ''
      });
    }

    const newOrder: any = {
      id: randomId,
      name,
      phone: phoneClean,
      email: email.trim() || 'cliente@latiendadedante.com', // OPT #2
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

    // OPT #3: Evento Purchase para Meta y TikTok
    trackPurchase(randomId, totalPrice, items.map(i => ({ id: i.id, name: i.name })));

    // OPT #6: Disparar webhook n8n para CRM
    await syncOrderToCRM(newOrder);

    setIsSuccess(true);

      if (onNewOrderAlert) {
        const itemsNames = itemsToCheckout.map(item => `${item.product.name} (x${item.quantity})`).join(' + ');
        onNewOrderAlert(name, city, itemsNames);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onClearCart();
    onClose();
  };

  // Se obtienen los departamentos desde colombiaLocations.ts

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

            {/* OPT #6: Cupón personalizado con fecha de expiración */}
            <div className="p-4 bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-2xl w-full max-w-sm mx-auto text-center space-y-1.5">
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-extrabold block">
                🎁 Tu Cupón Personal — Válido 30 días
              </span>
              <h4 className="text-white font-bold text-xs">¡15% OFF en tu próxima compra!</h4>
              <div className="inline-block px-4 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg font-mono text-amber-400 font-extrabold tracking-widest text-base select-all">
                {personalCoupon}
              </div>
              <p className="text-[9px] text-slate-400">
                Expira: {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('es-CO')} · Solo para ti 🐾
              </p>
            </div>

            {/* Express WhatsApp Confirmation — OPT #6: mensaje pre-llenado */}
            <a
              href={`https://wa.me/573108245540?text=Hola%20Tienda%20de%20Dante%2C%20confirmo%20mi%20pedido%20%23${orderId}.%20Soy%20${encodeURIComponent(name)}%20en%20${encodeURIComponent(address)}%2C%20${encodeURIComponent(city)}.%20Total%3A%20%24${totalPrice.toLocaleString('es-CO')}%20COP`}
              target="_blank"
              rel="noreferrer"
              className="w-full max-w-sm mx-auto py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 transition-all text-center shadow-lg shadow-emerald-500/20"
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
                  <span className="text-emerald-400 font-bold font-mono">GRATIS</span>
                </div>
                {addOrderBump && (
                  <div className="flex justify-between items-center text-[11px] text-amber-500 font-bold">
                    <span>Seguro VIP Priority:</span>
                    <span className="font-mono">+${orderBumpPrice.toLocaleString('es-CO')}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold text-amber-400">
                  <span>Total a Pagar en Casa:</span>
                  <span className="font-mono">${totalPrice.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              {/* CRO Opt 3: Order Bump Checkbox */}
              <div 
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer mb-4 flex items-start space-x-3 ${addOrderBump ? 'bg-amber-500/10 border-amber-500' : 'bg-slate-900 border-slate-800 border-dashed hover:border-amber-500/50'}`} 
                onClick={() => setAddOrderBump(!addOrderBump)}
              >
                <input type="checkbox" checked={addOrderBump} readOnly className="mt-1 w-4 h-4 accent-amber-500 pointer-events-none" />
                <div>
                  <p className="text-[11px] text-white font-bold leading-tight flex items-center space-x-1.5">
                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">OFERTA ÚNICA</span>
                    <span>Seguro de Envío Prioritario VIP</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                    Garantiza que tu pedido se prepare de primero, se envíe con trato especial hoy mismo y tenga cobertura total contra daños en el trayecto. <strong>(+${orderBumpPrice.toLocaleString('es-CO')})</strong>
                  </p>
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
                    placeholder="Tu Celular / WhatsApp (ej: 3001234567) *"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* OPT #2: Campo de email para retención y remarketing */}
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu Email — Opcional (recibe tu cupón 🎁)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setDepartment(newDept);
                      setCity(colombiaLocations[newDept][0]);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  >
                    {colombiaDepartments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <select
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  >
                    {colombiaLocations[department]?.map((mun) => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
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

              {/* CRO Opt 2: Guarantee Trust Badge */}
              <div className="flex items-start space-x-3 bg-emerald-900/20 p-3.5 rounded-xl border border-emerald-500/30 mb-3">
                <ShieldCheck className="text-emerald-500 h-6 w-6 flex-shrink-0" />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-emerald-400 block mb-0.5">Garantía Incondicional de Dante:</strong>
                  Si a tu mascota no le encanta, te devolvemos tu dinero en 30 días, sin preguntas ni complicaciones.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={itemsToCheckout.length === 0 || isSubmitting}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
              >
                <span>{isSubmitting ? 'Procesando...' : 'Pedir Contra Entrega Ahora 🚀'}</span>
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
