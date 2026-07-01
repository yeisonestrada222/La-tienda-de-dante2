import { useState, FormEvent } from 'react';
import { Mail, Phone, Clock, Send, MessageSquare, Check, HelpCircle, Server } from 'lucide-react';
import { ContactMessage } from '../types';

interface ContactProps {
  onSaveMessage: (msg: ContactMessage) => void;
  savedMessages: ContactMessage[];
}

export default function Contact({ onSaveMessage, savedMessages }: ContactProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [interest, setInterest] = useState('Consulta General');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) return;

    setIsSubmitting(true);

    const messageObj: ContactMessage = {
      id: `msg-${Date.now()}`,
      name,
      email,
      phone,
      message,
      product: interest,
      date: new Date().toLocaleDateString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setTimeout(() => {
      onSaveMessage(messageObj);
      setIsSubmitting(false);
      setIsSuccess(true);

      // Reset
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setInterest('Consulta General');

      setTimeout(() => setIsSuccess(false), 5000);
    }, 1200);
  };

  return (
    <section id="contacto" className="py-24 bg-slate-900 border-t border-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Canal de Soporte y Contacto
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm">
            ¿Tienes alguna consulta de tu pedido o te interesa ser distribuidor? Escríbenos y un asesor de Dante Store te responderá en menos de 15 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
          
          {/* Left panel: Info & FAQ */}
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
            
            <div className="space-y-6">
              <h3 className="font-sans font-bold text-lg text-white">Información de Atención</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">Soporte Correo</h4>
                    <p className="text-slate-400 text-xs mt-1">soporte@tiendadante.co</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">WhatsApp Soporte</h4>
                    <p className="text-slate-400 text-xs mt-1">+57 321 456 7890</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">Horario de Servicio</h4>
                    <p className="text-slate-400 text-xs mt-1">Lunes a Sábado: 8:00 AM - 8:00 PM (Hora Colombia)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick mini-CRM dashboard info for store owner to understand saved data */}
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <Server className="h-4 w-4 text-amber-500" />
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-300">Mensajería Dante Store CRM</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                Los mensajes de clientes se simulan y almacenan temporalmente en el panel. En producción, estos datos se direccionan a tu CRM de Shopify o canal de WhatsApp.
              </p>
              {savedMessages.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedMessages.map((msg) => (
                    <div key={msg.id} className="p-2 bg-slate-900 border border-slate-800 rounded text-[10px] space-y-1">
                      <div className="flex justify-between font-bold text-slate-300">
                        <span>{msg.name} ({msg.phone})</span>
                        <span className="text-amber-500">{msg.date}</span>
                      </div>
                      <p className="text-slate-400 italic">"{msg.message}"</p>
                      <div className="text-slate-500 text-[9px] uppercase">Tema: {msg.product}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-600 text-xs italic">
                  No hay mensajes registrados aún en esta sesión.
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Contact Form */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-850 p-6 sm:p-8 rounded-2xl shadow-xl">
            <h3 className="font-sans font-extrabold text-xl text-white mb-6">Completa tus datos</h3>
            
            {isSuccess && (
              <div className="mb-6 bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-xl flex items-start space-x-3 text-emerald-400 text-xs">
                <Check className="h-5 w-5 flex-shrink-0" />
                <div>
                  <h4 className="font-sans font-bold uppercase tracking-wider">¡Formulario Recibido con éxito!</h4>
                  <p className="mt-1">Tu mensaje ha quedado registrado. En Shopify, esto gatilla una automatización de correo o un ticket inmediato de soporte.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tu Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Carlos Restrepo"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Número de Teléfono/WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 300 123 4567"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Asunto de Interés</label>
                  <select
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Consulta General">Consulta General</option>
                    <option value="Soporte de Pedido Existente">Soporte de Pedido Existente</option>
                    <option value="Deseo comprar al por mayor">Deseo comprar al por mayor</option>
                    <option value="Integración Dropi/Shopify">Pregunta técnica Integración</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tu Mensaje *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe con detalle tu duda para poder asignarte el asesor correcto..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Enviando mensaje...</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Enviar Formulario Dante</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
}
