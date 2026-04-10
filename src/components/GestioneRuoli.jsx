import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Save, Shield, ChevronDown } from 'lucide-react';
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
  { key: 'slate',   label: 'Grigio',    cls: 'bg-slate-100 text-slate-700' },
  { key: 'blue',    label: 'Blu',       cls: 'bg-blue-100 text-blue-700' },
  { key: 'teal',    label: 'Teal',      cls: 'bg-teal-100 text-teal-700' },
  { key: 'violet',  label: 'Viola',     cls: 'bg-violet-100 text-violet-700' },
  { key: 'amber',   label: 'Ambra',     cls: 'bg-amber-100 text-amber-700' },
  { key: 'orange',  label: 'Arancione', cls: 'bg-orange-100 text-orange-700' },
  { key: 'rose',    label: 'Rosa',      cls: 'bg-rose-100 text-rose-700' },
  { key: 'emerald', label: 'Verde',     cls: 'bg-emerald-100 text-emerald-700' },
];

const defaultPermessi = { dashboard: true, calendario: true, proposte: true, tasks: true, chat: true, drive: true, soci: false, finanze: false, statistiche: false, can_edit: false };
const emptyForm = { nome: '', colore: 'slate', permessi: { ...defaultPermessi } };

export default function GestioneRuoli() {
  const [ruoli, setRuoli] = useState([]);
  const [soci, setSoci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { Promise.all([fetchRuoli(), fetchSoci()]); }, []);

  const fetchRuoli = async () => {
    const { data } = await supabase.from('ruoli').select('*').order('created_at');
    if (data) {
      setRuoli(data);
      if (data.length > 0) selectRuolo(data[0]);
    }
    setLoading(false);
  };

  const fetchSoci = async () => {
    const { data } = await supabase.from('soci').select('id, nome, ruolo, avatar').eq('attivo', true).order('nome');
    if (data) setSoci(data);
  };

  const selectRuolo = (ruolo) => {
    setSelectedId(ruolo.id);
    setIsNew(false);
    setForm({ nome: ruolo.nome, colore: ruolo.colore || 'slate', permessi: { ...defaultPermessi, ...ruolo.permessi } });
  };

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setIsNew(true);
      setSelectedId('');
      setForm(emptyForm);
    } else {
      const ruolo = ruoli.find(r => r.id === val);
      if (ruolo) selectRuolo(ruolo);
    }
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    if (isNew) {
      const { data, error } = await supabase.from('ruoli').insert([{ nome: form.nome, colore: form.colore, permessi: form.permessi }]).select().single();
      if (error) { alert('Errore: ' + error.message); }
      else {
        setRuoli(prev => [...prev, data]);
        selectRuolo(data);
      }
    } else {
      const { data, error } = await supabase.from('ruoli').update({ nome: form.nome, colore: form.colore, permessi: form.permessi }).eq('id', selectedId).select().single();
      if (error) { alert('Errore: ' + error.message); }
      else setRuoli(prev => prev.map(r => r.id === selectedId ? data : r));
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const ruolo = ruoli.find(r => r.id === selectedId);
    if (!confirm(`Eliminare il ruolo "${ruolo?.nome}"?`)) return;
    await supabase.from('ruoli').delete().eq('id', selectedId);
    const nuovi = ruoli.filter(r => r.id !== selectedId);
    setRuoli(nuovi);
    if (nuovi.length > 0) selectRuolo(nuovi[0]);
    else { setSelectedId(''); setIsNew(false); setForm(emptyForm); }
  };

  const togglePermesso = (key) => {
    setForm(f => ({ ...f, permessi: { ...f.permessi, [key]: !f.permessi[key] } }));
  };

  const getColorClass = (colore) => colori.find(c => c.key === colore)?.cls || colori[0].cls;

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento ruoli...
    </div>
  );

  const dropdownValue = isNew ? '__new__' : selectedId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Gestione Ruoli</h2>
          <p className="text-slate-500 mt-1">Configura ruoli e permessi per le sezioni</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna sinistra: selezione ruolo */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <label className="text-xs font-medium text-slate-600 block mb-2">Seleziona ruolo</label>
            <div className="relative">
              <select
                value={dropdownValue}
                onChange={handleDropdownChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none pr-8"
              >
                {ruoli.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
                <option value="__new__">+ Nuovo ruolo...</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Lista ruoli esistenti */}
            <div className="mt-4 space-y-1">
              {ruoli.map(r => (
                <button
                  key={r.id}
                  onClick={() => selectRuolo(r)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${selectedId === r.id && !isNew ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
                >
                  <Shield size={14} className={selectedId === r.id && !isNew ? 'text-blue-500' : 'text-slate-400'} />
                  <span className={`flex-1 text-left font-medium ${selectedId === r.id && !isNew ? 'text-blue-700' : 'text-slate-700'}`}>{r.nome}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getColorClass(r.colore)}`}>{r.colore}</span>
                </button>
              ))}
              <button
                onClick={() => { setIsNew(true); setSelectedId(''); setForm(emptyForm); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${isNew ? 'bg-teal-50 border border-teal-200 text-teal-700' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                <Plus size={14} />
                <span className="flex-1 text-left font-medium">Nuovo ruolo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Colonna destra: form modifica */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-800">
              {isNew ? 'Nuovo Ruolo' : `Modifica: ${form.nome}`}
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nome ruolo *</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Es. Comunicazione"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              />
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

            {/* Soci con questo ruolo */}
            {!isNew && (() => {
              const sociRuolo = soci.filter(s => s.ruolo === form.nome);
              return (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">
                    Soci con questo ruolo ({sociRuolo.length})
                  </label>
                  {sociRuolo.length === 0 ? (
                    <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-3">Nessun socio assegnato</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 bg-slate-50 rounded-xl p-3">
                      {sociRuolo.map(s => (
                        <div key={s.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0">
                            <span className="text-white text-[8px] font-bold">{s.avatar || s.nome?.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <span className="text-xs font-medium text-slate-700">{s.nome}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex gap-3 pt-2">
              {!isNew && (
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors">
                  <Trash2 size={14} /> Elimina ruolo
                </button>
              )}
              <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isNew ? 'Crea ruolo' : 'Salva modifiche'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
