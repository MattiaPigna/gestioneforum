import { useState, useEffect } from 'react';
import { Users, CheckSquare, Vote, TrendingUp, Calendar, Bell, Clock, Loader2, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const statoColor = {
  'To Do':       'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-600',
  'Done':        'bg-teal-100 text-teal-600',
};
const prioritaColor = {
  'Alta':  'bg-rose-100 text-rose-600',
  'Media': 'bg-amber-100 text-amber-600',
  'Bassa': 'bg-emerald-100 text-emerald-600',
};
const tipoColor = {
  riunione: { bg: 'bg-blue-50',   bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-600' },
  scadenza: { bg: 'bg-rose-50',   bar: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-600' },
  evento:   { bg: 'bg-teal-50',   bar: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-600' },
  workshop: { bg: 'bg-violet-50', bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-600' },
  altro:    { bg: 'bg-slate-50',  bar: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600' },
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
    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p className="text-sm font-medium">Caricamento dashboard...</p>
    </div>
  );

  const { soci, tasks, proposte, eventi } = data;
  const taskAperti = tasks.filter(t => t.stato !== 'Done').length;
  const taskCompletati = tasks.filter(t => t.stato === 'Done').length;
  const taskUrgenti = tasks.filter(t => t.priorita === 'Alta' && t.stato !== 'Done').length;
  const totVoti = proposte.reduce((s, p) => s + (p.upvotes || 0), 0);

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  const stats = [
    {
      label: 'Soci Attivi',
      value: soci.length,
      sub: 'registrati',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      cardBg: 'bg-white',
      accent: 'border-t-blue-500',
      navigate: 'soci',
    },
    {
      label: 'Task Aperti',
      value: taskAperti,
      sub: `${taskCompletati} completati`,
      icon: CheckSquare,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-500',
      cardBg: 'bg-white',
      accent: 'border-t-teal-500',
      navigate: 'tasks',
    },
    {
      label: 'Proposte',
      value: proposte.length,
      sub: `${totVoti} voti totali`,
      icon: Vote,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-500',
      cardBg: 'bg-white',
      accent: 'border-t-violet-500',
      navigate: 'proposte',
    },
    {
      label: 'Urgenti',
      value: taskUrgenti,
      sub: 'priorità alta',
      icon: TrendingUp,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-500',
      cardBg: 'bg-white',
      accent: 'border-t-rose-500',
      navigate: 'tasks',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Intestazione ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Buongiorno! 👋</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">{todayCap}</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-100 shadow-sm px-3 py-2 rounded-xl font-medium">
          <Calendar size={13} className="text-blue-400" />
          <span>{new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor, cardBg, accent, navigate }) => (
          <div key={label} onClick={() => onNavigate(navigate)}
            className={`${cardBg} rounded-2xl p-4 shadow-sm border border-slate-100 border-t-2 ${accent} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`${iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={iconColor} />
              </div>
              <ArrowUpRight size={14} className="text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{value}</p>
            <p className="text-sm font-semibold text-slate-600 mt-1">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Task + Appuntamenti ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Task recenti */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-100 flex items-center justify-center">
                <CheckSquare size={14} className="text-teal-500" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Task Recenti</h3>
            </div>
            <button onClick={() => onNavigate('tasks')}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1">
              Vedi tutti <ArrowUpRight size={11} />
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckSquare size={24} className="opacity-30 mb-2" />
              <p className="text-sm">Nessun task ancora</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  {/* dot priorità */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    task.priorita === 'Alta' ? 'bg-rose-400' :
                    task.priorita === 'Media' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{task.titolo}</p>
                    {task.assegnatario && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">{task.assegnatario.split(' ').map(n => n[0]).join('').slice(0,2)}</span>
                        </div>
                        <span className="text-xs text-slate-400">{task.assegnatario}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${prioritaColor[task.priorita]}`}>{task.priorita}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statoColor[task.stato]}`}>{task.stato}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prossimi appuntamenti */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar size={14} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Appuntamenti</h3>
            </div>
            <button onClick={() => onNavigate('calendario')}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1">
              Vedi tutti <ArrowUpRight size={11} />
            </button>
          </div>
          {eventi.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 px-5">
              <Bell size={22} className="opacity-30 mb-2" />
              <p className="text-sm text-center">Nessun evento in programma</p>
              <button onClick={() => onNavigate('calendario')} className="text-xs text-blue-500 mt-2 hover:underline font-medium">
                Aggiungi un evento →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {eventi.map(ev => {
                const cfg = tipoColor[ev.tipo] || tipoColor.altro;
                return (
                  <div key={ev.id} className={`flex gap-3 px-5 py-3.5 items-stretch hover:bg-slate-50/60 transition-colors`}>
                    <div className={`w-1 rounded-full ${cfg.bar} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{ev.titolo}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${cfg.badge}`}>{ev.tipo}</span>
                        <div className="flex items-center gap-1">
                          <Clock size={9} className="text-slate-400" />
                          <span className="text-xs text-slate-400">{ev.data}{ev.ora ? ' · ' + ev.ora.slice(0,5) : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Proposte in evidenza ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center">
              <Vote size={14} className="text-violet-500" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Proposte in Evidenza</h3>
          </div>
          <button onClick={() => onNavigate('proposte')}
            className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1">
            Vedi tutte <ArrowUpRight size={11} />
          </button>
        </div>
        {proposte.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Vote size={24} className="opacity-30 mb-2" />
            <p className="text-sm">Nessuna proposta ancora</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-50">
            {proposte.map(p => {
              const tot = (p.upvotes || 0) + (p.downvotes || 0);
              const ratio = tot > 0 ? Math.round((p.upvotes / tot) * 100) : 50;
              return (
                <div key={p.id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <p className="text-sm font-bold text-slate-700 line-clamp-2">{p.titolo}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">di {p.autore}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-emerald-500">▲ {p.upvotes || 0}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all" style={{ width: `${ratio}%` }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-rose-400">▼ {p.downvotes || 0}</span>
                    </div>
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
