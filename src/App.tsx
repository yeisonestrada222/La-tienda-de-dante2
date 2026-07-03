import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Catalog from './components/Catalog';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Checkout from './components/Checkout';
import IntegrationHub from './components/IntegrationHub';
import ProductLandingPage from './components/ProductLandingPage';
import LiveSocialProof from './components/LiveSocialProof';

import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from './data';
import { Product, Review, ContactMessage } from './types';
import { Flame, Sparkles, ShoppingBag } from 'lucide-react';
import { verifyWompiTransaction, syncOrderToDropi } from './utils/api';
import { fetchShopifyProducts, fetchPublicShopifyCatalog } from './utils/shopify';
import { fetchDropiProducts } from './utils/dropi';

const DEFAULT_SHOPIFY_SECRET = import.meta.env.VITE_SHOPIFY_TOKEN || '';

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [savedMessages, setSavedMessages] = useState<ContactMessage[]>([]);

  // Cargar SOLO productos reales (desde Dropi o Shopify)
  useEffect(() => {
    async function loadRealProducts() {
      setIsLoadingProducts(true);

      // 0. Consultar catálogo público de Shopify (/products.json) si estamos en la tienda en vivo
      try {
        const publicCatalog = await fetchPublicShopifyCatalog();
        if (publicCatalog.length > 0) {
          setProducts(publicCatalog);
          setShopifyConnected(true);
          setIsLoadingProducts(false);
          return;
        }
      } catch (e) {
        console.warn('[Dante Store] No se obtuvo catálogo público /products.json:', e);
      }

      // 1. Verificar si hay token de Dropi configurado
      const dropiToken = localStorage.getItem('dante_dropi_token');
      if (dropiToken) {
        try {
          const dropiProducts = await fetchDropiProducts(dropiToken);
          if (dropiProducts.length > 0) {
            setProducts(dropiProducts);
            setShopifyConnected(true);
            setIsLoadingProducts(false);
            return;
          }
        } catch (dropiErr) {
          console.warn('[Dante Store] No se pudieron cargar productos directos de Dropi:', dropiErr);
        }
      }

      // 2. Usar token de Shopify (guardado o el secreto por defecto del usuario)
      let shopifyToken = localStorage.getItem('dante_shopify_storefront_token');
      if (!shopifyToken) {
        shopifyToken = DEFAULT_SHOPIFY_SECRET;
        localStorage.setItem('dante_shopify_storefront_token', shopifyToken);
      }

      try {
        const shopifyProducts = await fetchShopifyProducts(shopifyToken);
        if (shopifyProducts.length > 0) {
          setProducts(shopifyProducts);
          setShopifyConnected(true);
        } else {
          setProducts(INITIAL_PRODUCTS);
          setShopifyConnected(false);
        }
      } catch (err: any) {
        console.warn('[Dante Store] Error consultando Shopify:', err.message);
        setProducts(INITIAL_PRODUCTS);
        setShopifyConnected(false);
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadRealProducts();
  }, []);
  
  // Cart & Checkout state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [singleCheckoutProduct, setSingleCheckoutProduct] = useState<Product | null>(null);
  
  // Active Landing Product for campaign funnel (Subpágina dedicada)
  const [activeLandingProduct, setActiveLandingProduct] = useState<Product | null>(null);

  // Detectar si la URL tiene parámetro ?product=... o #producto/... para campañas directas en Ads
  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('product') || params.get('p') || window.location.hash.replace(/^#(producto|product)\//i, '');
    if (target && !activeLandingProduct) {
      const decoded = decodeURIComponent(target).toLowerCase();
      const match = products.find(p => 
        p.id.toLowerCase() === decoded || 
        p.id.toLowerCase().endsWith(decoded) || 
        p.name.toLowerCase().includes(decoded)
      );
      if (match) {
        setActiveLandingProduct(match);
      }
    }
  }, [products]);

  // Integration Hub state
  const [isIntegrationHubOpen, setIsIntegrationHubOpen] = useState(false);
  
  // Active UI Navigation state
  const [activeSection, setActiveSection] = useState('inicio');

  // Interactive Live Purchase Notification Alert
  const [liveAlert, setLiveAlert] = useState<{ name: string; city: string; product: string; time: string; isReal?: boolean } | null>(null);
  const alertTimeoutRef = useRef<any>(null);

  // Wompi redirect verification state
  const [wompiStatusModal, setWompiStatusModal] = useState<{
    isOpen: boolean;
    status: 'checking' | 'approved' | 'declined' | 'error';
    orderId: string;
    dropiId?: string;
    errorMessage?: string;
  } | null>(null);

  // Check for Wompi success redirect parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wompiSuccess = params.get('wompi_success');
    const orderId = params.get('order_id');
    const transactionId = params.get('id');

    if (wompiSuccess === 'true' && orderId && transactionId) {
      setWompiStatusModal({
        isOpen: true,
        status: 'checking',
        orderId
      });

      const verifyPayment = async () => {
        const wompiKey = localStorage.getItem('dante_wompi_public_key') || 'pub_test_Q5YvY248sEtgZpGSu7Q16vI7I9c6O848';
        const dropiToken = localStorage.getItem('dante_dropi_token') || '';
        const dropiBaseUrl = localStorage.getItem('dante_dropi_base_url') || 'https://api.dropi.co';

        try {
          // 1. Verify Wompi transaction status
          const tx = await verifyWompiTransaction(transactionId, wompiKey);

          const existingOrdersStr = localStorage.getItem('dante_orders') || '[]';
          let orders: any[] = [];
          try {
            orders = JSON.parse(existingOrdersStr);
          } catch (e) {
            orders = [];
          }

          const orderIndex = orders.findIndex((o: any) => o.id === orderId);

          if (tx.status === 'APPROVED') {
            let matchedOrder = orderIndex !== -1 ? orders[orderIndex] : null;
            if (matchedOrder) {
              matchedOrder.paymentStatus = 'paid';
            }

            let finalDropiId = '';
            
            // 2. Auto-sync to Dropi as it is now paid
            if (matchedOrder && dropiToken.trim()) {
              try {
                const dropiRes = await syncOrderToDropi(matchedOrder, dropiToken, dropiBaseUrl);
                matchedOrder.dropiSyncStatus = 'synced';
                matchedOrder.dropiOrderId = dropiRes.id;
                finalDropiId = dropiRes.id;
              } catch (dropiErr: any) {
                matchedOrder.dropiSyncStatus = 'failed';
                matchedOrder.dropiError = dropiErr.message;
              }
            }

            if (orderIndex !== -1) {
              orders[orderIndex] = matchedOrder;
              localStorage.setItem('dante_orders', JSON.stringify(orders));
            }

            setWompiStatusModal({
              isOpen: true,
              status: 'approved',
              orderId,
              dropiId: finalDropiId
            });

            // Trigger purchase notification
            if (matchedOrder) {
              const itemsNames = matchedOrder.items.map((i: any) => `${i.productName} (x${i.quantity})`).join(' + ');
              triggerAlert(matchedOrder.name, matchedOrder.city, itemsNames, true);
            }
          } else {
            // Transaction failed (DECLINED, ERROR, etc.)
            if (orderIndex !== -1) {
              orders[orderIndex].paymentStatus = 'failed';
              localStorage.setItem('dante_orders', JSON.stringify(orders));
            }

            setWompiStatusModal({
              isOpen: true,
              status: tx.status === 'DECLINED' ? 'declined' : 'error',
              orderId,
              errorMessage: tx.status_message || 'La transacción fue declinada por la entidad financiera.'
            });
          }
        } catch (err: any) {
          console.error(err);
          setWompiStatusModal({
            isOpen: true,
            status: 'error',
            orderId,
            errorMessage: err.message || 'Error de conexión con la pasarela de Wompi.'
          });
        } finally {
          // Clear query params so refreshing does not trigger verification again
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      verifyPayment();
    }
  }, []);

  // Main purchase notification dispatcher (both simulated and real)
  const triggerAlert = (customName?: string, customCity?: string, customProduct?: string, isReal: boolean = false) => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    const names = ['Santiago', 'Alejandra', 'Mateo', 'Valeria', 'Carlos', 'Daniela', 'Andrés', 'Sofía', 'Felipe', 'Mariana'];
    const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena', 'Manizales', 'Pereira', 'Ibagué', 'Envigado'];

    const finalName = customName || names[Math.floor(Math.random() * names.length)];
    const finalCity = customCity || cities[Math.floor(Math.random() * cities.length)];
    const finalProduct = customProduct || (products.length > 0 ? products[Math.floor(Math.random() * products.length)].name : "Producto Dante");
    const minutes = Math.floor(Math.random() * 15) + 1;
    const finalTime = isReal ? '¡hace unos segundos!' : `hace ${minutes} minutos`;

    setLiveAlert({
      name: finalName,
      city: finalCity,
      product: finalProduct,
      time: finalTime,
      isReal
    });

    // Clear alert after 8 seconds if real (more readable), 6 seconds if simulated
    alertTimeoutRef.current = setTimeout(() => {
      setLiveAlert(null);
    }, isReal ? 8000 : 6000);
  };

  useEffect(() => {
    // Function wrapper for the interval loop
    const runSimulation = () => {
      triggerAlert();
    };

    // First trigger after 4 seconds
    const initialTimeout = setTimeout(runSimulation, 4000);
    
    // Repeat every 25 seconds
    const interval = setInterval(runSimulation, 25000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [products]);

  // Handle section tracking on scroll
  useEffect(() => {
    if (activeLandingProduct) return; // Disable scroll tracking if on single product landing
    const sections = ['inicio', 'catalogo', 'testimonios', 'contacto'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeLandingProduct]);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleAddReview = (newReview: Review) => {
    setReviews((prevReviews) => [newReview, ...prevReviews]);
  };

  const handleSaveMessage = (newMsg: ContactMessage) => {
    setSavedMessages((prevMsgs) => [newMsg, ...prevMsgs]);
  };

  const handleOpenCheckoutWithProduct = (product: Product) => {
    setSingleCheckoutProduct(product);
    setIsCheckoutOpen(true);
  };

  const handleOpenGeneralCheckout = () => {
    setSingleCheckoutProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleOpenLandingProduct = (product: Product) => {
    setActiveLandingProduct(product);
    try {
      window.history.pushState({}, '', `?product=${encodeURIComponent(product.id)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  const handleCloseLandingProduct = () => {
    setActiveLandingProduct(null);
    try {
      window.history.pushState({}, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      


      {/* Navigation Bar */}
      <Navbar
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onOpenCheckout={handleOpenGeneralCheckout}
        onOpenIntegrationHub={() => setIsIntegrationHubOpen(true)}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* RENDER DEDICATED LANDING SUBPAGE OR TRADITIONAL HOMEPAGE */}
      {activeLandingProduct ? (
        <div className="pt-24 flex-1">
          <ProductLandingPage
            product={activeLandingProduct}
            allProducts={products}
            onBackToStore={handleCloseLandingProduct}
            onClearCart={() => setCart([])}
            onNewOrderAlert={(name, city, product) => triggerAlert(name, city, product, true)}
            onAddToCart={(prod) => {
              handleAddToCart(prod);
              triggerAlert('¡Excelente elección!', city || 'Colombia', `${prod.name} agregado al carrito 🐾`, true);
            }}
          />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <Hero
            onExploreCatalog={() => {
              const catElement = document.getElementById('catalogo');
              if (catElement) catElement.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenIntegrationHub={() => setIsIntegrationHubOpen(true)}
          />

          {/* Connection Status Banner */}
          {!shopifyConnected && !isLoadingProducts && (
            <div className="mx-4 sm:mx-8 lg:mx-16 mt-4 bg-amber-950/50 border border-amber-800/40 rounded-2xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-xs text-amber-300">
                  <strong>Modo Demostración</strong> — Estos productos son de ejemplo. Conecta tu Shopify Storefront API en el
                  <button onClick={() => setIsIntegrationHubOpen(true)} className="underline font-bold ml-1 hover:text-amber-200 cursor-pointer">Centro de Sincronización</button>
                  {' '}para ver tus productos reales de Dropi.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingProducts && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Cargando productos de Shopify...</p>
            </div>
          )}

          {/* Catalog & Dropshipping Margins Section */}
          {!isLoadingProducts && (
            <Catalog
              products={products}
              onAddToCart={handleAddToCart}
              onOpenCheckoutWithProduct={handleOpenCheckoutWithProduct}
              onOpenLandingProduct={handleOpenLandingProduct}
            />
          )}

          {/* Testimonials & Verified Reviews Section */}
          <Testimonials
            reviews={reviews}
            onAddReview={handleAddReview}
          />

          {/* Contact & Support Section */}
          <Contact
            onSaveMessage={handleSaveMessage}
            savedMessages={savedMessages}
          />
        </>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Flame className="h-5 w-5 text-amber-500" />
          <span className="font-sans font-extrabold text-sm tracking-widest text-white">DANTE STORE</span>
        </div>
        <p className="max-w-md mx-auto leading-relaxed">
          Tienda Oficial de Dante • Los mejores productos seleccionados para tu mascota con Envío Rápido y Pago Contra Entrega.
        </p>
        <div className="flex justify-center items-center space-x-4 text-slate-400">
          <button onClick={() => setIsIntegrationHubOpen(true)} className="hover:text-amber-500 font-bold">Configuración</button>
          <span>•</span>
          <span className="text-slate-600">© {new Date().getFullYear()} La Tienda de Dante. Todos los derechos reservados.</span>
        </div>
      </footer>

      {/* FLOATING MODAL: Shopify & Dropi Integration Hub */}
      {isIntegrationHubOpen && (
        <IntegrationHub
          products={products}
          onClose={() => setIsIntegrationHubOpen(false)}
        />
      )}

      {/* FLOATING DRAW-OVER: Cash on Delivery Checkout Form */}
      {isCheckoutOpen && (
        <Checkout
          cart={cart}
          singleProduct={singleCheckoutProduct}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSingleCheckoutProduct(null);
          }}
          onClearCart={() => setCart([])}
          onNewOrderAlert={(name, city, product) => triggerAlert(name, city, product, true)}
        />
      )}

      {/* Conversion-boosting Live Purchase Alert (Pill bottom-left) */}
      {liveAlert && (
        <div className={`fixed bottom-6 left-6 z-40 backdrop-blur p-4 rounded-xl shadow-2xl flex items-center space-x-3.5 max-w-sm animate-slideUp border transition-all duration-500 ${
          liveAlert.isReal 
            ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-[1.03]'
            : 'bg-slate-900/95 border-slate-800'
        }`}>
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${
            liveAlert.isReal ? 'bg-amber-500 text-black animate-bounce' : 'bg-amber-500/10 text-amber-500'
          }`}>
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs font-bold font-sans">
                {liveAlert.name} en {liveAlert.city}
              </span>
              {liveAlert.isReal ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] font-sans font-extrabold uppercase border border-amber-500/30 animate-pulse whitespace-nowrap">
                  ¡Tu Pedido! 🎉
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 text-[8px] font-sans font-bold uppercase whitespace-nowrap">
                  Contra Entrega
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Compró: <strong className="text-slate-200">{liveAlert.product}</strong>
            </p>
            <span className="text-[9px] text-slate-500 mt-1 block font-mono">
              Pedido registrado {liveAlert.time}
            </span>
          </div>
        </div>
      )}

      {/* Wompi Transaction Status Verification Modal Overlay */}
      {wompiStatusModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-center space-y-6 shadow-2xl animate-scaleUp">
            
            {wompiStatusModal.status === 'checking' && (
              <div className="space-y-4 py-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="font-sans font-bold text-white text-lg">Procesando Pago Seguro</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Estamos verificando el estado de tu transacción con Bancolombia Wompi. Por favor no cierres esta pestaña.
                </p>
              </div>
            )}

            {wompiStatusModal.status === 'approved' && (
              <div className="space-y-4 py-2">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="font-sans font-extrabold text-white text-xl uppercase tracking-wider">¡Pago Aprobado! 🎉</h3>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-0.5 rounded">
                    Orden: {wompiStatusModal.orderId}
                  </span>
                  <p className="text-slate-300 text-xs mt-3 leading-relaxed max-w-sm mx-auto">
                    ¡Excelente noticia! Tu pago ha sido aprobado de manera segura. Tu orden ya fue procesada y enviada al fulfillment de **Dropi** para empaque y despacho inmediato.
                  </p>
                  {wompiStatusModal.dropiId && (
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      Dropi ID: <span className="text-white">{wompiStatusModal.dropiId}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setWompiStatusModal(null)}
                  className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all"
                >
                  Entendido, ¡gracias!
                </button>
              </div>
            )}

            {(wompiStatusModal.status === 'declined' || wompiStatusModal.status === 'error') && (
              <div className="space-y-4 py-2">
                <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto">
                  <Flame className="h-7 w-7 animate-pulse" />
                </div>
                <h3 className="font-sans font-extrabold text-white text-xl uppercase tracking-wider text-red-400">
                  {wompiStatusModal.status === 'declined' ? 'Pago Rechazado ❌' : 'Error en la Transacción ⚠️'}
                </h3>
                <div className="space-y-2">
                  <p className="text-slate-350 text-xs leading-relaxed max-w-sm mx-auto">
                    Lo sentimos, tu pago para la orden <strong>{wompiStatusModal.orderId}</strong> no pudo ser completado.
                  </p>
                  {wompiStatusModal.errorMessage && (
                    <p className="p-3 bg-red-950/20 border border-red-900/30 text-[10px] text-red-300 rounded-lg italic text-left leading-normal">
                      Detalle: {wompiStatusModal.errorMessage}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setWompiStatusModal(null);
                      setIsCheckoutOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    Reintentar Pago
                  </button>
                  <button
                    onClick={() => setWompiStatusModal(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 font-sans font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <LiveSocialProof />
    </div>
  );
}
