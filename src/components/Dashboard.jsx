import { useState, useEffect } from 'react';
import { Users, CheckSquare, Vote, TrendingUp, Calendar, Bell, ArrowUp, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const statoColor = {
  'To Do': 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-600',
  'Done': 'bg-teal-100 text-teal-600',
};
const prioritaColor = {
  'Alta': 'bg-rose-100 text-rose-600',
  'Media': 'bg-amber-100 text-amber-600',
  'Bassa': 'bg-emerald-100 text-emerald-600',
};

const tipoColor = {
  riunione: 'bg-blue-100 text-blue-600',
  scadenza: 'bg-rose-100 text-rose-600',
  evento:   'bg-teal-100 text-teal-600',
  workshop: 'bg-violet-100 text-violet-600',
  altro:    'bg-slate-100 text-slate-600',
};

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState({ soci: [], tasks: [], proposte: [], eventi: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const oggi = new Date().toISOString().split('T')[0];
      const [{ data: soci }, { data: tasks }, { data: proposte }, { data: eventi }] = await Promise.all([
        supabase.from('soci').select('id'),
        supabase.from('tasks').select('id, titolo, assegnatario, priorita, stato, scadenza').order('created_at', { ascending: false }).limit(4),
        supabase.from('proposte').select('id, titolo, autore, upvotes, downvotes').order('upvotes', { ascending: false }).limit(3),
        supabase.from('eventi').select('id, titolo, data, ora, tipo').gte('data', oggi).order('data').limit(4),
      ]);
      setData({ soci: soci || [], tasks: tasks || [], proposte: proposte || [], eventi: eventi || [] });
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento dashboard...
    </div>
  );

  const { soci, tasks, proposte, eventi } = data;
  const taskAperti = tasks.filter(t => t.stato !== 'Done').length;
  const taskCompletati = tasks.filter(t => t.stato === 'Done').length;
  const taskUrgenti = tasks.filter(t => t.priorita === 'Alta' && t.stato !== 'Done').length;
  const totVoti = proposte.reduce((s, p) => s + (p.upvotes || 0), 0);

  const stats = [
    { label: 'Soci Attivi', value: soci.length, icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-500', delta: 'registrati' },
    { label: 'Task Aperti', value: taskAperti, icon: CheckSquare, bg: 'bg-teal-50', iconColor: 'text-teal-500', delta: `${taskCompletati} completati` },
    { label: 'Proposte Attive', value: proposte.length, icon: Vote, bg: 'bg-violet-50', iconColor: 'text-violet-500', delta: `${totVoti} voti totali` },
    { label: 'Task Urgenti', value: taskUrgenti, icon: TrendingUp, bg: 'bg-rose-50', iconColor: 'text-rose-500', delta: 'priorità alta' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Buongiorno! 👋</h2>
          <p className="text-slate-500 mt-1">Ecco il riepilogo del Forum dei Giovani</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, bg, iconColor, delta }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`${bg} p-2 rounded-xl`}>
                <Icon size={18} className={iconColor} />
              </div>
              <ArrowUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
            <p className="text-xs text-slate-400 mt-1">{delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Recenti */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Task Recenti</h3>
            <button onClick={() => onNavigate('tasks')} className="text-xs text-blue-500 hover:text-blue-600 font-medium">Vedi tutti →</button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Nessun task ancora</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{task.titolo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={11} className="text-slate-400" />
                      <span className="text-xs text-slate-400">{task.assegnatario || '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioritaColor[task.priorita]}`}>{task.priorita}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statoColor[task.stato]}`}>{task.stato}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prossimi Appuntamenti */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Prossimi Appuntamenti</h3>
            <button onClick={() => onNavigate('calendario')} className="text-xs text-blue-500 hover:text-blue-600 font-medium">Vedi tutti →</button>
          </div>
          {eventi.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Bell size={24} className="opacity-30 mb-2" />
              <p className="text-sm">Nessun evento in programma</p>
              <button onClick={() => onNavigate('calendario')} className="text-xs text-blue-500 mt-2 hover:underline">Aggiungi un evento →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {eventi.map(ev => (
                <div key={ev.id} className="flex gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-1 rounded-full bg-gradient-to-b from-blue-500 to-teal-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{ev.titolo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${tipoColor[ev.tipo] || tipoColor.altro}`}>{ev.tipo}</span>
                      <span className="text-xs text-slate-400">{ev.data}{ev.ora ? ' · ' + ev.ora.slice(0,5) : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Proposte */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Proposte in Evidenza</h3>
          <button onClick={() => onNavigate('proposte')} className="text-xs text-blue-500 hover:text-blue-600 font-medium">Vedi tutte →</button>
        </div>
        {proposte.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Nessuna proposta ancora</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proposte.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50/50 transition-colors">
                <p className="text-sm font-semibold text-slate-700 line-clamp-2">{p.titolo}</p>
                <p className="text-xs text-slate-500 mt-1">di {p.autore}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-medium text-emerald-600">▲ {p.upvotes}</span>
                  <span className="text-xs font-medium text-rose-500">▼ {p.downvotes}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
