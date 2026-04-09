import { useState, useEffect } from 'react';
import { Plus, X, Loader2, Trash2, Save, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const sezioni = [
  { key: 'dashboard',   label: 'Dashboard' },
  { key: 'calendario',  label: 'Calendario & Eventi' },
  { key: 'proposte',    label: 'Proposte & Votazioni' },
  { key: 'tasks',       label: 'Task & Progetti' },
  { key: 'chat',        label: 'Chat di Comunità' },
  { key: 'drive',       label: 'Archivio Drive' },
  { key: 'soci',        label: 'Anagrafica Soci' },
  { key: 'finanze',     label: 'Finanze' },
  { key: 'statistiche', label: 'Statistiche' },
  { key: 'can_edit',    label: '✏️ Può aggiungere/eliminare' },
];

const colori = [
  { key: 'slate',  label: 'Grigio',   cls: 'bg-slate-100 text-slate-700' },
  { key: 'blue',   label: 'Blu',      cls: 'bg-blue-100 text-blue-700' },
  { key: 'teal',   label: 'Teal',     cls: 'bg-teal-100 text-teal-700' },
  { key: 'violet', label: 'Viola',    cls: 'bg-violet-100 text-violet-700' },
  { key: 'amber',  label: 'Ambra',    cls: 'bg-amber-100 text-amber-700' },
  { key: 'orange', label: 'Arancione',cls: 'bg-orange-100 text-orange-700' },
  { key: 'rose',   label: 'Rosa',     cls: 'bg-rose-100 text-rose-700' },
  { key: 'emerald',label: 'Verde',    cls: 'bg-emerald-100 text-emerald-700' },
];

const defaultPermessi = { dashboard: true, calendario: true, proposte: true, tasks: true, chat: true, drive: true, soci: false, finanze: false, statistiche: false, can_edit: false };

export default function GestioneRuoli() {
  const [ruoli, setRuoli] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: '', colore: 'slate', permessi: { ...defaultPermessi } });

  useEffect(() => { fetchRuoli(); }, []);

  const fetchRuoli = async () => {
    const { data } = await supabase.from('ruoli').select('*').order('created_at');
    if (data) setRuoli(data);
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ nome: '', colore: 'slate', permessi: { ...defaultPermessi } });
    setShowForm(true);
  };

  const openEdit = (ruolo) => {
    setEditId(ruolo.id);
    setForm({ nome: ruolo.nome, colore: ruolo.colore || 'slate', permessi: { ...defaultPermessi, ...ruolo.permessi } });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    if (editId) {
      const { data, error } = await supabase.from('ruoli').update({ nome: form.nome, colore: form.colore, permessi: form.permessi }).eq('id', editId).select().single();
      if (!error) setRuoli(prev => prev.map(r => r.id === editId ? data : r));
    } else {
      const { data, error } = await supabase.from('ruoli').insert([{ nome: form.nome, colore: form.colore, permessi: form.permessi }]).select().single();
      if (!error) setRuoli(prev => [...prev, data]);
      else alert('Errore: ' + error.message);
    }
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo ruolo?')) return;
    await supabase.from('ruoli').delete().eq('id', id);
    setRuoli(prev => prev.filter(r => r.id !== id));
  };

  const togglePermesso = (key) => {
    setForm(f => ({ ...f, permessi: { ...f.permessi, [key]: !f.permessi[key] } }));
  };

  const getColorClass = (colore) => colori.find(c => c.key === colore)?.cls || colori[0].cls;

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento ruoli...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestione Ruoli</h2>
          <p className="text-slate-500 mt-1">Configura ruoli e permessi per le sezioni</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all">
          <Plus size={16} /> Nuovo Ruolo
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Modifica Ruolo' : 'Nuovo Ruolo'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nome ruolo *</label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Es. Comunicazione" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-2">Colore badge</label>
                <div className="flex flex-wrap gap-2">
                  {colori.map(c => (
                    <button key={c.key} onClick={() => setForm(f => ({ ...f, colore: c.key }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${c.cls} ${form.colore === c.key ? 'border-slate-400 scale-105' : 'border-transparent'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-2">Permessi — sezioni visibili</label>
                <div className="space-y-2 bg-slate-50 rounded-xl p-4">
                  {sezioni.map(s => (
                    <label key={s.key} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">{s.label}</span>
                      <div
                        onClick={() => togglePermesso(s.key)}
                        className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${form.permessi[s.key] ? 'bg-gradient-to-r from-blue-500 to-teal-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.permessi[s.key] ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editId ? 'Salva modifiche' : 'Crea ruolo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista ruoli */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ruoli.map(ruolo => {
          const permessi = { ...defaultPermessi, ...ruolo.permessi };
          const sezioniAttive = sezioni.filter(s => s.key !== 'can_edit' && permessi[s.key]);
          const puoModificare = permessi.can_edit;
          return (
            <div key={ruolo.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 p-2 rounded-xl">
                    <Shield size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${getColorClass(ruolo.colore)}`}>{ruolo.nome}</span>
                    <p className="text-xs text-slate-400 mt-1">{sezioniAttive.length} sezioni visibili</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(ruolo)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(ruolo.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {sezioni.filter(s => s.key !== 'can_edit').map(s => (
                  <span key={s.key} className={`text-xs px-2 py-0.5 rounded-md font-medium ${permessi[s.key] ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                    {s.label}
                  </span>
                ))}
              </div>

              <div className={`mt-3 pt-3 border-t border-slate-100 text-xs font-medium flex items-center gap-1.5 ${puoModificare ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${puoModificare ? 'bg-blue-500' : 'bg-slate-300'}`} />
                {puoModificare ? 'Può aggiungere ed eliminare contenuti' : 'Solo visualizzazione'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
