import { useState, useEffect } from 'react';
import { Search, Mail, Calendar, Shield, ChevronUp, ChevronDown, Plus, X, Trash2, Loader2, Download, FileText, Pencil, ArrowLeft, CheckCircle2, Clock, Circle, AlertCircle, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportSociCSV, exportSociPDF } from '../utils/export';
import { getLivello, getProgressoLivello, BADGES } from '../lib/gamification';

const colorMap = {
  slate:   'bg-slate-100 text-slate-700',
  blue:    'bg-blue-100 text-blue-700',
  teal:    'bg-teal-100 text-teal-700',
  violet:  'bg-violet-100 text-violet-700',
  amber:   'bg-amber-100 text-amber-700',
  orange:  'bg-orange-100 text-orange-700',
  rose:    'bg-rose-100 text-rose-700',
  emerald: 'bg-emerald-100 text-emerald-700',
};

const prioritaConfig = {
  alta:  { color: 'bg-rose-100 text-rose-600',   label: 'Alta' },
  media: { color: 'bg-amber-100 text-amber-600',  label: 'Media' },
  bassa: { color: 'bg-slate-100 text-slate-500',  label: 'Bassa' },
};

const statoConfig = {
  done:        { icon: CheckCircle2, color: 'text-teal-500',  bg: 'bg-teal-50',  label: 'Completata' },
  in_progress: { icon: Clock,        color: 'text-blue-500',  bg: 'bg-blue-50',  label: 'In corso' },
  todo:        { icon: Circle,       color: 'text-slate-400', bg: 'bg-slate-50', label: 'Da fare' },
};

const emptyForm = { nome: '', ruolo: '', email: '', iscrizione: '' };

