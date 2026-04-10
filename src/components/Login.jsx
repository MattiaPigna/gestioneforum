import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nome: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async () => {
    if (!form.email || !form.password) { setError('Compila tutti i campi'); return; }
    if (mode === 'register' && !form.nome.trim()) { setError('Inserisci il tuo nome'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    if (mode === 'login') {
      const { error } = await login(form.email, form.password);
      if (error) setError(error.message === 'Invalid login credentials' ? 'Email o password errati' : error.message);
    } else {
      const { error, message } = await register(form.email, form.password, form.nome);
      if (error) setError(error.message);
      else setSuccess(message || 'Controlla la tua email per confermare la registrazione.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5f0 100%)' }}>

      <div className="w-full max-w-md">

        {/* Logo e titolo */}
        <div className="text-center mb-8">
          <div className="w-18 h-18 mx-auto mb-4 relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-blue-200 mx-auto">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            {/* anello decorativo */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/20 to-teal-400/20 scale-110 -z-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Forum dei Giovani</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Gestione Interna</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/80 border border-white/80 p-7">

          {/* Tabs login/registra */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              Accedi
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              Registrati
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Nome e Cognome *</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-slate-400"
                  placeholder="Mario Rossi"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Se sei già nell'anagrafica usa la stessa email per ricevere il ruolo assegnato.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-slate-400"
                placeholder="tua@email.it"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handle()}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 pr-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-slate-400"
                  placeholder="min. 6 caratteri"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handle()}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                <span className="text-rose-400 mt-0.5 shrink-0">⚠️</span>
                <p className="text-sm text-rose-600 font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                <span className="text-teal-400 mt-0.5 shrink-0">✅</span>
                <p className="text-sm text-teal-700 font-medium">{success}</p>
              </div>
            )}

            <button onClick={handle} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all mt-2">
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5 font-medium">
          Accesso riservato ai soci del Forum dei Giovani
        </p>
      </div>
    </div>
  );
}
