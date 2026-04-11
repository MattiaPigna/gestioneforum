import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, CheckCircle, Users, Vote, FolderOpen, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

export default function Statistiche() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: soci }, { data: tasks }, { data: proposte }, { data: progetti }] = await Promise.all([
        supabase.from('soci').select('ruolo, iscrizione'),
        supabase.from('tasks').select('stato, priorita, created_at, progetto_id'),
        supabase.from('proposte').select('upvotes, downvotes, created_at'),
        supabase.from('progetti').select('id, nome, stato, budget, speso'),
      ]);
      setData({ soci: soci || [], tasks: tasks || [], proposte: proposte || [], progetti: progetti || [] });
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento statistiche...</p>
    </div>
  );

  const { soci, tasks, proposte, progetti } = data;

  // ── Task stats ────────────────────────────────────────────────────────────
  const taskPerStato = [
    { name: 'To Do',       value: tasks.filter(t => t.stato === 'To Do').length,       fill: '#94a3b8' },
    { name: 'In Progress', value: tasks.filter(t => t.stato === 'In Progress').length, fill: '#3b82f6' },
    { name: 'Done',        value: tasks.filter(t => t.stato === 'Done').length,        fill: '#14b8a6' },
    { name: 'Annullata',   value: tasks.filter(t => t.stato === 'Annullata').length,   fill: '#ef4444' },
  ];

  const taskPerPriorita = [
    { name: 'Alta',  value: tasks.filter(t => t.priorita === 'Alta').length,  fill: '#ef4444' },
    { name: 'Media', value: tasks.filter(t => t.priorita === 'Media').length, fill: '#f59e0b' },
    { name: 'Bassa', value: tasks.filter(t => t.priorita === 'Bassa').length, fill: '#10b981' },
  ];

  // ── Soci stats ────────────────────────────────────────────────────────────
  const sociPerRuolo = Object.entries(
    soci.reduce((acc, s) => { acc[s.ruolo] = (acc[s.ruolo] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const iscrizioniPerMese = soci.reduce((acc, s) => {
    if (!s.iscrizione) return acc;
    const mese = s.iscrizione.slice(0, 7);
    acc[mese] = (acc[mese] || 0) + 1;
    return acc;
  }, {});
  const iscrizioniData = Object.entries(iscrizioniPerMese)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-12)
    .map(([mese, count]) => ({ mese: mese.slice(5) + '/' + mese.slice(2, 4), count }));

  // ── Proposte ──────────────────────────────────────────────────────────────
  const engagementProposte = proposte.slice(-10).map((p, i) => ({
    name: `P${i + 1}`, upvotes: p.upvotes, downvotes: p.downvotes,
  }));

  // ── Progetti stats ────────────────────────────────────────────────────────
  const progettiAttivi     = progetti.filter(p => p.stato === 'Attivo').length;
  const progettiCompletati = progetti.filter(p => p.stato === 'Completato').length;
  const budgetTotale = progetti.reduce((s, p) => s + (parseFloat(p.budget) || 0), 0);
  const spesoTotale  = progetti.reduce((s, p) => s + (parseFloat(p.speso) || 0), 0);

  const progettiCompletamentoData = progetti
    .filter(p => p.stato !== 'Archiviato')
    .map(p => {
      const tp    = tasks.filter(t => t.progetto_id === p.id);
      const done  = tp.filter(t => t.stato === 'Done').length;
      const total = tp.length;
      return {
        name:          p.nome.length > 14 ? p.nome.slice(0, 14) + '…' : p.nome,
        Completamento: total > 0 ? Math.round((done / total) * 100) : 0,
        Task:          total,
      };
    })
    .sort((a, b) => b.Completamento - a.Completamento);

  const completamento = tasks.length > 0
    ? Math.round((tasks.filter(t => t.stato === 'Done').length / tasks.length) * 100)
    : 0;

  const statCards = [
    { label: 'Totale Soci',         value: soci.length,                                      icon: Users,       color: 'text-blue-500',   bg: 'bg-blue-50' },
    { label: 'Task Completati',     value: tasks.filter(t => t.stato === 'Done').length,     icon: CheckCircle, color: 'text-teal-500',   bg: 'bg-teal-50' },
    { label: 'Tasso Completamento', value: `${completamento}%`,                               icon: TrendingUp,  color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Voti Totali',         value: proposte.reduce((s, p) => s + p.upvotes + p.downvotes, 0), icon: Vote, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Statistiche</h2>
        <p className="text-slate-500 mt-1">Panoramica attività del Forum</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className={`${bg} p-2 rounded-xl w-fit mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── SEZIONE PROGETTI ── */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FolderOpen size={14} /> Progetti
        </h3>

        {/* KPI progetti */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="bg-blue-50 p-2 rounded-xl w-fit mb-2"><FolderOpen size={16} className="text-blue-500" /></div>
            <p className="text-2xl font-bold text-slate-800">{progettiAttivi}</p>
            <p className="text-xs text-slate-500 mt-0.5">Progetti attivi</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="bg-teal-50 p-2 rounded-xl w-fit mb-2"><CheckCircle size={16} className="text-teal-500" /></div>
            <p className="text-2xl font-bold text-slate-800">{progettiCompletati}</p>
            <p className="text-xs text-slate-500 mt-0.5">Completati</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="bg-emerald-50 p-2 rounded-xl w-fit mb-2"><Wallet size={16} className="text-emerald-500" /></div>
            <p className="text-2xl font-bold text-slate-800">€{budgetTotale.toLocaleString('it-IT')}</p>
            <p className="text-xs text-slate-500 mt-0.5">Budget totale</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="bg-rose-50 p-2 rounded-xl w-fit mb-2"><TrendingUp size={16} className="text-rose-500" /></div>
            <p className="text-2xl font-bold text-slate-800">€{spesoTotale.toLocaleString('it-IT')}</p>
            <p className="text-xs text-slate-500 mt-0.5">Totale speso</p>
          </div>
        </div>

        {/* Completamento per progetto */}
        {progettiCompletamentoData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">Completamento task per progetto</h4>
              <ResponsiveContainer width="100%" height={Math.max(180, progettiCompletamentoData.length * 44)}>
                <BarChart data={progettiCompletamentoData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} formatter={v => `${v}%`} />
                  <Bar dataKey="Completamento" name="Completamento" radius={[0, 6, 6, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lista progetti con progress bar */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">Dettaglio per progetto</h4>
              <div className="space-y-4">
                {progettiCompletamentoData.map((p, i) => {
                  const prog = progetti.find(pr => (pr.nome.length > 14 ? pr.nome.slice(0, 14) + '…' : pr.nome) === p.name);
                  const budgetNum = parseFloat(prog?.budget) || 0;
                  const spesoNum  = parseFloat(prog?.speso) || 0;
                  const budgetPerc = budgetNum ? Math.min(100, Math.round((spesoNum / budgetNum) * 100)) : null;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                        <span className="text-xs font-bold text-slate-500">{p.Completamento}% · {p.Task} task</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-2 mb-1">
                        <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all" style={{ width: `${p.Completamento}%` }} />
                      </div>
                      {budgetNum > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 mr-2">
                            <div className={`h-1.5 rounded-full ${(budgetPerc || 0) > 90 ? 'bg-rose-400' : (budgetPerc || 0) > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${budgetPerc || 0}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">€{spesoNum.toFixed(0)}/€{budgetNum.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── GRAFICI TASK & SOCI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Task per Stato</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskPerStato} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="value" name="Task" radius={[6, 6, 0, 0]}>
                {taskPerStato.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Soci per Ruolo</h3>
          {sociPerRuolo.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">Nessun dato</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sociPerRuolo} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {sociPerRuolo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Task per Priorità</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskPerPriorita} barSize={40} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="value" name="Task" radius={[0, 6, 6, 0]}>
                {taskPerPriorita.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Engagement Proposte</h3>
          {engagementProposte.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">Nessun dato</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={engagementProposte} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="upvotes"   name="Upvotes"   fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="downvotes" name="Downvotes" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Iscrizioni nel tempo */}
      {iscrizioniData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Iscrizioni nel Tempo</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={iscrizioniData}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mese" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Area type="monotone" dataKey="count" name="Iscrizioni" stroke="#3b82f6" strokeWidth={2} fill="url(#gradBlue)" dot={{ fill: '#3b82f6', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
