import { useState, FormEvent } from 'react';
import { Product } from '../types';
import { ShoppingBag, Truck, CheckCircle2, ShieldCheck, X, PhoneCall, CreditCard, DollarSign, ExternalLink } from 'lucide-react';
import { syncOrderToDropi } from '../utils/api';

interface CheckoutProps {
  cart: { product: Product; quantity: number }[];
  singleProduct: Product | null;
  onClose: () => void;
  onClearCart: () => void;
  onNewOrderAlert?: (name: string, city: string, productName: string) => void;
}

export default function Checkout({ cart, singleProduct, onClose, onClearCart, onNewOrderAlert }: CheckoutProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Bogotá D.C.');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [indications, setIndications] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'contra_entrega' | 'wompi'>('contra_entrega');

  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [wompiUrl, setWompiUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [dropiId, setDropiId] = useState('');

  const itemsToCheckout = singleProduct 
    ? [{ product: singleProduct, quantity: 1 }]
    : cart;

  const subtotal = itemsToCheckout.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingCost = paymentMethod === 'wompi' ? 12000 : 15000;
  const totalPrice = subtotal + shippingCost;

  const handleConfirmOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim() || !address.trim()) return;

    const randomId = `DNT-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(randomId);

    // Get Dropi credentials and mappings from localStorage
    const dropiToken = localStorage.getItem('dante_dropi_token') || '';
    const dropiBaseUrl = localStorage.getItem('dante_dropi_base_url') || 'https://api.dropi.co';
    const mappingsStr = localStorage.getItem('dante_product_dropi_ids') || '{}';
    let mappings: any = {};
    try {
      mappings = JSON.parse(mappingsStr);
    } catch (err) {
      mappings = {};
    }

    const items = itemsToCheckout.map(item => {
      const defaultIds: Record<string, string> = {
        'dante-01': '10001',
        'dante-02': '10002',
        'dante-03': '10003',
        'dante-04': '10004',
        'dante-05': '10005',
      };
      const dropiProductId = mappings[item.product.id] || defaultIds[item.product.id] || '10000';
      return {
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        dropiProductId
      };
    });

    const newOrder: any = {
      id: randomId,
      name,
      phone,
      email: email || 'servicioalcliente@latiendadedante.com',
      department,
      city,
      address,
      indications,
      items,
      totalPrice,
      paymentMethod,
      paymentStatus: paymentMethod === 'wompi' ? 'pending' : 'pending_cod',
      dropiSyncStatus: 'pending',
      date: new Date().toISOString()
    };

    // Auto-sync with Dropi if it is Cash on Delivery and a token is present
    if (paymentMethod === 'contra_entrega' && dropiToken.trim()) {
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

    // Construct Wompi link if Wompi is selected
    if (paymentMethod === 'wompi') {
      const wompiKey = localStorage.getItem('dante_wompi_public_key') || 'pub_test_Q5YvY248sEtgZpGSu7Q16vI7I9c6O848';
      const amountInCents = totalPrice * 100;
      const ref = randomId;
      const redirectUrl = encodeURIComponent(`${window.location.origin}?wompi_success=true&order_id=${ref}`);
      const link = `https://checkout.wompi.co/p/?public-key=${wompiKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${ref}&redirect-url=${redirectUrl}`;
      setWompiUrl(link);
    }

    setIsSuccess(true);

    if (onNewOrderAlert) {
      const itemsNames = itemsToCheckout.map(item => `${item.product.name} (x${item.quantity})`).join(' + ');
      onNewOrderAlert(name, city, itemsNames);
    }
  };

  const handleSimulateWompiPayment = () => {
    const existingOrdersStr = localStorage.getItem('dante_orders') || '[]';
    try {
      const existing = JSON.parse(existingOrdersStr);
      const updated = existing.map((o: any) => {
        if (o.id === orderId) {
          return { ...o, paymentStatus: 'paid' };
        }
        return o;
      });
      localStorage.setItem('dante_orders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    alert("¡Simulación de Pago Wompi Exitosa! Tu orden ha sido marcada como 'Pagada' y está lista para despacho en el panel.");
    handleFinish();
  };

  const handleFinish = () => {
    onClearCart();
    onClose();
  };

  const departments = [
    'Bogotá D.C.', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Cundinamarca', 
    'Santander', 'Bolívar', 'Caldas', 'Risaralda', 'Tolima', 'Norte de Santander'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border-l border-slate-800 w-full max-w-lg h-full max-h-screen overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col justify-between animate-slideLeft">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5 mb-5">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-amber-500" />
            <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider text-white">
              {paymentMethod === 'wompi' ? 'Pago Seguro Online' : 'Formulario Contra Entrega'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8">
            <div className={`p-4 rounded-full animate-bounce ${paymentMethod === 'wompi' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {paymentMethod === 'wompi' ? <CreditCard className="h-16 w-16" /> : <CheckCircle2 className="h-16 w-16" />}
            </div>

            <div>
              <span className={`text-[10px] font-mono uppercase font-bold border px-3 py-1 rounded-md ${
                paymentMethod === 'wompi' 
                  ? 'text-amber-400 bg-amber-950/40 border-amber-900/30' 
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'
              }`}>
                {paymentMethod === 'wompi' ? 'Pendiente de Pago Online' : '¡Pedido Contra Entrega Registrado!'}
              </span>
              <h4 className="font-sans font-extrabold text-2xl text-white mt-4">
                ID de Orden: {orderId}
              </h4>
              
              {paymentMethod === 'wompi' ? (
                <p className="text-slate-400 text-xs mt-3 max-w-sm mx-auto leading-relaxed">
                  ¡Hola <strong>{name}</strong>! Hemos registrado tus datos de envío. Para completar tu pago de forma 100% segura mediante Nequi, PSE o tarjeta, presiona el botón de Wompi oficial abajo.
                </p>
              ) : isSyncing ? (
                <p className="text-amber-400 text-xs mt-3 max-w-sm mx-auto leading-relaxed flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                  Sincronizando automáticamente con nuestro <strong>centro de despacho</strong>...
                </p>
              ) : syncSuccess ? (
                <div className="space-y-1 mt-3 max-w-sm mx-auto">
                  <p className="text-emerald-400 text-xs font-bold leading-relaxed">
                    ¡Orden registrada con éxito para despacho! 🎉
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Hola <strong>{name}</strong>, tu orden ha sido confirmada. ID de Guía: <strong className="text-slate-200 font-mono">{dropiId}</strong>. Tu pedido ya está asignado en bodega para empaque inmediato.
                  </p>
                </div>
              ) : syncError ? (
                <div className="space-y-1 mt-3 max-w-sm mx-auto">
                  <p className="text-amber-400 text-xs font-bold leading-relaxed">
                    ¡Pedido Guardado con Éxito! 🐾
                  </p>
                  <p className="text-slate-450 text-[11px] leading-relaxed">
                    Tu pedido fue registrado en el sistema. Un asesor de La Tienda de Dante te contactará si requiere confirmar datos adicionales.
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-xs mt-3 max-w-sm mx-auto leading-relaxed">
                  ¡Hola <strong>{name}</strong>! Hemos registrado tu pedido de forma correcta. En breve procederemos con la preparación y envío a tu domicilio.
                </p>
              )}
            </div>

            {/* Wompi CTA or WhatsApp Confirmation block */}
            {paymentMethod === 'wompi' ? (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm space-y-4">
                <div className="flex items-center justify-center space-x-1 text-xs text-amber-500 font-bold uppercase">
                  <CreditCard className="h-4 w-4" />
                  <span>Pasarela Oficial Wompi</span>
                </div>
                
                <a
                  href={wompiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center space-x-2 transition-all text-center cursor-pointer shadow-lg"
                >
                  <span>Pagar con Wompi Oficial</span>
                  <ExternalLink className="h-4 w-4" />
                </a>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-slate-500 text-[10px] font-mono uppercase">O prueba local</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  onClick={handleSimulateWompiPayment}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-amber-400 font-sans font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                >
                  ⚡ Simular Pago Exitoso (Probar)
                </button>
              </div>
            ) : (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm space-y-3">
                <div className="flex items-center justify-center space-x-1 text-xs text-amber-500 font-bold uppercase">
                  <PhoneCall className="h-4 w-4" />
                  <span>Confirmar por WhatsApp</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Acelera el despacho de tu producto confirmando tu dirección por WhatsApp con un solo clic. Esto reduce el tiempo de empaque a la mitad.
                </p>
                
                <a
                  href={`https://wa.me/573108245540?text=Hola%20Tienda%20de%20Dante,%20confirmo%20mi%20pedido%20con%20ID%20${orderId}%20de%20valor%20$%20${totalPrice.toLocaleString('es-CO')}%20COP%20para%20despacho%20inmediato.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 transition-all text-center"
                >
                  <span>Confirmar Orden por WhatsApp</span>
                </a>
              </div>
            )}

            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer"
            >
              Cerrar y seguir navegando
            </button>
          </div>
        ) : (
          /* Form State */
          <div className="flex-1 flex flex-col justify-between">
            <form onSubmit={handleConfirmOrder} className="space-y-4">
              
              {/* Order Summary */}
              <div className="bg-slate-900/50 p-4 border border-slate-900 rounded-xl space-y-3">
                <h4 className="font-sans font-bold text-xs text-slate-400 uppercase tracking-wider">Resumen de tu compra:</h4>
                <div className="space-y-2">
                  {itemsToCheckout.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center text-xs text-white">
                      <span className="truncate max-w-[250px]">{item.product.name} <strong className="text-amber-500">× {item.quantity}</strong></span>
                      <span className="font-mono">${(item.product.price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-xs font-bold text-white">
                    <span>{paymentMethod === 'wompi' ? 'Envío (Sin Recaudo):' : 'Envío + Gestión (Con Recaudo):'}</span>
                    <span className="text-amber-400 font-mono">+${shippingCost.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold text-amber-500">
                    <span>{paymentMethod === 'wompi' ? 'Total Online:' : 'Total a Pagar en Casa:'}</span>
                    <span className="font-mono">${totalPrice.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold">Selecciona tu Método de Pago *</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option A: COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('contra_entrega')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      paymentMethod === 'contra_entrega'
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg'
                        : 'bg-slate-900 border-slate-850 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <Truck className={`h-5 w-5 ${paymentMethod === 'contra_entrega' ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'contra_entrega' ? 'border-amber-500 bg-amber-500' : 'border-slate-600'
                      }`}>
                        {paymentMethod === 'contra_entrega' && <span className="w-1.5 h-1.5 rounded-full bg-black block" />}
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-white">Contra Entrega</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5 leading-tight">Paga al recibir en efectivo</span>
                    </div>
                  </button>

                  {/* Option B: Wompi */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wompi')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      paymentMethod === 'wompi'
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg'
                        : 'bg-slate-900 border-slate-850 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <CreditCard className={`h-5 w-5 ${paymentMethod === 'wompi' ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'wompi' ? 'border-amber-500 bg-amber-500' : 'border-slate-600'
                      }`}>
                        {paymentMethod === 'wompi' && <span className="w-1.5 h-1.5 rounded-full bg-black block" />}
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-white">Wompi Online</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5 leading-tight">Nequi, PSE, Tarjetas 🇨🇴</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nombre Completo de Quien Recibe *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. María Paulina Restrepo"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Teléfono / Celular de Contacto *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. 312 345 6789"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Correo Electrónico {paymentMethod === 'wompi' ? '*' : '(Opcional)'}</label>
                    <input
                      type="email"
                      required={paymentMethod === 'wompi'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej. maria@correo.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Departamento *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Ciudad / Municipio *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej. Envigado"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Dirección Exacta de Entrega *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, Carrera, Edificio, Apto..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Indicaciones Adicionales / Barrio</label>
                  <input
                    type="text"
                    value={indications}
                    onChange={(e) => setIndications(e.target.value)}
                    placeholder="Ej. Frente al parque, Torre 2 Apto 402"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Safety badge */}
              <div className="flex items-center space-x-2 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-[10px] text-slate-400 leading-normal">
                <ShieldCheck className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>
                  {paymentMethod === 'wompi' 
                    ? <strong>Pago Online Protegido:</strong>
                    : <strong>Garantía de Entrega Protegida:</strong>
                  } {paymentMethod === 'wompi' 
                    ? "Transacción encriptada a través del portal oficial Wompi Bancolombia." 
                    : "No arriesgas tu dinero. Pagas únicamente en efectivo cuando recibas en la puerta de tu casa."
                  }
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={itemsToCheckout.length === 0}
                className="w-full mt-4 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-sans font-extrabold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>{paymentMethod === 'wompi' ? 'Pagar con Wompi Online 💳' : 'Confirmar Pedido Contra Entrega 🏠'}</span>
              </button>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
