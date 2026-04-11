import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Mail, Calendar, Shield, CheckCircle, Clock, Circle, LogOut, Download, Bell, RefreshCw } from 'lucide-react';
import { exportSociCSV } from '../utils/export';

const statoConfig = {
  'To Do': { color: 'bg-slate-100 text-slate-600', icon: Circle },
  'In Progress': { color: 'bg-blue-100 text-blue-600', icon: Clock },
  'Done': { color: 'bg-teal-100 text-teal-600', icon: CheckCircle },
};
const prioritaColor = {
  Alta: 'bg-rose-100 text-rose-600',
  Media: 'bg-amber-100 text-amber-600',
  Bassa: 'bg-emerald-100 text-emerald-600',
};

export default function Profilo() {
  const { socio, logout } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  const forzaAggiornamento = async () => {
    // Svuota tutte le cache del browser
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    // Dis-registra tutti i service worker
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    // Ricarica forzata (bypassa cache)
    window.location.reload(true);
  };

  const testPush = async () => {
    setTesting(true);
    setTestResult('Invio...');
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { title: '🔔 Test notifica', body: 'Funziona!', url: '/', assegnatario: socio.nome },
      });
      if (error) {
        // Leggi il corpo della risposta per vedere l'errore dettagliato
        try {
          const body = await error.context.json();
          setTestResult('Errore: ' + JSON.stringify(body));
        } catch {
          setTestResult('Errore (no body): ' + error.message);
        }
      } else {
        setTestResult('✅ ' + JSON.stringify(data));
      }
    } catch (e) {
      setTestResult('Eccezione: ' + e.message);
    }
    setTesting(false);
  };

  useEffect(() => {
    if (!socio) { setLoading(false); return; }
    supabase.from('tasks').select('*').ilike('assegnatario', `%${socio.nome}%`).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMyTasks(data); setLoading(false); });
  }, [socio]);

  if (!socio) return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
      <p className="text-sm">Profilo non trovato. Assicurati che la tua email corrisponda a un socio registrato.</p>
    </div>
  );

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={24} className="animate-spin mr-2" />
    </div>
  );

  const taskCompletati = myTasks.filter(t => t.stato === 'Done').length;
  const taskAperti = myTasks.filter(t => t.stato !== 'Done').length;

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="page-title">Il mio Profilo</h2>

      {/* Card profilo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg shrink-0">
            <span className="text-white text-2xl font-bold">{socio.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{socio.nome}</h3>
            <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">{socio.ruolo}</span>
          </div>
        </div>

        {/* Info dettagli */}
        <div className="mt-4 space-y-2">
          {socio.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{socio.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={15} className="text-slate-400 shrink-0" />
            <span>Iscritto dal {socio.iscrizione}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield size={15} className="text-slate-400 shrink-0" />
            <span>{['Presidente','Vice Presidente','Segretario'].includes(socio.ruolo) ? 'Accesso amministratore' : 'Accesso base'}</span>
          </div>
        </div>

        {/* Bottoni azioni */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={forzaAggiornamento}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-teal-200 text-teal-600 bg-teal-50 font-semibold text-sm active:bg-teal-100 transition-colors">
            <RefreshCw size={16} /> Aggiorna app
          </button>
          <button onClick={testPush} disabled={testing}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-200 text-blue-600 bg-blue-50 font-semibold text-sm active:bg-blue-100 transition-colors disabled:opacity-50">
            <Bell size={16} /> {testing ? 'Invio...' : 'Test notifica'}
          </button>
          <button onClick={logout}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-rose-200 text-rose-600 bg-rose-50 font-semibold text-sm active:bg-rose-100 transition-colors">
            <LogOut size={16} /> Esci
          </button>
        </div>

        {testResult && (
          <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 font-mono break-all">
            {testResult}
          </div>
        )}
      </div>

      {/* Stats personali */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Task Totali', value: myTasks.length, color: 'text-slate-700' },
          { label: 'Completati', value: taskCompletati, color: 'text-teal-600' },
          { label: 'Aperti', value: taskAperti, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* I miei task */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">I miei Task</h3>
        {myTasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Nessun task assegnato</p>
        ) : (
          <div className="space-y-2">
            {myTasks.map(task => {
              const stato = statoConfig[task.stato] || statoConfig['To Do'];
              const Icon = stato.icon;
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <Icon size={15} className={task.stato === 'Done' ? 'text-teal-500' : task.stato === 'In Progress' ? 'text-blue-500' : 'text-slate-400'} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.stato === 'Done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.titolo}</p>
                    {task.scadenza && <p className="text-xs text-slate-400 mt-0.5">Scadenza: {task.scadenza}</p>}
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioritaColor[task.priorita]}`}>{task.priorita}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stato.color}`}>{task.stato}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
