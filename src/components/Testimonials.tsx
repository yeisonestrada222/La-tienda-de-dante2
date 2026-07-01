import { useState, FormEvent } from 'react';
import { Review } from '../types';
import { Star, MessageSquare, CheckCircle, User, PlusCircle } from 'lucide-react';

interface TestimonialsProps {
  reviews: Review[];
  onAddReview: (review: Review) => void;
}

export default function Testimonials({ reviews, onAddReview }: TestimonialsProps) {
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const reviewObj: Review = {
      id: `rev-custom-${Date.now()}`,
      author: newReviewAuthor,
      comment: newReviewComment,
      rating: newReviewRating,
      date: 'Hace un momento',
      verified: true,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=120`
    };

    onAddReview(reviewObj);
    
    // Clean states
    setNewReviewAuthor('');
    setNewReviewComment('');
    setNewReviewRating(5);
    setIsFormOpen(false);
    
    setSuccessMessage('¡Muchas gracias! Tu opinión ha sido publicada y se integrará en tu panel de Shopify automáticamente.');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <section id="testimonios" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Opiniones de Clientes Reales
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm">
            Nuestros clientes avalan la calidad de Dante Store. El sistema de valoraciones es totalmente integrable en Shopify para dar máxima confianza de compra.
          </p>
        </div>

        {/* Global Stars Rating Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl mx-auto mb-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-sans font-extrabold text-white text-lg">Puntuación de la Tienda</h3>
            <div className="flex items-center justify-center md:justify-start space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-amber-500 font-mono">4.9</span>
              <span className="text-slate-500 text-lg">/</span>
              <span className="text-slate-400 text-base font-medium">5.0 Estrellas</span>
            </div>
            <div className="flex items-center space-x-1 mt-3 justify-center md:justify-start">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-amber-500 text-amber-500" />
              ))}
            </div>
          </div>

          <div className="h-px w-full md:h-12 md:w-px bg-slate-800" />

          <div className="text-center md:text-left text-xs text-slate-400 space-y-2 max-w-sm">
            <p>✔ <strong>98% de entregas exitosas</strong> con pago contra entrega en Colombia.</p>
            <p>✔ Reseñas recopiladas directamente de clientes verificados mediante correo electrónico.</p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Escribir mi opinión</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="max-w-4xl mx-auto mb-8 bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-xl text-center text-xs text-emerald-400 font-medium">
            {successMessage}
          </div>
        )}

        {/* Interactive Add Review Form */}
        {isFormOpen && (
          <form 
            onSubmit={handleReviewSubmit}
            className="bg-slate-900 border border-slate-850 p-6 rounded-2xl max-w-2xl mx-auto mb-16 space-y-4 animate-fadeIn"
          >
            <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
              Déjanos tu comentario verificado
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  placeholder="Ej. Andrés Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Calificación:</label>
                <div className="flex items-center space-x-2 h-9">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 focus:outline-none cursor-pointer"
                    >
                      <Star 
                        className={`h-6 w-6 ${
                          star <= newReviewRating 
                            ? 'fill-amber-500 text-amber-500' 
                            : 'text-slate-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tu Experiencia o Comentario:</label>
              <textarea
                required
                rows={3}
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="Escribe qué te pareció el producto, el tiempo de entrega y la atención..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-sans text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-black font-sans font-extrabold text-xs uppercase tracking-wider rounded-lg hover:bg-amber-400"
              >
                Publicar Reseña
              </button>
            </div>
          </form>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-md hover:border-slate-800 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {review.avatarUrl ? (
                      <img
                        src={review.avatarUrl}
                        alt={review.author}
                        className="w-10 h-10 rounded-full object-cover border border-slate-800 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 font-sans font-bold text-sm">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-sans font-bold text-sm text-white">{review.author}</h4>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`h-3 w-3 ${
                                s <= review.rating 
                                  ? 'fill-amber-500 text-amber-500' 
                                  : 'text-slate-700'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500">• {review.date}</span>
                      </div>
                    </div>
                  </div>

                  {review.verified && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-950/50 border border-emerald-900/30 rounded text-emerald-400 text-[9px] font-sans font-bold uppercase tracking-wider">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      <span>Verificado</span>
                    </span>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-slate-300 text-xs italic leading-relaxed font-sans">
                  "{review.comment}"
                </p>
              </div>

              {/* Verified order feedback */}
              <div className="mt-4 pt-4 border-t border-slate-850/50 flex items-center justify-between text-[10px] text-slate-500">
                <span>Plataforma: Shopify Store</span>
                <span>Fulfillment: Dropi</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