/* ─── Scheda Dettaglio Socio ─────────────────────────────────── */
function SocioDetail({ socio, getRuoloColor, onClose, onEdit, canEdit }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [xpTotale, setXpTotale] = useState(0);
  const [badges, setBadges] = useState([]);

  useEffect(() => { fetchTasks(); fetchGamification(); }, [socio.id]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    const { data } = await supabase
      .from('tasks')
      .select('*, progetti(nome)')
      .eq('assegnatario', socio.nome)
      .order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoadingTasks(false);
  };

  const fetchGamification = async () => {
    const [{ data: xpRows }, { data: badgeRows }] = await Promise.all([
      supabase.from('xp_log').select('punti').eq('socio_id', socio.id),
      supabase.from('badge_sbloccati').select('badge_id, sbloccato_at').eq('socio_id', socio.id).order('sbloccato_at'),
    ]);
    setXpTotale((xpRows || []).reduce((s, r) => s + r.punti, 0));
    setBadges(badgeRows || []);
  };

  const completate  = tasks.filter(t => t.stato === 'done');
  const inCorso     = tasks.filter(t => t.stato === 'in_progress');
  const daFare      = tasks.filter(t => t.stato === 'todo');
  const alta        = tasks.filter(t => t.priorita === 'alta');

  const filteredTasks = filtroStato === 'tutti' ? tasks : tasks.filter(t => t.stato === filtroStato);

  const percCompl = tasks.length > 0 ? Math.round((completate.length / tasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-6 text-white relative shrink-0">
          <button onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all">
            <X size={16} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner shrink-0">
              <span className="text-white text-2xl font-bold">{socio.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold leading-tight">{socio.nome}</h2>
                {(() => { const lv = getLivello(xpTotale); return (
                  <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{lv.emoji} {lv.nome}</span>
                ); })()}
              </div>
              <span className="text-white/80 text-sm">{socio.ruolo}</span>
              {socio.email && (
                <a href={`mailto:${socio.email}`}
                  className="flex items-center gap-1.5 text-white/70 text-xs mt-1 hover:text-white transition-colors w-fit">
                  <Mail size={11} />{socio.email}
                </a>
              )}
            </div>
          </div>

          {/* XP Progress bar */}
          {(() => {
            const lv = getLivello(xpTotale);
            const perc = getProgressoLivello(xpTotale);
            const nextLv = lv.max === Infinity ? null : lv.max + 1;
            return (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>{xpTotale} XP totali</span>
                  <span>{nextLv ? `${nextLv - xpTotale} XP al prossimo livello` : 'Livello massimo!'}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${perc}%` }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Task totali',  value: tasks.length,       bg: 'bg-slate-50',   text: 'text-slate-700' },
              { label: 'Completate',   value: completate.length,  bg: 'bg-teal-50',    text: 'text-teal-700'  },
              { label: 'In corso',     value: inCorso.length,     bg: 'bg-blue-50',    text: 'text-blue-700'  },
              { label: 'Priorità alta',value: alta.length,        bg: 'bg-rose-50',    text: 'text-rose-700'  },
            ].map(k => (
              <div key={k.label} className={`${k.bg} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Badge */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star size={12} /> Badge sbloccati
              <span className="text-xs bg-slate-100 text-slate-500 font-bold px-1.5 rounded-full">{badges.length}</span>
            </h3>
            {badges.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Nessun badge ancora — completa task per sbloccarli!</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {badges.map(b => {
                  const bd = BADGES[b.badge_id];
                  if (!bd) return null;
                  return (
                    <div key={b.badge_id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                      <span className="text-2xl">{bd.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 leading-tight">{bd.nome}</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{bd.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info socio */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Informazioni</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield size={14} className="text-slate-400 shrink-0" />
              <span>Ruolo:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getRuoloColor(socio.ruolo)}`}>{socio.ruolo}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <span>Iscritto dal:</span>
              <span className="font-medium">{socio.iscrizione || '—'}</span>
            </div>
            {!socio.email && (
              <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                <Mail size={14} className="shrink-0" />
                <span>Email non inserita</span>
              </div>
            )}
          </div>

          {/* Task list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Task assegnate</h3>
              {tasks.length > 0 && (
                <div className="flex gap-1">
                  {['tutti', 'todo', 'in_progress', 'done'].map(s => (
                    <button key={s}
                      onClick={() => setFiltroStato(s)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all
                        ${filtroStato === s ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {s === 'tutti' ? 'Tutti' : statoConfig[s]?.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loadingTasks ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 size={14} className="animate-spin" /> Caricamento task...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Circle size={28} className="opacity-30 mx-auto mb-2" />
                <p className="text-sm">{tasks.length === 0 ? 'Nessuna task assegnata' : 'Nessuna task in questo stato'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map(task => {
                  const st = statoConfig[task.stato] || statoConfig.todo;
                  const Icon = st.icon;
                  const pr = prioritaConfig[task.priorita] || prioritaConfig.bassa;
                  return (
                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 ${st.bg} transition-all`}>
                      <Icon size={16} className={`${st.color} mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug ${task.stato === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {task.titolo}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.scadenza && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar size={10} />{task.scadenza}
                            </span>
                          )}
                          {task.progetti?.nome && (
                            <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-medium">
                              {task.progetti.nome}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${pr.color}`}>
                        {pr.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {canEdit && (
          <div className="p-4 border-t border-slate-100 shrink-0">
            <button onClick={onEdit}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold text-sm bg-blue-50 hover:bg-blue-100 transition-colors">
              <Pencil size={16} /> Modifica profilo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Componente principale ──────────────────────────────────── */
export default function Soci() {
  const { canEdit } = useAuth();
  const [soci, setSoci] = useState([]);
  const [ruoliDB, setRuoliDB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filtroRuolo, setFiltroRuolo] = useState('tutti');
  const [sort, setSort] = useState({ col: 'nome', dir: 'asc' });
  const [showForm, setShowForm] = useState(false);
  const [editSocio, setEditSocio] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedSocio, setSelectedSocio] = useState(null);

  useEffect(() => { Promise.all([fetchSoci(), fetchRuoli()]); }, []);

  const fetchSoci = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('soci').select('*').order('nome');
    if (error) setError(error.message);
    else setSoci(data);
    setLoading(false);
  };

  const fetchRuoli = async () => {
    const { data } = await supabase.from('ruoli').select('id, nome, colore').order('nome');
    if (data) setRuoliDB(data);
  };

  const getRuoloColor = (nomeRuolo) => {
    const ruolo = ruoliDB.find(r => r.nome === nomeRuolo);
    return colorMap[ruolo?.colore] || colorMap.slate;
  };

  const openAdd = () => {
    setEditSocio(null);
    setForm({ ...emptyForm, ruolo: ruoliDB[0]?.nome || '' });
    setShowForm(true);
  };

  const openEdit = (socio, e) => {
    e?.stopPropagation();
    setEditSocio(socio);
    setForm({ nome: socio.nome, ruolo: socio.ruolo, email: socio.email || '', iscrizione: socio.iscrizione || '' });
    setSelectedSocio(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    if (editSocio) {
      const { data, error } = await supabase.from('soci').update({
        nome: form.nome,
        ruolo: form.ruolo,
        email: form.email,
        iscrizione: form.iscrizione || editSocio.iscrizione,
        avatar: form.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      }).eq('id', editSocio.id).select().single();
      if (!error) setSoci(prev => prev.map(s => s.id === editSocio.id ? data : s));
      else alert('Errore: ' + error.message);
    } else {
      const avatar = form.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const { data, error } = await supabase.from('soci').insert([{
        nome: form.nome, ruolo: form.ruolo, email: form.email,
        iscrizione: form.iscrizione || new Date().toISOString().split('T')[0], avatar,
      }]).select().single();
      if (!error) setSoci(prev => [...prev, data]);
      else alert('Errore: ' + error.message);
    }
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Eliminare questo socio?')) return;
    const { error } = await supabase.from('soci').delete().eq('id', id);
    if (!error) {
      setSoci(prev => prev.filter(s => s.id !== id));
      if (selectedSocio?.id === id) setSelectedSocio(null);
    } else {
      alert('Errore: ' + error.message);
    }
  };

  const ruoli = ['tutti', ...ruoliDB.map(r => r.nome)];

  const handleSort = (col) => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };

  const filtered = soci
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = s.nome.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || s.ruolo.toLowerCase().includes(q);
      const matchRuolo = filtroRuolo === 'tutti' || s.ruolo === filtroRuolo;
      return matchSearch && matchRuolo;
    })
    .sort((a, b) => {
      const va = a[sort.col] || '';
      const vb = b[sort.col] || '';
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return <ChevronUp size={12} className="text-slate-300" />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
  };

  const ThButton = ({ col, children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort(col)}>
      <div className="flex items-center gap-1">{children}<SortIcon col={col} /></div>
    </th>
  );

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento soci...</p>
    </div>
  );

  if (error) return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-600">
      <p className="font-semibold">Errore di connessione al database</p>
      <p className="text-sm mt-1">{error}</p>
    </div>
  );

  return (
    <div className="page">
      {/* Detail panel */}
      {selectedSocio && (
        <SocioDetail
          socio={selectedSocio}
          getRuoloColor={getRuoloColor}
          onClose={() => setSelectedSocio(null)}
          onEdit={() => openEdit(selectedSocio)}
          canEdit={canEdit()}
        />
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">Anagrafica Soci</h2>
          <p className="page-subtitle">{soci.length} soci registrati</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportSociCSV(soci)} className="btn-ghost px-3 py-2 text-xs"><Download size={13} /> CSV</button>
          <button onClick={() => exportSociPDF(soci)} className="btn-ghost px-3 py-2 text-xs"><FileText size={13} /> PDF</button>
          {canEdit() && (
            <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Nuovo Socio</button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">{editSocio ? 'Modifica Socio' : 'Nuovo Socio'}</h3>
              <button onClick={() => setShowForm(false)} className="modal-close"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Nome e Cognome *</label>
                <input type="text" className="form-input" placeholder="Es. Mario Rossi" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="mario.rossi@forum.it" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Ruolo</label>
                <select className="form-select" value={form.ruolo} onChange={e => setForm(f => ({ ...f, ruolo: e.target.value }))}>
                  {ruoliDB.map(r => <option key={r.id} value={r.nome}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Data iscrizione</label>
                <input type="date" className="form-input" value={form.iscrizione} onChange={e => setForm(f => ({ ...f, iscrizione: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editSocio ? 'Salva modifiche' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Pills */}
      {ruoli.slice(1).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {ruoli.slice(1).map(ruolo => {
            const count = soci.filter(s => s.ruolo === ruolo).length;
            return (
              <div key={ruolo} className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Shield size={12} className="text-blue-400" />
                <span className="text-xs font-medium text-slate-700">{ruolo}</span>
                <span className="text-xs bg-blue-100 text-blue-600 font-bold px-1.5 rounded-full">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder-slate-400" placeholder="Cerca per nome, ruolo o email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" value={filtroRuolo} onChange={e => setFiltroRuolo(e.target.value)}>
          <option value="tutti">Tutti i ruoli</option>
          {ruoli.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
            <Search size={32} className="opacity-30 mb-2" />
            <p className="text-sm font-medium">Nessun socio trovato</p>
          </div>
        ) : filtered.map((socio) => (
          <div key={socio.id} onClick={() => setSelectedSocio(socio)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0 shadow-md shadow-blue-100">
                <span className="text-white text-lg font-bold">{socio.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slate-800">{socio.nome}</p>
                <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${getRuoloColor(socio.ruolo)}`}>{socio.ruolo}</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {socio.email ? (
                <a href={`mailto:${socio.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{socio.email}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-300 italic">
                  <Mail size={14} className="shrink-0" />
                  <span>Email non inserita</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>Iscritto dal {socio.iscrizione}</span>
              </div>
            </div>
            {canEdit() && (
              <div className="flex gap-3 mt-4">
                <button onClick={(e) => openEdit(socio, e)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold text-sm bg-blue-50 active:bg-blue-100 transition-colors">
                  <Pencil size={16} /> Modifica
                </button>
                <button onClick={(e) => handleDelete(socio.id, e)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-rose-200 text-rose-600 font-semibold text-sm bg-rose-50 active:bg-rose-100 transition-colors">
                  <Trash2 size={16} /> Elimina
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="text-xs text-slate-400 text-center py-1">
          {filtered.length} di {soci.length} soci
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <ThButton col="nome">Nome</ThButton>
                <ThButton col="ruolo">Ruolo</ThButton>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <ThButton col="iscrizione">Iscrizione</ThButton>
                {canEdit() && <th className="px-4 py-3 w-36"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((socio) => (
                <tr key={socio.id} onClick={() => setSelectedSocio(socio)}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{socio.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{socio.nome}</p>
                        <p className="text-xs text-slate-400">Socio #{String(socio.id).slice(-4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRuoloColor(socio.ruolo)}`}>{socio.ruolo}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {socio.email
                      ? <a href={`mailto:${socio.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-500 transition-colors"><Mail size={12} className="text-slate-400" />{socio.email}</a>
                      : <span className="text-xs text-slate-300 italic">Non inserita</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar size={12} className="text-slate-400" />
                      {socio.iscrizione}
                    </div>
                  </td>
                  {canEdit() && (
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => openEdit(socio, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors">
                          <Pencil size={12} /> Modifica
                        </button>
                        <button onClick={(e) => handleDelete(socio.id, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors">
                          <Trash2 size={12} /> Elimina
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Search size={32} className="opacity-30 mb-2" />
            <p className="text-sm font-medium">Nessun socio trovato</p>
          </div>
        )}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
          {filtered.length} di {soci.length} soci — clicca su un socio per vedere i dettagli
        </div>
      </div>
    </div>
  );
}
