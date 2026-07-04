import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Catalog from './components/Catalog';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Checkout from './components/Checkout';
import IntegrationHub from './components/IntegrationHub';
import ProductLandingPage from './components/ProductLandingPage';
import ExitIntentModal from './components/ExitIntentModal';
import AdminLogin from './components/AdminLogin';
import { useExitIntent } from './hooks/useExitIntent';

import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from './data';
import { Product, Review, ContactMessage } from './types';
import { Flame, Sparkles, ShoppingBag, Lock } from 'lucide-react';
import { syncOrderToDropi } from './utils/api';
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
  
  // QA Bug P2: Carrito persistente en localStorage
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem('dante_cart') || '[]'); }
    catch { return []; }
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [singleCheckoutProduct, setSingleCheckoutProduct] = useState<Product | null>(null);

  // CRO OPT #4: Exit Intent state
  const [isExitIntentOpen, setIsExitIntentOpen] = useState(false);
  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  useExitIntent({
    onExitIntent: useCallback(() => {
      if (cart.length > 0 && !isCheckoutOpen) setIsExitIntentOpen(true);
    }, [cart.length, isCheckoutOpen]),
    once: true,
  });

  // QA Bug 1: Restablecer modal si vacían el carrito
  useEffect(() => {
    if (cart.length === 0) setIsExitIntentOpen(false);
  }, [cart.length]);
  
  // Active Landing Product for campaign funnel (Subpágina dedicada)
  const [activeLandingProduct, setActiveLandingProduct] = useState<Product | null>(null);

  // Detectar si la URL tiene parámetro ?product=... o #producto/... para campañas directas en Ads
  useEffect(() => {
    if (products.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product') || params.get('p');
    
    // Check hash for #producto/id
    const hashMatch = window.location.hash.match(/#producto\/(.+)/);
    const targetId = productId || (hashMatch ? hashMatch[1] : null);

    if (targetId) {
      const decoded = decodeURIComponent(targetId).toLowerCase();
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

  // QA Bug 2: Manejar el botón 'Atrás' del navegador
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('product') && !params.get('p') && !window.location.hash.includes('producto')) {
        setActiveLandingProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Integration Hub & Admin Login state
  const [isIntegrationHubOpen, setIsIntegrationHubOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const handleOpenConfig = () => {
    const sessionStr = localStorage.getItem('dante_admin_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        // Valid for 24 hours
        if (session.authenticated && new Date().getTime() - session.timestamp < 24 * 60 * 60 * 1000) {
          setIsIntegrationHubOpen(true);
          return;
        }
      } catch (e) {}
    }
    setIsAdminLoginOpen(true);
  };
  
  // Active UI Navigation state
  const [activeSection, setActiveSection] = useState('inicio');
  const [categoriesTick, setCategoriesTick] = useState(0);

  useEffect(() => {
    const handleCatUpdate = () => setCategoriesTick(n => n + 1);
    window.addEventListener('dante_categories_updated', handleCatUpdate);
    return () => window.removeEventListener('dante_categories_updated', handleCatUpdate);
  }, []);

  const displayProducts = useMemo(() => {
    try {
      const customCats = JSON.parse(localStorage.getItem('dante_custom_categories') || '{}');
      return products.map(p => {
        if (customCats[p.id]) {
          return { ...p, category: customCats[p.id] };
        }
        return p;
      });
    } catch {
      return products;
    }
  }, [products, categoriesTick]);

  // Interactive Live Purchase Notification Alert
  const [liveAlert, setLiveAlert] = useState<{ name: string; city: string; product: string; time: string; isReal?: boolean } | null>(null);
  const alertTimeoutRef = useRef<any>(null);

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

  // QA Bug P3: simulation alert only fires once on mount (not on every products change)
  const productsRef = useRef(products);
  productsRef.current = products;

  useEffect(() => {
    const runSimulation = () => {
      const currentProducts = productsRef.current;
      triggerAlert(
        undefined, undefined,
        currentProducts.length > 0 ? currentProducts[Math.floor(Math.random() * currentProducts.length)].name : 'Producto Dante'
      );
    };

    const initialTimeout = setTimeout(runSimulation, 4000);
    const interval = setInterval(runSimulation, 25000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);  // no depende de products para evitar re-montar

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
      let newCart;
      if (existing) {
        newCart = prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newCart = [...prevCart, { product, quantity: 1 }];
      }
      localStorage.setItem('dante_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.product.id !== productId);
      localStorage.setItem('dante_cart', JSON.stringify(newCart));
      return newCart;
    });
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
            allProducts={displayProducts}
            onBackToStore={handleCloseLandingProduct}
            onClearCart={() => { setCart([]); localStorage.removeItem('dante_cart'); }}
            onNewOrderAlert={(name, city, product) => triggerAlert(name, city, product, true)}
            onAddToCart={(prod) => {
              handleAddToCart(prod);
              triggerAlert('¡Excelente elección!', 'Colombia', `${prod.name} agregado al carrito 🐾`, true);
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
                  <strong>Modo Demostración</strong> — Estos productos son de ejemplo. Conecta tu tienda en el
                  <button onClick={() => setIsIntegrationHubOpen(true)} className="underline font-bold ml-1 hover:text-amber-200 cursor-pointer">Centro de Sincronización</button>
                  {' '}para ver tus productos reales.
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
              products={displayProducts}
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
          <button onClick={handleOpenConfig} className="hover:text-amber-500 font-bold flex items-center space-x-1 cursor-pointer">
            <Lock className="h-3 w-3 mr-1" />
            <span>Acceso Staff</span>
          </button>
          <span>•</span>
          <span className="text-slate-600">© {new Date().getFullYear()} La Tienda de Dante. Todos los derechos reservados.</span>
        </div>
      </footer>

      {/* FLOATING MODAL: Shopify & Dropi Integration Hub */}
      {isAdminLoginOpen && (
        <AdminLogin 
          onLoginSuccess={() => {
            setIsAdminLoginOpen(false);
            setIsIntegrationHubOpen(true);
          }}
          onClose={() => setIsAdminLoginOpen(false)}
        />
      )}

      {isIntegrationHubOpen && (
        <IntegrationHub
          products={displayProducts}
          onClose={() => setIsIntegrationHubOpen(false)}
        />
      )}

      {/* FLOATING DRAW-OVER: Cash on Delivery Checkout Form */}
      {isCheckoutOpen && (
        <Checkout
          isOpen={isCheckoutOpen}
          cart={cart}
          singleProduct={singleCheckoutProduct}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSingleCheckoutProduct(null);
          }}
          onClearCart={() => { setCart([]); localStorage.removeItem('dante_cart'); }}
          onNewOrderAlert={(name, city, product) => triggerAlert(name, city, product, true)}
        />
      )}

      {/* CRO OPT #4: Exit Intent Modal para recuperar abandonos de carrito */}
      {isExitIntentOpen && cart.length > 0 && (
        <ExitIntentModal
          isOpen={isExitIntentOpen}
          onClose={() => setIsExitIntentOpen(false)}
          onOpenCheckout={handleOpenGeneralCheckout}
          cartTotal={cartTotal}
        />
      )}

      {/* Conversion-boosting Live Purchase Alert (Pill bottom-left) — QA Bug P1: único sistema */}
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
    </div>
  );
}
