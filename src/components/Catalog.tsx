import { useState, useMemo } from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onOpenCheckoutWithProduct: (product: Product) => void;
  onOpenLandingProduct: (product: Product) => void;
}

export default function Catalog({ products, onAddToCart, onOpenCheckoutWithProduct, onOpenLandingProduct }: CatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeDanteTipId, setActiveDanteTipId] = useState<string | null>(null);

  // Generamos categorías reales y dinámicas según los productos de Dropi / Shopify
  const categories = useMemo(() => {
    const setCats = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category !== 'Favoritos de Dante' && p.category !== 'Todos') {
        setCats.add(p.category);
      }
    });
    return ['Todos', 'Favoritos de Dante', ...Array.from(setCats)];
  }, [products]);

  // Filtrado inteligente: si eligen Favoritos de Dante, mostramos categoría explícita O productos destacados/top ventas
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todos') return products;
    if (selectedCategory === 'Favoritos de Dante') {
      const explicitFavs = products.filter(p => p.category === 'Favoritos de Dante' || p.badge?.includes('Destacado'));
      if (explicitFavs.length > 0) return explicitFavs;
      // Si ninguno tiene la etiqueta explícita, mostramos los 4 mejores para que nunca aparezca vacío
      return products.slice(0, 4);
    }
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const toggleDanteTip = (productId: string) => {
    setActiveDanteTipId(prev => prev === productId ? null : productId);
  };

  return (
    <section id="catalogo" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Artículos Seleccionados con Amor</span>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight mt-2">
            El Catálogo de Dante 🐾
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Productos ganadores para mascotas y el hogar, aprobados directamente por nuestro pequeño Golden Retriever Dante. Ideales para garantizar recompra y fidelidad familiar en cada pedido.
          </p>
          
          {/* Category Filters */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500 text-xl font-bold">
              🐾
            </div>
            <h3 className="font-sans font-bold text-lg text-white">Catálogo en Sincronización</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No encontramos productos disponibles para esta categoría en este momento. Por favor verifica que estén activos en tu bodega.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
            const discountPercent = hasDiscount 
              ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
              : 0;
            const isTipOpen = activeDanteTipId === product.id;

            return (
              <div 
                key={product.id} 
                className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_0_35px_rgba(245,158,11,0.22)] hover:border-amber-500/50 transition-all duration-300 flex flex-col group"
              >
                {/* Product Image Panel */}
                <div className="relative aspect-square overflow-hidden bg-slate-900 cursor-pointer" onClick={() => onOpenLandingProduct(product)}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute top-4 left-4 bg-amber-500 text-black font-sans font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md shadow">
                      {product.badge}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white font-sans font-bold text-[10px] px-2 py-1 rounded-md">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Content Panel */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-slate-500">
                    <span>{product.category}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-slate-300 font-bold">{product.rating}</span>
                    </div>
                  </div>

                  <h3 
                    onClick={() => onOpenLandingProduct(product)}
                    className="mt-3 font-sans font-bold text-lg text-white leading-tight hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    {product.name}
                  </h3>

                  <p className="mt-2 text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {product.description.replace(/<[^>]*>/gm, '').replace(/&nbsp;/g, ' ').trim()}
                  </p>

                  {/* Pricing block */}
                  <div className="mt-4 flex items-baseline space-x-3">
                    <span className="text-2xl font-extrabold text-amber-500">
                      ${product.price.toLocaleString('es-CO')} COP
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-500 line-through">
                        ${product.compareAtPrice!.toLocaleString('es-CO')} COP
                      </span>
                    )}
                  </div>

                  {/* Quick features summary */}
                  <div className="mt-4 pt-4 border-t border-slate-900 space-y-1.5 flex-1">
                    {product.features.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-center text-[11px] text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 mr-2 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dante Interactive Quote Button */}
                  <div className="mt-4 pt-2">
                    <button
                      onClick={() => toggleDanteTip(product.id)}
                      className="w-full py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      <span>{isTipOpen ? "Ocultar consejo de Dante" : "🐶 ¿Qué opina Dante de esto?"}</span>
                    </button>

                    {isTipOpen && (
                      <div className="mt-2 p-3 bg-slate-900/95 border border-amber-500/40 rounded-xl text-[11px] text-slate-200 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
                        <p className="italic">
                          <strong className="text-amber-400 not-italic">Dante dice:</strong> "¡Guau! Me encanta este producto porque es ultra resistente y perfecto para el día a día. Además, te llega con pago contra entrega en toda Colombia 🐾"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onOpenLandingProduct(product)}
                      className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/30"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Al Carrito</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

      </div>
    </section>
  );
}
