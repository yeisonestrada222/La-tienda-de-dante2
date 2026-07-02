import { useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';

const NOTIFICATIONS = [
  { name: 'Carlos R.', city: 'Bogotá', product: 'Cama Nube Anti-Estrés Dante', time: 'Hace 3 min', pet: '🐶 Max' },
  { name: 'Valentina M.', city: 'Medellín', product: 'Cepillo Mágico de Vapor 3 en 1', time: 'Hace 6 min', pet: '😸 Luna' },
  { name: 'Andrés G.', city: 'Cali', product: 'Dispensador Inteligente de Agua', time: 'Hace 11 min', pet: '🐶 Rocky' },
  { name: 'Camila S.', city: 'Barranquilla', product: 'Pelota Indestructible Dental', time: 'Hace 14 min', pet: '🐶 Bruno' },
  { name: 'Juan Pablo D.', city: 'Bucaramanga', product: 'Arnés de Paseo Seguro Antijalones', time: 'Hace 18 min', pet: '🐕 Toby' },
];

export default function LiveSocialProof() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (closed) return;

    // Mostrar el primer mensaje a los 4 segundos
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    return () => clearTimeout(initialTimer);
  }, [closed]);

  useEffect(() => {
    if (closed || !visible) return;

    // Ocultar a los 6 segundos de visible
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 6000);

    return () => clearTimeout(hideTimer);
  }, [visible, closed]);

  useEffect(() => {
    if (closed || visible) return;

    // Cambiar al siguiente tras 8 segundos oculto
    const nextTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
      setVisible(true);
    }, 8000);

    return () => clearTimeout(nextTimer);
  }, [visible, closed]);

  if (closed || !visible) return null;

  const current = NOTIFICATIONS[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-sm">
      <div className="bg-slate-950/95 backdrop-blur-md border border-amber-500/40 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-start space-x-3 relative pr-8">
        <button
          onClick={() => setClosed(true)}
          className="absolute top-2.5 right-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
          title="Cerrar notificación"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold flex-shrink-0 text-base shadow-inner">
          🐾
        </div>

        <div className="text-left text-xs space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <span className="font-sans font-extrabold text-white">{current.name}</span>
            <span className="text-slate-400 font-mono text-[10px]">en {current.city}</span>
            <span className="text-slate-500 text-[10px]">• {current.time}</span>
          </div>

          <p className="text-amber-400 font-bold leading-tight line-clamp-1">
            {current.product}
          </p>

          <div className="flex items-center space-x-1.5 text-[10px] text-slate-300 pt-0.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            <span>Compra Contra Entrega para {current.pet}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
