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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-xl mx-auto mb-4">
            <span className="text-white font-bold text-2xl">FG</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Forum dei Giovani</h1>
          <p className="text-slate-500 mt-1">Gestione Interna</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">
            {mode === 'login' ? 'Accedi al tuo account' : 'Crea account'}
          </h2>

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Nome e Cognome *</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Mario Rossi"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Se sei già nell'anagrafica usa la stessa email — riceverai il ruolo assegnato.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Email</label>
              <input
                type="email"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="tua@email.it"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handle()}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                  placeholder="min. 6 caratteri"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handle()}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-600">{error}</div>}
            {success && <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-700">{success}</div>}

            <button onClick={handle} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {mode === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium">
              {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Accesso riservato ai soci del Forum dei Giovani</p>
      </div>
    </div>
  );
}
