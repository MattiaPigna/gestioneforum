import { useState, useEffect } from 'react';
import { Search, Mail, Calendar, Shield, ChevronUp, ChevronDown, Plus, X, Trash2, Loader2, Download, FileText, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportSociCSV, exportSociPDF } from '../utils/export';

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

const emptyForm = { nome: '', ruolo: '', email: '', iscrizione: '' };

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
  const [editSocio, setEditSocio] = useState(null); // socio in modifica
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  const openAdd = () => { setEditSocio(null); setForm({ ...emptyForm, ruolo: ruoliDB[0]?.nome || '' }); setShowForm(true); };
  const openEdit = (socio) => { setEditSocio(socio); setForm({ nome: socio.nome, ruolo: socio.ruolo, email: socio.email || '', iscrizione: socio.iscrizione || '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    if (editSocio) {
      // Modifica
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
      // Nuovo
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

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo socio?')) return;
    const { error } = await supabase.from('soci').delete().eq('id', id);
    if (!error) setSoci(prev => prev.filter(s => s.id !== id));
    else alert('Errore: ' + error.message);
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
          <div key={socio.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
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
                <a href={`mailto:${socio.email}`} className="flex items-center gap-2 text-sm text-slate-600">
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
                <button onClick={() => openEdit(socio)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold text-sm bg-blue-50 active:bg-blue-100 transition-colors">
                  <Pencil size={16} /> Modifica
                </button>
                <button onClick={() => handleDelete(socio.id)}
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
                {canEdit() && <th className="px-4 py-3 w-28"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((socio) => (
                <tr key={socio.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{socio.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{socio.nome}</p>
                        <p className="text-xs text-slate-400">Socio #{String(socio.id).slice(-4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRuoloColor(socio.ruolo)}`}>{socio.ruolo}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {socio.email
                      ? <a href={`mailto:${socio.email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-500 transition-colors"><Mail size={12} className="text-slate-400" />{socio.email}</a>
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
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(socio)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors">
                          <Pencil size={12} /> Modifica
                        </button>
                        <button onClick={() => handleDelete(socio.id)}
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
          {filtered.length} di {soci.length} soci
        </div>
      </div>
    </div>
  );
}
