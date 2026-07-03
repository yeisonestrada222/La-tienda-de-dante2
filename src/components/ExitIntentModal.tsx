// src/components/ExitIntentModal.tsx
// Modal de recuperación de carrito abandonado — OPT #4 CRO
import { X, Truck, ShieldCheck } from 'lucide-react';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  cartTotal: number;
}

export default function ExitIntentModal({ isOpen, onClose, onOpenCheckout, cartTotal }: ExitIntentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-[0_0_60px_rgba(245,158,11,0.3)]"
        style={{ animation: 'fadeScaleIn 0.3s ease' }}
      >
        <style>{`@keyframes fadeScaleIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }`}</style>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-5xl">🐾</div>

        <div>
          <span className="block text-xs font-mono text-amber-400 uppercase tracking-widest mb-2 font-bold">
            ¡Espera! Dante tiene algo para ti
          </span>
          <h2 className="font-sans font-extrabold text-2xl text-white leading-tight">
            ¿Te vas sin tu pedido?
          </h2>
          {cartTotal > 0 && (
            <p className="text-slate-300 text-sm mt-2">
              Tienes{' '}
              <strong className="text-amber-400">${cartTotal.toLocaleString('es-CO')} COP</strong>{' '}
              en tu carrito.{' '}
              <strong>Pagas solo cuando lo recibes</strong> 🚚
            </p>
          )}
        </div>

        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 font-semibold">
          ⏰ El stock de tus productos seleccionados es limitado
        </div>

        <div className="flex justify-center space-x-6 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Truck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Envío Express</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Sin pago anticipado</span>
          </div>
        </div>

        <button
          onClick={() => { onClose(); onOpenCheckout(); }}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          Completar mi Pedido Ahora 🚀
        </button>

        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          No gracias, me voy sin mi pedido
        </button>
      </div>
    </div>
  );
}
