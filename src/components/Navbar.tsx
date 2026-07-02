import { ShoppingCart, Code, Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../types';

interface NavbarProps {
  cart: { product: Product; quantity: number }[];
  onRemoveFromCart: (productId: string) => void;
  onOpenCheckout: () => void;
  onOpenIntegrationHub: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function Navbar({
  cart,
  onRemoveFromCart,
  onOpenCheckout,
  onOpenIntegrationHub,
  activeSection,
  setActiveSection,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const navLinks = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'testimonios', label: 'Opiniones' },
    { id: 'contacto', label: 'Contacto' },
  ];

  const handleScroll = (id: string) => {
    setIsMobileMenuOpen(false);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo with Dante Puppy paw */}
          <div 
            onClick={() => handleScroll('inicio')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="bg-amber-500 text-black p-2 rounded-xl shadow-md group-hover:bg-amber-400 transition-colors duration-300 text-xl font-bold flex items-center justify-center">
              🐾
            </div>
            <div>
              <span className="font-sans font-extrabold text-xl tracking-wider text-white">
                DANTE <span className="text-amber-500">STORE</span>
              </span>
              <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">
                Tu Tienda Familiar de Confianza
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleScroll(link.id)}
                className={`font-sans font-medium text-sm transition-colors duration-200 cursor-pointer ${
                  activeSection === link.id
                    ? 'text-amber-500 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon */}
            <div className="relative">
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black font-sans font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Cart Dropdown */}
              {isCartOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                      Tu Pedido (Pago Contra Entrega)
                    </h3>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-slate-400 text-sm">Tu carrito está vacío.</p>
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          handleScroll('catalogo');
                        }}
                        className="mt-3 text-amber-500 hover:text-amber-400 text-xs font-bold underline cursor-pointer"
                      >
                        Ver favoritos de Dante
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex items-center space-x-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-sans font-semibold text-xs text-white truncate">
                                {item.product.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Cantidad: {item.quantity} × ${item.product.price.toLocaleString('es-CO')}
                              </p>
                            </div>
                            <button
                              onClick={() => onRemoveFromCart(item.product.id)}
                              className="text-red-400 hover:text-red-300 p-1 text-[10px] uppercase font-bold cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-800 mt-4 pt-3 space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Subtotal:</span>
                          <span className="text-white font-bold">${totalPrice.toLocaleString('es-CO')} COP</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-emerald-400 bg-emerald-950/30 p-1.5 rounded border border-emerald-900/30">
                          <span>Envío Nacional:</span>
                          <span className="font-bold">¡GRATIS CONTRA ENTREGA!</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsCartOpen(false);
                            onOpenCheckout();
                          }}
                          className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase rounded-lg tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        >
                          <span>ORDENAR CONTRA ENTREGA</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="flex md:hidden items-center space-x-3">
            {/* Mobile Cart Icon */}
            <button
              onClick={() => {
                setIsCartOpen(!isCartOpen);
                setIsMobileMenuOpen(false);
              }}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-bold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsCartOpen(false);
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-850 p-4 space-y-4 animate-fadeIn">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleScroll(link.id)}
                className={`text-left py-2 font-sans font-medium text-sm transition-colors cursor-pointer ${
                  activeSection === link.id ? 'text-amber-500' : 'text-slate-300'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Cart Panel Backdrop (Mobile only) */}
      {isCartOpen && (
        <div className="md:hidden fixed inset-0 top-20 bg-slate-950/80 backdrop-blur-sm z-40 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="font-sans font-bold text-sm text-white">MI PEDIDO CONTRA ENTREGA</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">El carrito está vacío.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 bg-slate-950/50 p-2 rounded-lg">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans font-semibold text-xs text-white truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-slate-400">${item.product.price.toLocaleString('es-CO')} COP</p>
                    </div>
                    <button onClick={() => onRemoveFromCart(item.product.id)} className="text-red-400 text-xs cursor-pointer">Eliminar</button>
                  </div>
                ))}
                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-white font-bold">
                    <span>Total:</span>
                    <span>${totalPrice.toLocaleString('es-CO')} COP</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      onOpenCheckout();
                    }}
                    className="w-full py-2 bg-amber-500 text-black text-xs font-extrabold rounded-lg uppercase tracking-wider cursor-pointer"
                  >
                    Ordenar Contra Entrega
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
