import { useState } from 'react';
import { Lock, User, ShieldAlert, ArrowRight, X } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

export default function AdminLogin({ onLoginSuccess, onClose }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === 'dante' && password === 'Dante2026*') {
      setError(false);
      // Guardamos la sesión en localStorage para que dure 24h
      const sessionData = {
        authenticated: true,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('dante_admin_session', JSON.stringify(sessionData));
      onLoginSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000); // Quita el error visual después de 2s
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className={`bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden transition-transform duration-300 ${error ? 'animate-shake border-red-500/50' : ''}`}>
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-3 mb-8">
            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="font-sans font-extrabold text-xl text-white tracking-wider">ACCESO STAFF</h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">Solo personal autorizado</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="admin"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-400/10 p-2.5 rounded-lg text-xs font-bold animate-fadeIn">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>Credenciales incorrectas</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!username || !password}
              className={`w-full mt-2 py-3 font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 ${(!username || !password) ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
