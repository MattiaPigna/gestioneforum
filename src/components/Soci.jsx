import { useState, useEffect } from 'react';
import { Search, Mail, Calendar, Shield, ChevronUp, ChevronDown, Plus, X, Trash2, Loader2, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportSociCSV, exportSociPDF } from '../utils/export';

const ruoloColor = {
  'Presidente': 'bg-blue-100 text-blue-700',
  'Vice Presidente': 'bg-teal-100 text-teal-700',
  'Segretario': 'bg-violet-100 text-violet-700',
  'Tesoriere': 'bg-amber-100 text-amber-700',
  'Referente Progetti': 'bg-orange-100 text-orange-700',
  'Membro': 'bg-slate-100 text-slate-600',
};

export default function Soci() {
  const { canEdit } = useAuth();
  const [soci, setSoci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filtroRuolo, setFiltroRuolo] = useState('tutti');
  const [sort, setSort] = useState({ col: 'nome', dir: 'asc' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', ruolo: 'Membro', email: '', iscrizione: '' });

  useEffect(() => {
    fetchSoci();
  }, []);

  const fetchSoci = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('soci').select('*').order('nome');
    if (error) setError(error.message);
    else setSoci(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    const avatar = form.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const { data, error } = await supabase.from('soci').insert([{
      nome: form.nome,
      ruolo: form.ruolo,
      email: form.email,
      iscrizione: form.iscrizione || new Date().toISOString().split('T')[0],
      avatar,
    }]).select().single();
    if (!error) {
      setSoci(prev => [...prev, data]);
      setForm({ nome: '', ruolo: 'Membro', email: '', iscrizione: '' });
      setShowForm(false);
    } else {
      alert('Errore: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo socio?')) return;
    const { error } = await supabase.from('soci').delete().eq('id', id);
    if (!error) setSoci(prev => prev.filter(s => s.id !== id));
    else alert('Errore: ' + error.message);
  };

  const ruoli = ['tutti', ...new Set(soci.map(s => s.ruolo))];

  const handleSort = (col) => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };

  const filtered = soci
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = s.nome.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.ruolo.toLowerCase().includes(q);
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
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento soci...
    </div>
  );

  if (error) return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-600">
      <p className="font-semibold">Errore di connessione al database</p>
      <p className="text-sm mt-1">{error}</p>
      <p className="text-xs mt-3 text-rose-400">Assicurati di aver creato la tabella <code>soci</code> su Supabase.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Anagrafica Soci</h2>
          <p className="text-slate-500 mt-1">{soci.length} soci registrati</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button onClick={() => exportSociCSV(soci)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => exportSociPDF(soci)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
              <FileText size={14} /> PDF
            </button>
          </div>
          {canEdit() && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <Plus size={16} /> Nuovo Socio
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Nuovo Socio</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Nome e Cognome *', field: 'nome', placeholder: 'Es. Mario Rossi' },
                { label: 'Email', field: 'email', placeholder: 'mario.rossi@forum.it', type: 'email' },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
                  <input
                    type={type || 'text'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Ruolo</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.ruolo} onChange={e => setForm(f => ({ ...f, ruolo: e.target.value }))}>
                  {Object.keys(ruoloColor).map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Data iscrizione</label>
                <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.iscrizione} onChange={e => setForm(f => ({ ...f, iscrizione: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Aggiungi
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <ThButton col="nome">Nome</ThButton>
                <ThButton col="ruolo">Ruolo</ThButton>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <ThButton col="iscrizione">Iscrizione</ThButton>
                <th className="px-4 py-3 w-10"></th>
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
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ruoloColor[socio.ruolo] || ruoloColor['Membro']}`}>{socio.ruolo}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <a href={`mailto:${socio.email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-500 transition-colors">
                      <Mail size={12} className="text-slate-400" />
                      {socio.email}
                    </a>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar size={12} className="text-slate-400" />
                      {socio.iscrizione}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {canEdit() && (
                      <button onClick={() => handleDelete(socio.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
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
