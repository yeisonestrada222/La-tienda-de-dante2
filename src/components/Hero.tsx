import { useState } from 'react';
import { ArrowRight, ShieldCheck, Truck, Sparkles, Heart, MessageCircle } from 'lucide-react';

interface HeroProps {
  onExploreCatalog: () => void;
  onOpenIntegrationHub: () => void;
}

const DANTE_QUOTES = [
  "Aquí no hay compras con miedo ni envíos complicados. Todos nuestros despachos en Colombia son con Pago Contra Entrega y Envío Gratis. Tú pides, te llega a la puerta de tu casa en 1 a 3 días, y pagas en efectivo cuando lo recibes. ¡Garantía garantizada de lamidas de felicidad!",
  "¡Guau! Si llevas 2 o más productos en tu pedido, te aplicamos un descuento especial del Club de Amigos de Dante directamente en el carrito 🐶✨",
  "Mi humano empaca cada pedido con muchísimo cuidado y le ponemos una estampita de agradecimiento firmada con mi patita 🐾🇨🇴"
];

export default function Hero({ onExploreCatalog, onOpenIntegrationHub }: HeroProps) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  const cycleQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % DANTE_QUOTES.length);
  };

  return (
    <section 
      id="inicio" 
      className="relative pt-32 pb-20 md:pt-40 md:pb-32 bg-slate-950 overflow-hidden"
    >
      {/* Background Decorative Gradients & Radial Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] rounded-full bg-slate-800/20 blur-[80px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Split Layout: Storyteller Puppy & Headlines */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Story intro */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Elegant Floating Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>Tienda Oficial Dante 🐾 • Envío Gratis & Contra Entrega</span>
            </div>

            {/* Display Title */}
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight">
              ¡Hola! Soy <span className="text-amber-500 font-black relative">Dante<span className="absolute -bottom-1 left-0 w-full h-1.5 bg-amber-500/30 rounded"></span></span> y esta es mi tienda 🐾
            </h1>

            <p className="text-slate-300 font-sans text-base sm:text-lg md:text-xl leading-relaxed">
              Soy un tierno cachorro <strong className="text-amber-400">Golden Retriever</strong>. Junto a mi humano creamos este espacio familiar para recomendarte únicamente los mejores productos de alta calidad que yo mismo apruebo para mis siestas, paseos y diversión diaria. <span className="text-yellow-400 font-semibold">¡Hoy me puse la camiseta de la Selección Colombia para atenderte! 🇨🇴⚽</span>
            </p>

            {/* Story Box - Puppy's Perspective (Enormous trust builder for repurchase) */}
            <div 
              onClick={cycleQuote}
              className="p-5 bg-slate-900/80 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 relative overflow-hidden transition-all duration-300 cursor-pointer shadow-lg group"
            >
              <div className="absolute top-3 right-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Heart className="h-24 w-24 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-sans font-bold text-xs text-amber-500 uppercase tracking-wider flex items-center space-x-2">
                  <span>El Rincón de Dante (Tip #{quoteIdx + 1})</span>
                </h4>
                <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3 inline mr-1" />
                  <span>Toca para escuchar a Dante</span>
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed italic relative z-10 min-h-[50px] transition-all">
                "{DANTE_QUOTES[quoteIdx]}"
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={onExploreCatalog}
                className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Ver Mis Favoritos</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={cycleQuote}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-amber-400 border border-amber-500/30 hover:border-amber-500 font-sans font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>¿Qué dice Dante hoy?</span>
              </button>
            </div>

          </div>

          {/* Right Column: Interactive Golden Retriever Mascot Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              {/* Outer tricolor pulse glow */}
              <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-blue-500 to-red-500 rounded-[2.7rem] blur-md opacity-45" />
              
              <div className="relative bg-slate-900 border-4 border-slate-800 p-3 rounded-[2.5rem] shadow-2xl overflow-hidden max-w-sm sm:max-w-md">
                {/* Tricolor Colombia Flag Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 flex z-20">
                  <div className="w-1/2 bg-yellow-500" />
                  <div className="w-1/4 bg-blue-600" />
                  <div className="w-1/4 bg-red-600" />
                </div>

                {/* Dog Photo Container */}
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-950 border border-slate-800 mt-1">
                  <img
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600"
                    alt="Dante el cachorro Golden Retriever con Camiseta de Colombia"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Floating Colombia Jersey Shield Overlay over the dog's chest */}
                  <div className="absolute top-[62%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black px-2.5 py-1.5 rounded-xl border-2 border-amber-300 shadow-2xl flex items-center space-x-1.5 animate-pulse z-20">
                    <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full text-xs shadow-inner">⚽</div>
                    <div className="flex flex-col text-[8px] leading-none font-sans font-black tracking-wider">
                      <span className="text-[7px] text-blue-800">COLOMBIA</span>
                      <span className="text-black uppercase">DANTE #10</span>
                    </div>
                  </div>

                  {/* Floating Selección Badge on Top-Right */}
                  <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[9px] font-extrabold px-3 py-1.5 rounded-full text-yellow-400 flex items-center space-x-1 shadow-lg z-20">
                    <span className="animate-pulse">🇨🇴</span>
                    <span>HINCHA OFICIAL</span>
                  </div>

                  {/* Floating tag inside photo */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm p-3 rounded-xl border border-slate-800 flex items-center justify-between z-20">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-yellow-400 font-mono">Mascota Fundadora</span>
                      <span className="block text-white text-xs font-bold font-sans">Dante (Golden Retriever • Tricolor)</span>
                    </div>
                    <span className="bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                      Activo 🇨🇴🐾
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Value Propositions */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto border-t border-slate-900 pt-12">
          
          <div className="flex flex-col items-center p-5 bg-slate-900/40 rounded-2xl border border-slate-900/50">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 mb-4">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="font-sans font-bold text-white text-base">Envío Gratis & Contra Entrega</h3>
            <p className="text-slate-400 text-xs text-center mt-2 max-w-xs leading-relaxed">
              Paga cómodamente en efectivo al recibir el producto en tu hogar. Sin tarjetas de crédito, sin complicaciones.
            </p>
          </div>

          <div className="flex flex-col items-center p-5 bg-slate-900/40 rounded-2xl border border-slate-900/50">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-sans font-bold text-white text-base">Garantía Protegida</h3>
            <p className="text-slate-400 text-xs text-center mt-2 max-w-xs leading-relaxed">
              Todos los productos son revisados meticulosamente bajo el estándar de Dante Store y cuentan con cobertura total de cambios.
            </p>
          </div>

          <div className="flex flex-col items-center p-5 bg-slate-900/40 rounded-2xl border border-slate-900/50">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 mb-4">
              🐾
            </div>
            <h3 className="font-sans font-bold text-white text-base">Trato Familiar</h3>
            <p className="text-slate-400 text-xs text-center mt-2 max-w-xs leading-relaxed">
              Creemos firmemente en la cercanía y confianza. Por eso te atendemos personalmente y te acompañamos en cada compra.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
