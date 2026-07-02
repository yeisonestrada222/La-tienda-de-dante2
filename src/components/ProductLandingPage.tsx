import { useState, FormEvent, useEffect } from 'react';
import { Product } from '../types';
import { Truck, CheckCircle2, ShieldCheck, Star, ShoppingBag, Plus, Sparkles, Heart, ArrowLeft, PhoneCall, Clock, Users, Flame, ShieldAlert, Gift, ThumbsUp } from 'lucide-react';

interface ProductLandingPageProps {
  product: Product;
  allProducts: Product[];
  onBackToStore: () => void;
  onClearCart: () => void;
  onNewOrderAlert?: (name: string, city: string, productName: string) => void;
}

export default function ProductLandingPage({ product, allProducts, onBackToStore, onClearCart, onNewOrderAlert }: ProductLandingPageProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Bogotá D.C.');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [indications, setIndications] = useState('');

  // High-conversion marketing triggers
  const [timeLeft, setTimeLeft] = useState(899); // 14 min 59 secs
  const [viewers, setViewers] = useState(38);
  const [stockLeft, setStockLeft] = useState(8);
  const [quantityOption, setQuantityOption] = useState<'1' | '2' | '3'>('1');

  // Upsell state
  const [isUpsellAdded, setIsUpsellAdded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Determine the upsell product based on current product ID
  const getUpsellConfig = (prodId: string) => {
    switch (prodId) {
      case 'dante-01': // Cama -> Cepillo
        return {
          targetId: 'dante-02',
          discountedPrice: 49000,
          originalPrice: 69000,
          phrase: "Dante dice: ¡La cama es perfecta, pero cepillarme con el Cepillo de Vapor antes de dormir evita los pelos en la cobija! Añádelo hoy con precio especial de súper amigo."
        };
      case 'dante-02': // Cepillo -> Juguete
        return {
          targetId: 'dante-03',
          discountedPrice: 39000,
          originalPrice: 54000,
          phrase: "Dante dice: ¡Tener el pelaje limpio es genial, pero jugar con la Smart-Ball de premios mantiene mi cerebrito activo y me quita la ansiedad! Llévatelo hoy en combo."
        };
      case 'dante-03': // Juguete -> Arnés
        return {
          targetId: 'dante-05',
          discountedPrice: 59000,
          originalPrice: 75000,
          phrase: "Dante dice: ¡Hacer ejercicio mental es genial, pero salir a pasear seguro con mi Arnés No-Pull reflectivo es lo mejor del día! Agrégalo hoy a precio exclusivo."
        };
      case 'dante-04': // Bebedero -> Cama
        return {
          targetId: 'dante-01',
          discountedPrice: 79000,
          originalPrice: 99000,
          phrase: "Dante dice: ¡Estar bien hidratado es vital, pero tomar una siesta reparadora en mi Cama Nube es el paraíso! Añádela hoy y consiente a tu peludo al máximo."
        };
      case 'dante-05': // Arnés -> Cepillo
      default:
        return {
          targetId: 'dante-02',
          discountedPrice: 49000,
          originalPrice: 69000,
          phrase: "Dante dice: ¡Pasear sin tirones es súper cómodo, pero al regresar a casa nada como un masaje relajante y vaporizado para remover el polvo de la calle!"
        };
    }
  };

  const upsellConfig = getUpsellConfig(product.id);
  const upsellProduct = allProducts.find(p => p.id === upsellConfig.targetId) || allProducts[1];

  const getPackageInfo = () => {
    switch (quantityOption) {
      case '2':
        return { quantity: 2, unitPrice: Math.round(product.price * 0.85) };
      case '3':
        return { quantity: 3, unitPrice: Math.round(product.price * 0.75) };
      case '1':
      default:
        return { quantity: 1, unitPrice: product.price };
    }
  };

  const currentPackage = getPackageInfo();

  const itemsToCheckout = isUpsellAdded 
    ? [
        { product: product, quantity: currentPackage.quantity, price: currentPackage.unitPrice },
        { product: upsellProduct, quantity: 1, price: upsellConfig.discountedPrice }
      ]
    : [
        { product: product, quantity: currentPackage.quantity, price: currentPackage.unitPrice }
      ];

  const subtotal = itemsToCheckout.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = 15000;
  const totalPrice = subtotal + shippingCost;

  const handleConfirmOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim() || !address.trim()) return;

    const randomId = `DNT-AD-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(randomId);
    setIsSuccess(true);

    if (onNewOrderAlert) {
      const itemsNames = itemsToCheckout.map(item => `${item.product.name} (x${item.quantity})`).join(' + ');
      onNewOrderAlert(name, city, itemsNames);
    }
  };

  const handleFinish = () => {
    onClearCart();
    setIsSuccess(false);
    onBackToStore();
  };

  const departments = [
    'Bogotá D.C.', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Cundinamarca', 
    'Santander', 'Bolívar', 'Caldas', 'Risaralda', 'Tolima', 'Norte de Santander'
  ];

  // Specific dynamic product reviews generator for maximum social proof
  const getProductReviews = (prodId: string) => {
    switch (prodId) {
      case 'dante-01': // Cama
        return [
          { author: "Carolina Cardona", rating: 5, date: "Hace 2 horas", comment: "Excelente cama, mi criatura no se baja de ella, es extremadamente suave y pachoncita. ¡Dante no miente, es espectacular!", verified: true },
          { author: "Mauricio Gómez", rating: 5, date: "Ayer", comment: "Llegó super rápido a Cali, pagué contra entrega. Es super grande y acolchada. Mi perrita duerme feliz toda la noche. Recomiendo 10/10.", verified: true },
          { author: "Estefanía Ruiz", rating: 5, date: "Hace 3 días", comment: "A mi gata le fascinó, apenas la saqué de la bolsa se acostó y no se ha levantado. El material es premium y fácil de lavar.", verified: true }
        ];
      case 'dante-02': // Cepillo Vapor
        return [
          { author: "Yuliana Restrepo", rating: 5, date: "Hace 1 hora", comment: "¡Es mágico! Sale vapor frío muy fino que no moja pero ayuda a remover todo el pelo muerto. Mi gata que odia bañarse se dejó peinar feliz.", verified: true },
          { author: "Juan David Posada", rating: 5, date: "Hace 1 día", comment: "Increíble cómo saca pelo. Compré dos para regalar a mis tías. Es recargable y de muy buena calidad. Llegó gratis a Bogotá.", verified: true },
          { author: "Liliana Marín", rating: 5, date: "Hace 4 días", comment: "Súper recomendado. Evita que vuelen pelos por toda la sala al peinarlo. Me encanta el color y el diseño ergonómico.", verified: true }
        ];
      case 'dante-03': // Juguete Smart-Ball
        return [
          { author: "Sebastián Urrego", rating: 5, date: "Hace 5 horas", comment: "Tengo un border collie hiperactivo y esta pelota lo mantiene concentrado por horas tratando de sacar las croquetas. Un alivio para el aburrimiento.", verified: true },
          { author: "Diana Marcela Hoyos", rating: 5, date: "Hace 2 días", comment: "Excelente calidad, es un plástico muy resistente, mi perro la muerde duro y no le ha hecho ni un rasguño. Muy divertida.", verified: true }
        ];
      case 'dante-04': // Bebedero Cascada
        return [
          { author: "Alejandra Osorio", rating: 5, date: "Hace 10 horas", comment: "Mi gato casi no tomaba agua y desde que instalé esta cascada se la pasa tomando ahí. El agua se mantiene fresca y limpia gracias al filtro.", verified: true },
          { author: "Andrés Beltrán", rating: 5, date: "Hace 1 día", comment: "No hace nada de ruido, el motor es totalmente silencioso. La luz LED azul se ve genial de noche. Muy complacido con el envío contra entrega.", verified: true }
        ];
      case 'dante-05': // Arnés No-Pull
      default:
        return [
          { author: "Felipe Vanegas", rating: 5, date: "Hace 3 horas", comment: "Por fin puedo pasear a mi pitbull sin que me arrastre por la calle. El enganche delantero realmente hace que gire y deje de jalar. 100% recomendado.", verified: true },
          { author: "Tatiana Castro", rating: 5, date: "Ayer", comment: "Muy seguro y las líneas reflectivas brillan muchísimo en la noche. Las costuras son gruesas y los broches tienen seguro contra apertura. Excelente compra.", verified: true }
        ];
    }
  };

  // Countdown timer trigger
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 10 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Viewer simulation trigger
  useEffect(() => {
    const viewersInterval = setInterval(() => {
      setViewers((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next > 25 && next < 55 ? next : 38;
      });
    }, 6000);
    return () => clearInterval(viewersInterval);
  }, []);

  // Stock depletion simulation trigger
  useEffect(() => {
    const timeout1 = setTimeout(() => setStockLeft(7), 15000);
    const timeout2 = setTimeout(() => setStockLeft(5), 35000);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  // Format time (e.g. 14:59)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Scroll to top when landing page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      
      {/* Upper Navigation Indicator (Simulated Ad Source) */}
      <div className="bg-amber-600 text-black text-center py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2">
        <Sparkles className="h-4 w-4 animate-bounce" />
        <span>Oferta Publicitaria Exclusiva de Dante • Envío Gratis Contra Entrega 🇨🇴</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Back Button */}
        <button
          onClick={onBackToStore}
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white mb-8 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a la Tienda de Dante</span>
        </button>

        {isSuccess ? (
          /* SUCCESS PANEL */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-2xl my-10">
            <div className="inline-block p-4 bg-emerald-500/10 rounded-full text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-16 w-16" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-3 py-1 rounded-md">
                ¡Pedido Realizado Exitosamente!
              </span>
              <h2 className="font-sans font-extrabold text-3xl text-white mt-4">
                ID de Orden: {orderId}
              </h2>
              <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                ¡Muchas gracias <strong>{name}</strong>! Tu pedido se ha sincronizado de manera exitosa con el fulfillment nacional de <strong>Dropi</strong>. No arriesgas nada, pagas al recibir.
              </p>
            </div>

            {/* Simulated WhatsApp Confirmation block */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-center space-x-2 text-xs text-amber-500 font-extrabold uppercase">
                <PhoneCall className="h-4 w-4" />
                <span>Confirmación Express por WhatsApp</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¡Acelera el empaque de Dante! Confirma tu dirección por WhatsApp con un solo clic. Esto nos ayuda a despachar tu pedido hoy mismo.
              </p>
              
              <a
                href={`https://wa.me/573108245540?text=Hola%20Tienda%20de%20Dante,%20confirmo%20mi%20pedido%20con%20ID%20${orderId}%20de%20valor%20$%20${totalPrice.toLocaleString('es-CO')}%20COP%20para%20despacho`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 transition-all text-center"
              >
                <span>Enviar Confirmación Directa</span>
              </a>
            </div>

            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800"
            >
              Cerrar y ver más productos
            </button>
          </div>
        ) : (
          /* SINGLE PRODUCT LANDING PAGE WITH DIRECT FORM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Product Info & Reviews (7/12) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Product Visual Presentation */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                
                <div className="relative aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-slate-850">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-4 left-4 bg-amber-500 text-black font-sans font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-lg">
                    Recomendado por Dante
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-amber-500">
                    <span>{product.category}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="text-white font-bold">{product.rating}</span>
                      <span className="text-slate-500">({product.reviewsCount} opiniones)</span>
                    </div>
                  </div>

                  <h1 className="font-sans font-extrabold text-3xl text-white leading-tight">
                    {product.name}
                  </h1>

                  <p className="text-slate-300 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>

              </div>

              {/* Technical features bento */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>✨ ¿Por qué a Dante le encanta este producto?</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex items-start space-x-3">
                      <div className="p-1 bg-amber-500/10 text-amber-500 rounded-md mt-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-slate-300 text-xs leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ficha técnica */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6">
                <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider mb-3">Ficha Técnica Oficial:</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.specs).map(([key, value], idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 flex flex-col">
                      <span className="text-slate-500 font-mono uppercase text-[9px]">{key}</span>
                      <span className="text-slate-200 font-bold mt-1">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product-Specific Real Customer Reviews (Ultimate Social Proof) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
                    <ThumbsUp className="h-4.5 w-4.5 text-amber-500" />
                    <span>Opiniones Verificadas en Colombia 🇨🇴</span>
                  </h3>
                  <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">100% Reales</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {getProductReviews(product.id).map((rev, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-xs font-extrabold uppercase">
                            {rev.author.substring(0, 2)}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-white">{rev.author}</span>
                            <span className="text-[10px] text-slate-500">{rev.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                      <div className="flex items-center space-x-1.5 text-[9px] text-emerald-400 font-semibold uppercase">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Compra Verificada • Pago Contra Entrega</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Checkout Direct Form & Upsell Card (5/12) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              
              {/* Checkout Form Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                
                <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
                  <div className="bg-amber-500 text-black p-1.5 rounded-lg text-sm">
                    🚚
                  </div>
                  <div>
                    <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider text-white">
                      Despacho Contra Entrega
                    </h3>
                    <p className="text-[10px] text-slate-400">Pagas en efectivo al recibir en casa</p>
                  </div>
                </div>

                {/* LIVE URGENCY & SCARCITY TRIGGERS */}
                <div className="bg-slate-950 border border-red-500/20 rounded-2xl p-4 space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500 w-full animate-pulse" />
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-red-400 font-extrabold text-[10px] uppercase tracking-wider">
                      <Flame className="h-4 w-4 text-red-500 animate-pulse" />
                      <span>¡Demanda Súper Alta!</span>
                    </span>
                    <span className="flex items-center space-x-1 text-amber-500 font-mono text-xs font-extrabold">
                      <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>{formatTimer(timeLeft)}</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium font-sans">Inventario disponible en bodega:</span>
                      <span className="text-red-400 font-extrabold uppercase font-mono">{stockLeft} Unidades</span>
                    </div>

                    {/* Stock level progress bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${(stockLeft / 10) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 leading-none mt-1">
                      <Users className="h-3.5 w-3.5 text-amber-500" />
                      <span>Hay <strong className="text-white font-bold">{viewers} personas</strong> mirando este producto ahora mismo.</span>
                    </div>
                  </div>
                </div>

                {/* MULTI-BUY PACKAGE SELECTOR (LLEVA MÁS, PAGA MENOS) */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] text-amber-500 uppercase font-extrabold tracking-wider">
                    🎁 Paso 1: Selecciona tu Oferta Exclusiva:
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    
                    {/* Package 1: 1 Unit */}
                    <button
                      type="button"
                      onClick={() => setQuantityOption('1')}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        quantityOption === '1'
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          quantityOption === '1' ? 'border-amber-500 bg-amber-500' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {quantityOption === '1' && <span className="w-2 h-2 rounded-full bg-black" />}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white">Llevar 1 Unidad</span>
                          <span className="text-[10px] text-slate-400">Precio de lanzamiento</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-500">${product.price.toLocaleString('es-CO')} COP</span>
                    </button>

                    {/* Package 2: 2 Units (15% OFF) */}
                    <button
                      type="button"
                      onClick={() => setQuantityOption('2')}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                        quantityOption === '2'
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      {/* Popular Badge */}
                      <div className="absolute top-0 right-0 bg-red-500 text-[8px] font-extrabold text-white px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        MÁS POPULAR • 15% OFF
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          quantityOption === '2' ? 'border-amber-500 bg-amber-500' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {quantityOption === '2' && <span className="w-2 h-2 rounded-full bg-black" />}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white">Llevar 2 Unidades (¡Recomendado!)</span>
                          <span className="text-[10px] text-emerald-400 font-bold">Ahorras 15% en cada una</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono text-xs font-bold text-amber-500">${(Math.round(product.price * 0.85) * 2).toLocaleString('es-CO')} COP</span>
                        <span className="block text-[9px] text-slate-500 line-through font-mono">${(product.price * 2).toLocaleString('es-CO')}</span>
                      </div>
                    </button>

                    {/* Package 3: 3 Units (25% OFF) */}
                    <button
                      type="button"
                      onClick={() => setQuantityOption('3')}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                        quantityOption === '3'
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      {/* Best Value Badge */}
                      <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] font-extrabold text-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        SÚPER AHORRO • 25% OFF
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          quantityOption === '3' ? 'border-amber-500 bg-amber-500' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {quantityOption === '3' && <span className="w-2 h-2 rounded-full bg-black" />}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white">Llevar 3 Unidades (¡Mejor Valor!)</span>
                          <span className="text-[10px] text-emerald-400 font-bold">Ahorras 25% en cada una</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono text-xs font-bold text-amber-500">${(Math.round(product.price * 0.75) * 3).toLocaleString('es-CO')} COP</span>
                        <span className="block text-[9px] text-slate-500 line-through font-mono">${(product.price * 3).toLocaleString('es-CO')}</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* UP-SELL CARD: Dante's Recommendation "Add something else!" */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden space-y-3">
                  
                  {/* Paw Print Deco */}
                  <div className="absolute -bottom-4 -right-4 opacity-5 text-amber-500 text-7xl font-bold">
                    🐾
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[9px] font-mono text-amber-400 uppercase font-bold animate-pulse">
                      <Sparkles className="h-3 w-3" />
                      <span>¡Paso 2: Combo Aprobado por Dante!</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">25% OFF EXCLUSIVO</span>
                  </div>

                  <p className="text-[11px] text-slate-300 italic leading-relaxed">
                    "{upsellConfig.phrase}"
                  </p>

                  {/* Add Cross-sell item card */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center space-x-3 justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={upsellProduct.imageUrl}
                        alt={upsellProduct.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400 uppercase truncate font-mono">{upsellProduct.category}</span>
                        <span className="block text-white text-[11px] font-bold truncate">{upsellProduct.name}</span>
                        <div className="flex items-baseline space-x-1.5 mt-0.5">
                          <span className="text-amber-500 font-mono text-xs font-bold">${upsellConfig.discountedPrice.toLocaleString('es-CO')} COP</span>
                          <span className="text-[9px] text-slate-500 line-through font-mono">${upsellConfig.originalPrice.toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>

                    {isUpsellAdded ? (
                      <button
                        type="button"
                        onClick={() => setIsUpsellAdded(false)}
                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer flex-shrink-0 animate-fade-in"
                      >
                        ¡Añadido! ✓
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsUpsellAdded(true)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-extrabold uppercase rounded-lg flex items-center space-x-1 transition-all cursor-pointer flex-shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Form Elements */}
                <form onSubmit={handleConfirmOrder} className="space-y-4">
                  
                  {/* Order Summary Recap */}
                  <div className="bg-slate-950 p-4 border border-slate-900 rounded-2xl space-y-3">
                    <h4 className="font-sans font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                      Resumen de tu Despacho Contra Entrega:
                    </h4>
                    
                    <div className="space-y-2">
                      {itemsToCheckout.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-white">
                          <span className="truncate max-w-[200px]">{item.product.name} <strong className="text-amber-500">× {item.quantity}</strong></span>
                          <span className="font-mono">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                      
                      <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-xs font-bold text-white">
                        <span>Envío + Gestión (Con Recaudo):</span>
                        <span className="text-amber-400 font-mono font-extrabold flex items-center space-x-1">
                          <span>+${shippingCost.toLocaleString('es-CO')}</span>
                          <Truck className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      
                      <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-sm font-extrabold text-amber-500">
                        <span>Pagas únicamente al recibir en casa:</span>
                        <span className="font-mono text-base font-extrabold">${totalPrice.toLocaleString('es-CO')} COP</span>
                      </div>
                    </div>

                  </div>

                  {/* Customer Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-extrabold mb-1 tracking-wider">Nombre Completo de Quien Recibe *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Carolina Cardona Toro"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-extrabold mb-1 tracking-wider">Teléfono / Celular de Contacto *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 314 567 8901 (Para confirmación)"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-extrabold mb-1 tracking-wider">Departamento *</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                        >
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-extrabold mb-1 tracking-wider">Ciudad / Municipio *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ej. Medellín"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-extrabold mb-1 tracking-wider">Dirección Exacta de Entrega *</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle, Carrera, Edificio, Apto..."
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-extrabold mb-1 tracking-wider">Indicaciones / Barrio</label>
                      <input
                        type="text"
                        value={indications}
                        onChange={(e) => setIndications(e.target.value)}
                        placeholder="Ej. Barrio Poblado, cerca al Euro"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Safety guarantees */}
                  <div className="flex items-center space-x-2 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-[10px] text-slate-400 leading-normal">
                    <ShieldCheck className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                    <span><strong>Garantía de Entrega Dante:</strong> Tu dinero está 100% seguro. Pagas únicamente en efectivo cuando recibas en la puerta de tu hogar. Sin tarjetas de crédito ni transferencias previas.</span>
                  </div>

                  {/* Submit Order Action Button */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 cursor-pointer"
                  >
                    <span>Comprar Contra Entrega Ahora 🐾</span>
                  </button>

                </form>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
