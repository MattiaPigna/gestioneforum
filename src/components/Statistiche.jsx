import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, CheckCircle, Users, Vote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

export default function Statistiche() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: soci }, { data: tasks }, { data: proposte }] = await Promise.all([
        supabase.from('soci').select('ruolo, iscrizione'),
        supabase.from('tasks').select('stato, priorita, created_at'),
        supabase.from('proposte').select('upvotes, downvotes, created_at'),
      ]);
      setData({ soci: soci || [], tasks: tasks || [], proposte: proposte || [] });
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

  const { soci, tasks, proposte } = data;

  // Soci per ruolo
  const sociPerRuolo = Object.entries(
    soci.reduce((acc, s) => { acc[s.ruolo] = (acc[s.ruolo] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Task per stato
  const taskPerStato = [
    { name: 'To Do', value: tasks.filter(t => t.stato === 'To Do').length, fill: '#94a3b8' },
    { name: 'In Progress', value: tasks.filter(t => t.stato === 'In Progress').length, fill: '#3b82f6' },
    { name: 'Done', value: tasks.filter(t => t.stato === 'Done').length, fill: '#14b8a6' },
  ];

  // Task per priorità
  const taskPerPriorita = [
    { name: 'Alta', value: tasks.filter(t => t.priorita === 'Alta').length, fill: '#ef4444' },
    { name: 'Media', value: tasks.filter(t => t.priorita === 'Media').length, fill: '#f59e0b' },
    { name: 'Bassa', value: tasks.filter(t => t.priorita === 'Bassa').length, fill: '#10b981' },
  ];

  // Iscrizioni per mese
  const iscrizioniPerMese = soci.reduce((acc, s) => {
    if (!s.iscrizione) return acc;
    const mese = s.iscrizione.slice(0, 7);
    acc[mese] = (acc[mese] || 0) + 1;
    return acc;
  }, {});
  const iscrizioniData = Object.entries(iscrizioniPerMese)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mese, count]) => ({ mese: mese.slice(5) + '/' + mese.slice(2, 4), count }));

  // Engagement proposte
  const engagementProposte = proposte.slice(-10).map((p, i) => ({
    name: `P${i + 1}`,
    upvotes: p.upvotes,
    downvotes: p.downvotes,
  }));

  const completamento = tasks.length > 0
    ? Math.round((tasks.filter(t => t.stato === 'Done').length / tasks.length) * 100)
    : 0;

  const statCards = [
    { label: 'Totale Soci', value: soci.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Task Completati', value: tasks.filter(t => t.stato === 'Done').length, icon: CheckCircle, color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'Tasso Completamento', value: `${completamento}%`, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Voti Totali', value: proposte.reduce((s, p) => s + p.upvotes + p.downvotes, 0), icon: Vote, color: 'text-amber-500', bg: 'bg-amber-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task per stato */}
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

        {/* Soci per ruolo */}
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

        {/* Task per priorità */}
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

        {/* Engagement proposte */}
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
                <Bar dataKey="upvotes" name="Upvotes" fill="#10b981" radius={[4, 4, 0, 0]} />
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
