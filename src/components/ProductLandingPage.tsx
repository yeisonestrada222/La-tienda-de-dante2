import { useState, FormEvent, useEffect, useRef } from 'react';
import { Product } from '../types';
import { Truck, CheckCircle2, ShieldCheck, Star, ShoppingBag, Plus, Sparkles, Heart, ArrowLeft, PhoneCall, Clock, Users, Flame, ShieldAlert, Gift, ThumbsUp, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { syncOrderToDropi, syncOrderToCRM } from '../utils/api';
import { trackViewContent, trackInitiateCheckout, trackPurchase } from '../utils/tracking';
import { colombiaDepartments, colombiaLocations } from '../utils/colombiaLocations';
import DOMPurify from 'dompurify';

interface ProductLandingPageProps {
  product: Product;
  allProducts: Product[];
  onBackToStore: () => void;
  onClearCart: () => void;
  onNewOrderAlert?: (name: string, city: string, productName: string) => void;
  onAddToCart?: (product: Product) => void;
}

export default function ProductLandingPage({ product, allProducts, onBackToStore, onClearCart, onNewOrderAlert, onAddToCart }: ProductLandingPageProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(colombiaDepartments[0]);
  const [city, setCity] = useState(colombiaLocations[colombiaDepartments[0]][0]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Image gallery state
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImage(product.imageUrl);
  }, [product]);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Bug #6: precio de upsell dinámico proporcional al precio real del producto (20% de descuento)
  const getUpsellConfig = (prodId: string) => {
    switch (prodId) {
      case 'dante-01':
        return { targetId: 'dante-02', phrase: "Dante dice: ¡La cama es perfecta, pero cepillarme con el Cepillo de Vapor antes de dormir evita los pelos en la cobija! Añádelo hoy con precio especial de súiper amigo." };
      case 'dante-02':
        return { targetId: 'dante-03', phrase: "Dante dice: ¡Tener el pelaje limpio es genial, pero jugar con la Smart-Ball de premios mantiene mi cerebrito activo y me quita la ansiedad! Llévatelo hoy en combo." };
      case 'dante-03':
        return { targetId: 'dante-05', phrase: "Dante dice: ¡Hacer ejercicio mental es genial, pero salir a pasear seguro con mi Arnés No-Pull reflectivo es lo mejor del día! Agrégalo hoy a precio exclusivo." };
      case 'dante-04':
        return { targetId: 'dante-01', phrase: "Dante dice: ¡Estar bien hidratado es vital, pero tomar una siesta reparadora en mi Cama Nube es el paraíso! Añádela hoy y consiente a tu peludo al máximo." };
      default:
        return { targetId: 'dante-02', phrase: "Dante dice: ¡Pasear sin tirones es súiper cómodo, pero al regresar a casa nada como un masaje relajante y vaporizado para remover el polvo de la calle!" };
    }
  };

  const upsellConfigBase = getUpsellConfig(product.id);
  // QA Bug P1: guard contra upsellProduct undefined cuando catálogo tiene 0-1 producto
  const upsellProduct = allProducts.find(p => p.id === upsellConfigBase.targetId) || (allProducts.length > 1 ? allProducts[1] : null);
  const upsellConfig = {
    ...upsellConfigBase,
    discountedPrice: upsellProduct ? Math.round(upsellProduct.price * 0.80) : 49000,
    originalPrice: upsellProduct ? upsellProduct.price : 69000,
  };

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

  const itemsToCheckout = (isUpsellAdded && upsellProduct)
    ? [
        { product: product, quantity: currentPackage.quantity, price: currentPackage.unitPrice },
        { product: upsellProduct, quantity: 1, price: upsellConfig.discountedPrice }
      ]
    : [
        { product: product, quantity: currentPackage.quantity, price: currentPackage.unitPrice }
      ];

  const subtotal = itemsToCheckout.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Envío siempre gratis y contra entrega según requerimiento
  const shippingCost = 0;
  const totalPrice = subtotal + shippingCost;

  const handleConfirmOrder = async (e: FormEvent) => {
    e.preventDefault();
    // Bug #4: validación de celular colombiano
    const phoneClean = phone.replace(/\s/g, '');
    if (!name.trim()) { alert('Por favor ingresa tu nombre completo.'); return; }
    if (!/^3\d{9}$/.test(phoneClean)) { alert('Ingresa un celular colombiano válido (10 dígitos, ej: 3001234567).'); return; }
    if (!city.trim()) { alert('Por favor ingresa tu ciudad.'); return; }
    if (address.trim().length < 6) { alert('Por favor ingresa una dirección completa (mínimo 6 caracteres).'); return; }

    setIsSubmitting(true);
    
    try {
      const randomId = `DNT-AD-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(randomId);

    // Bug #2: persistir la orden en localStorage igual que Checkout.tsx
    // Bug #2: auto-sync con Dropi si hay token disponible
    // FIX #3: tokens sensibles en sessionStorage
    const dropiToken = sessionStorage.getItem('dante_dropi_token') || '';
    const dropiBaseUrl = sessionStorage.getItem('dante_dropi_base_url') || 'https://api.dropi.co';

    const orderItems = itemsToCheckout.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      dropiProductId: item.product.id.startsWith('dropi-')
        ? item.product.id.replace('dropi-', '')
        : (item.product as any).dropiId || item.product.id
    }));

    const newOrder: any = {
      id: randomId,
      name,
      phone: phoneClean,
      email: 'servicioalcliente@latiendadedante.com',
      department,
      city,
      address,
      indications,
      items: orderItems,
      totalPrice,
      paymentMethod: 'contra_entrega',
      paymentStatus: 'pending_cod',
      dropiSyncStatus: 'pending',
      date: new Date().toISOString()
    };

    // Bug #2: auto-sync con Dropi si hay token disponible
    if (dropiToken.trim()) {
      try {
        const result = await syncOrderToDropi(newOrder, dropiToken, dropiBaseUrl);
        newOrder.dropiSyncStatus = 'synced';
        newOrder.dropiOrderId = result.id;
      } catch {
        newOrder.dropiSyncStatus = 'failed';
      }
    }

    // Bug #2: guardar en localStorage para que aparezca en el Centro de Sincronización
    const existingOrdersStr = localStorage.getItem('dante_orders') || '[]';
    let existingOrders: any[] = [];
    try { existingOrders = JSON.parse(existingOrdersStr); } catch { existingOrders = []; }
    existingOrders.unshift(newOrder);
    localStorage.setItem('dante_orders', JSON.stringify(existingOrders));

    // CRM n8n Integration
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
    setIsSuccess(false);
    onBackToStore();
  };

  // Bug #5: Lista completa de los 32 departamentos de Colombia + Bogotá D.C.
  // Se obtienen los departamentos desde colombiaLocations.ts

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

  // OPT #3: Track ViewContent cuando se carga la landing de producto
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackViewContent({ name: product.name, price: product.price, id: product.id });
  }, [product]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      
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
          /* SUCCESS PANEL & RECOMPRA VIP */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center max-w-xl mx-auto space-y-6 shadow-2xl my-8">
            <div className="inline-flex p-3 bg-emerald-500/10 rounded-full text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-800/40 px-3 py-1 rounded-md">
                ¡Pedido Confirmado!
              </span>
              <h2 className="font-sans font-extrabold text-2xl text-white mt-2">
                Orden #{orderId}
              </h2>
              <p className="text-slate-300 text-xs max-w-sm mx-auto leading-normal">
                ¡Gracias <strong>{name}</strong>! Preparamos tu despacho hoy. Pagas únicamente en efectivo al recibir en tu domicilio.
              </p>
            </div>

            {/* VIP RECOMPRA COUPON */}
            <div className="p-5 bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-2xl text-center space-y-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-extrabold block">
                🎁 Regalo Exclusivo para Recompra VIP
              </span>
              <h4 className="text-white font-bold text-sm">¡15% OFF en tu próximo pedido!</h4>
              <div className="inline-block px-5 py-2 bg-slate-950 border border-amber-500/50 rounded-xl font-mono text-amber-400 font-extrabold tracking-widest text-lg select-all">
                DANTE15
              </div>
              <p className="text-[10px] text-slate-400">Tómale captura o cópialo para usarlo en cualquier producto de la tienda.</p>
            </div>

            {/* Express WhatsApp Confirmation */}
            <a
              href={`https://wa.me/573108245540?text=Hola%20Tienda%20de%20Dante,%20confirmo%20mi%20pedido%20%23${orderId}%20de%20$%20${totalPrice.toLocaleString('es-CO')}%20COP%20para%20despacho`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 transition-all text-center shadow-lg shadow-emerald-500/20"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Confirmar Dirección por WhatsApp</span>
            </a>

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800 transition-all cursor-pointer"
            >
              Volver y ver más productos
            </button>
          </div>
        ) : (
          /* SINGLE PRODUCT LANDING PAGE WITH DIRECT FORM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Product Info & Reviews (7/12) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Product Visual Presentation */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                
                <div className="space-y-3">
                  <button 
                    onClick={() => setIsImageModalOpen(true)}
                    className="relative aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 block w-full group cursor-zoom-in"
                  >
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md w-8 h-8" />
                    </div>
                    <span className="absolute top-4 left-4 bg-amber-500 text-black font-sans font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-lg z-10">
                      Recomendado por Dante
                    </span>
                  </button>
                  
                  {/* Image Thumbnails Gallery */}
                  {product.images && product.images.length > 1 && (
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 custom-scrollbar">
                      {product.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(img)}
                          className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            selectedImage === img ? 'border-amber-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-amber-500">
                    <span>{product.category}</span>
                  </div>

                  <h1 className="font-sans font-extrabold text-3xl text-white leading-tight">
                    {product.name}
                  </h1>

                  <div className="space-y-2">
                    {/* FIX #1: Sanitizar HTML de Shopify con DOMPurify antes de renderizar */}
                    {(() => {
                      const sanitizedDescription = DOMPurify.sanitize(product.description, {
                        ALLOWED_TAGS: ['p','strong','em','b','i','ul','ol','li','br','h2','h3','h4','span','a'],
                        ALLOWED_ATTR: ['class','href','target'],
                        FORBID_TAGS: ['script','iframe','object','embed','form','style'],
                        FORBID_ATTR: ['onerror','onload','onclick','onmouseover'],
                      });
                      return (
                        <div
                          className={`text-slate-300 text-sm leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-4' : ''} [&>p]:mb-3 [&>strong]:text-white [&>ul]:list-disc [&>ul]:ml-5`}
                          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                        />
                      );
                    })()}
                    <button 
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-amber-500 hover:text-amber-400 font-bold text-xs uppercase tracking-wider underline cursor-pointer"
                    >
                      {isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                  </div>

                  {/* Add to Cart Option */}
                  {onAddToCart && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onAddToCart(product);
                        }}
                        className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 text-amber-400 hover:text-amber-300 font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Añadir al Carrito y Seguir Viendo</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Compact Features & Specs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-sans font-bold text-xs text-amber-500 uppercase tracking-wider">
                  ✨ Lo que debes saber:
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {Object.keys(product.specs).length > 0 && (
                  <div className="border-t border-slate-800/80 pt-3 flex flex-wrap gap-2 text-[11px]">
                    {Object.entries(product.specs).map(([key, value], idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                        <strong className="text-slate-200">{key}:</strong> {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Fast Checkout Direct Form & Clean Upsell (5/12) */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
                
                {/* Header & Clean Trust Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🚚</span>
                    <div>
                      <h3 className="font-sans font-extrabold text-sm text-white leading-none">
                        Despacho Contra Entrega
                      </h3>
                      <span className="text-[10px] text-emerald-400 font-semibold">🔒 Pagas al recibir en tu casa</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-mono rounded-lg font-bold">
                    Envío Gratis
                  </span>
                </div>

                {/* Envío gratis garantizado */}
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                    🚚 ¡TU PEDIDO INCLUYE ENVÍO GRATIS! 🎉
                  </p>
                </div>

                {/* CLEAN MULTI-BUY SELECTOR */}
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-300 font-bold">
                    Selecciona cantidad:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    
                    {/* 1 Unit */}
                    <button
                      type="button"
                      onClick={() => setQuantityOption('1')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        quantityOption === '1'
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          quantityOption === '1' ? 'border-amber-500 bg-amber-500' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {quantityOption === '1' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <span className="text-xs font-bold text-white">1 Unidad</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-500">${product.price.toLocaleString('es-CO')}</span>
                    </button>

                    {/* 2 Units (-15%) */}
                    <button
                      type="button"
                      onClick={() => setQuantityOption('2')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                        quantityOption === '2'
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <span className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-extrabold px-2 py-0.5 rounded-bl-lg uppercase">
                        ⚡ Más Vendido (-15%)
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          quantityOption === '2' ? 'border-amber-500 bg-amber-500' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {quantityOption === '2' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white">2 Unidades</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono text-xs font-bold text-amber-500">${(Math.round(product.price * 0.85) * 2).toLocaleString('es-CO')}</span>
                      </div>
                    </button>

                    {/* 3 Units (-25%) */}
                    <button
                      type="button"
                      onClick={() => setQuantityOption('3')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                        quantityOption === '3'
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <span className="absolute top-0 right-0 bg-emerald-500 text-black text-[8px] font-extrabold px-2 py-0.5 rounded-bl-lg uppercase">
                        🔥 Mejor Precio (-25%)
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          quantityOption === '3' ? 'border-amber-500 bg-amber-500' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {quantityOption === '3' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white">3 Unidades</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono text-xs font-bold text-amber-500">${(Math.round(product.price * 0.75) * 3).toLocaleString('es-CO')}</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* FAST CROSS-SELL / COMBO CARD — QA Bug P1: guard upsellProduct */}
                {upsellProduct && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={upsellProduct.imageUrl}
                      alt={upsellProduct.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="block text-white text-xs font-bold truncate">Añadir {upsellProduct.name}</span>
                      <span className="text-amber-400 font-mono text-xs font-bold">+${upsellConfig.discountedPrice.toLocaleString('es-CO')} <span className="text-slate-500 line-through text-[9px]">(-20% OFF)</span></span>
                    </div>
                  </div>

                  {isUpsellAdded ? (
                    <button
                      type="button"
                      onClick={() => setIsUpsellAdded(false)}
                      className="px-2.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg cursor-pointer flex-shrink-0"
                    >
                      ¡Añadido! ✓
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsUpsellAdded(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-extrabold uppercase rounded-lg flex items-center space-x-1 cursor-pointer flex-shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Añadir</span>
                    </button>
                  )}
                </div>
                )}

                {/* FAST CHECKOUT FORM */}
                <form onSubmit={handleConfirmOrder} className="space-y-3.5">
                  
                  {/* Ultra-Concise Summary */}
                  <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">Total a pagar al recibir:</span>
                    <span className="font-mono text-base font-extrabold text-amber-400">${totalPrice.toLocaleString('es-CO')} COP</span>
                  </div>

                  {/* Customer Inputs */}
                  <div className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu Nombre y Apellido *"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Tu Celular / WhatsApp *"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      >
                        {colombiaDepartments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>

                      <select
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Procesando...' : 'Pedir Contra Entrega Ahora 🚀'}</span>
                  </button>
                  <p className="text-center text-[10px] text-slate-500">
                    Sin pagos anticipados. Pagas en efectivo al mensajero.
                  </p>

                </form>

              </div>

            </div>

          </div>
        )}
      </div>

      {/* Image Full Screen Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <button 
            onClick={() => setIsImageModalOpen(false)}
            aria-label="Cerrar imagen"
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 text-white/70 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full transition-all z-50"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Next/Prev Buttons */}
          {product.images && product.images.length > 1 && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = product.images!.indexOf(selectedImage);
                  const nextIndex = (currentIndex - 1 + product.images!.length) % product.images!.length;
                  setSelectedImage(product.images![nextIndex]);
                }}
                aria-label="Imagen anterior"
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full transition-all z-50"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = product.images!.indexOf(selectedImage);
                  const nextIndex = (currentIndex + 1) % product.images!.length;
                  setSelectedImage(product.images![nextIndex]);
                }}
                aria-label="Imagen siguiente"
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full transition-all z-50"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img 
            src={selectedImage} 
            alt="Product full view" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl relative z-10"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}
