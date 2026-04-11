import { useState, useEffect } from 'react';
import {
  Plus, X, CheckCircle, Circle, Clock, AlertCircle, Trash2,
  Loader2, Pencil, Save, Ban, FolderOpen, ShoppingCart,
  ArrowLeft, FileText, CheckSquare,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sendPush } from '../lib/push';

// ── Configs ───────────────────────────────────────────────────────────────────
const prioritaConfig = {
  Alta:  { color: 'bg-rose-100 text-rose-600 border-rose-200',         border: 'border-l-rose-500' },
  Media: { color: 'bg-amber-100 text-amber-600 border-amber-200',      border: 'border-l-amber-500' },
  Bassa: { color: 'bg-emerald-100 text-emerald-600 border-emerald-200', border: 'border-l-emerald-500' },
};

const statoConfig = {
  'To Do':       { icon: Circle,      headerBg: 'bg-slate-50', headerBorder: 'border-slate-200', iconColor: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' },
  'In Progress': { icon: Clock,       headerBg: 'bg-blue-50',  headerBorder: 'border-blue-200',  iconColor: 'text-blue-500',  badge: 'bg-blue-100 text-blue-600' },
  'Done':        { icon: CheckCircle, headerBg: 'bg-teal-50',  headerBorder: 'border-teal-200',  iconColor: 'text-teal-500',  badge: 'bg-teal-100 text-teal-600' },
  'Annullata':   { icon: Ban,         headerBg: 'bg-rose-50',  headerBorder: 'border-rose-200',  iconColor: 'text-rose-400',  badge: 'bg-rose-100 text-rose-500' },
};

const progettoStatoConfig = {
  'Attivo':     { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  'In Pausa':   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Completato': { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500' },
  'Archiviato': { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
};

const colonne = ['To Do', 'In Progress', 'Done', 'Annullata'];

const statoBtns = [
  { stato: 'To Do',       icon: Circle,      cls: 'bg-slate-100 text-slate-600 hover:bg-slate-200', activeCls: 'bg-slate-500 text-white' },
  { stato: 'In Progress', icon: Clock,       cls: 'bg-blue-50 text-blue-600 hover:bg-blue-100',     activeCls: 'bg-blue-500 text-white' },
  { stato: 'Done',        icon: CheckCircle, cls: 'bg-teal-50 text-teal-600 hover:bg-teal-100',     activeCls: 'bg-teal-500 text-white' },
  { stato: 'Annullata',   icon: Ban,         cls: 'bg-rose-50 text-rose-500 hover:bg-rose-100',     activeCls: 'bg-rose-400 text-white' },
];

const emptyTask     = { titolo: '', descrizione: '', priorita: 'Media', stato: 'To Do', assegnatario: '', scadenza: '', progetto_id: '' };
const emptyProgetto = { nome: '', descrizione: '', budget: '', speso: '', capo_progetto: '', stato: 'Attivo', note: '', scadenza: '' };

const uid = () => Math.random().toString(36).slice(2, 10);

// ── TaskPreviewSheet ──────────────────────────────────────────────────────────
function TaskPreviewSheet({ task, progetti, onClose, onEdit, onDelete, onChangeStato }) {
  const p = prioritaConfig[task.priorita] || prioritaConfig.Media;
  const progetto = progetti.find(pr => pr.id === task.progetto_id);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full bg-white rounded-t-[32px] shadow-2xl overflow-y-auto"
        style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>
        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-start gap-3 pt-1">
            <div className={`w-1.5 self-stretch rounded-full shrink-0 ${
              task.priorita === 'Alta' ? 'bg-rose-500' : task.priorita === 'Media' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
            <div className="flex-1 min-w-0">
              <h2 className={`text-xl font-extrabold leading-tight ${task.stato === 'Done' || task.stato === 'Annullata' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {task.titolo}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${p.color}`}>{task.priorita}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statoConfig[task.stato]?.badge}`}>{task.stato}</span>
                {progetto && <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-violet-100 text-violet-700">📁 {progetto.nome}</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrizione</p>
            {task.descrizione
              ? <p className="text-base text-slate-700 leading-relaxed font-medium">{task.descrizione}</p>
              : <p className="text-sm text-slate-400 italic">Nessuna descrizione inserita</p>}
          </div>

          {(task.scadenza || task.assegnatario) && (
            <div className="space-y-2">
              {task.scadenza && (
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><Clock size={16} className="text-amber-500" /></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scadenza</p><p className="text-sm font-bold text-slate-700">{task.scadenza}</p></div>
                </div>
              )}
              {task.assegnatario && (
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{task.assegnatario.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assegnato a</p><p className="text-sm font-bold text-slate-700">{task.assegnatario}</p></div>
                </div>
              )}
            </div>
          )}

          {onChangeStato && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cambia stato</p>
              <div className="grid grid-cols-4 gap-2">
                {statoBtns.map(({ stato, icon: Icon, cls, activeCls }) => {
                  const isActive = task.stato === stato;
                  return (
                    <button key={stato} onClick={() => { onChangeStato(task, stato); onClose(); }} disabled={isActive}
                      className={`flex flex-col items-center justify-center py-3.5 gap-1.5 rounded-2xl text-[11px] font-bold transition-all active:scale-95 ${isActive ? activeCls + ' shadow-md' : cls}`}>
                      <Icon size={18} />
                      <span className="leading-none">{stato === 'In Progress' ? 'In corso' : stato}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {onChangeStato && (
            <div className="flex flex-col gap-3 pt-1">
              <button onClick={() => { onEdit(task); onClose(); }}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-extrabold text-lg shadow-xl shadow-blue-200 active:scale-[.97] transition-all">
                <Pencil size={22} strokeWidth={2.5} /> Modifica Task
              </button>
              <button onClick={() => { onDelete(task.id); onClose(); }}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold text-lg shadow-xl shadow-rose-200 active:scale-[.97] transition-all">
                <Trash2 size={22} strokeWidth={2.5} /> Elimina Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
function TaskCard({ task, progetti, onDelete, onEdit, onChangeStato }) {
  const [showPreview, setShowPreview] = useState(false);
  const p = prioritaConfig[task.priorita] || prioritaConfig.Media;
  const progetto = progetti.find(pr => pr.id === task.progetto_id);

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${p.border} hover:shadow-md transition-all md:cursor-default cursor-pointer active:scale-[0.98]`}
        onClick={() => setShowPreview(true)}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold leading-snug flex-1 ${task.stato === 'Done' || task.stato === 'Annullata' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.titolo}
            </h4>
            <div className="hidden md:flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(task)} className="text-slate-300 hover:text-blue-500 transition-colors p-0.5"><Pencil size={13} /></button>
              <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"><Trash2 size={13} /></button>
            </div>
          </div>
          {task.descrizione && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{task.descrizione}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.color}`}>{task.priorita}</span>
            {task.scadenza && (
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-slate-400" />
                <span className="text-xs text-slate-400">{task.scadenza}</span>
              </div>
            )}
            {task.assegnatario && (
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-bold">{task.assegnatario.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <span className="text-xs text-slate-400">{task.assegnatario.split(' ')[0]}</span>
              </div>
            )}
          </div>
          {progetto && (
            <div className="mt-2 flex items-center gap-1 bg-violet-50 rounded-lg px-2 py-1">
              <span className="text-[10px] text-violet-600 font-medium">📁 {progetto.nome}</span>
            </div>
          )}
        </div>
        {onChangeStato && (
          <div className="hidden md:grid grid-cols-4 border-t border-slate-100 rounded-b-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {statoBtns.map(({ stato, icon: Icon, cls, activeCls }) => {
              const isActive = task.stato === stato;
              return (
                <button key={stato} onClick={() => onChangeStato(task, stato)} disabled={isActive}
                  className={`flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-semibold transition-all ${isActive ? activeCls : cls}`}>
                  <Icon size={14} />
                  <span className="leading-none">{stato === 'In Progress' ? 'In corso' : stato}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {showPreview && (
        <TaskPreviewSheet task={task} progetti={progetti} onClose={() => setShowPreview(false)}
          onEdit={onEdit} onDelete={onDelete} onChangeStato={onChangeStato} />
      )}
    </>
  );
}

// ── TaskForm ──────────────────────────────────────────────────────────────────
function TaskForm({ form, setForm, soci, progetti, onSave, onClose, saving, editId }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">{editId ? 'Modifica Task' : 'Nuovo Task'}</h3>
          <button onClick={onClose} className="modal-close"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">Titolo *</label>
            <input className="form-input" placeholder="Titolo del task..." value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Descrizione</label>
            <textarea className="form-textarea" rows={3} placeholder="Descrizione..." value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Progetto</label>
            <select className="form-select" value={form.progetto_id} onChange={e => setForm(f => ({ ...f, progetto_id: e.target.value }))}>
              <option value="">— Generale (nessun progetto) —</option>
              {progetti.filter(p => p.stato !== 'Archiviato').map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Priorità</label>
              <select className="form-select" value={form.priorita} onChange={e => setForm(f => ({ ...f, priorita: e.target.value }))}>
                <option>Alta</option><option>Media</option><option>Bassa</option>
              </select>
            </div>
            <div>
              <label className="form-label">Stato</label>
              <select className="form-select" value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value }))}>
                <option>To Do</option><option>In Progress</option><option>Done</option><option>Annullata</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Assegnatario</label>
            <select className="form-select" value={form.assegnatario} onChange={e => setForm(f => ({ ...f, assegnatario: e.target.value }))}>
              <option value="">— Nessuno —</option>
              {soci.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Scadenza</label>
            <input type="date" className="form-input" value={form.scadenza} onChange={e => setForm(f => ({ ...f, scadenza: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Annulla</button>
          <button onClick={onSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editId ? 'Salva modifiche' : 'Aggiungi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProgettoForm ──────────────────────────────────────────────────────────────
function ProgettoForm({ form, setForm, soci, onSave, onClose, saving, editId }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editId ? 'Modifica Progetto' : 'Nuovo Progetto'}</h3>
          <button onClick={onClose} className="modal-close"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">Nome progetto *</label>
            <input className="form-input" placeholder="Es. Evento estivo 2025..." value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Descrizione</label>
            <textarea className="form-textarea" rows={3} placeholder="Descrizione del progetto..." value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Capo progetto</label>
              <select className="form-select" value={form.capo_progetto} onChange={e => setForm(f => ({ ...f, capo_progetto: e.target.value }))}>
                <option value="">— Nessuno —</option>
                {soci.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Stato</label>
              <select className="form-select" value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value }))}>
                <option>Attivo</option><option>In Pausa</option><option>Completato</option><option>Archiviato</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Budget (€)</label>
              <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Già speso (€)</label>
              <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00" value={form.speso} onChange={e => setForm(f => ({ ...f, speso: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Data scadenza</label>
            <input type="date" className="form-input" value={form.scadenza} onChange={e => setForm(f => ({ ...f, scadenza: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Note</label>
            <textarea className="form-textarea" rows={3} placeholder="Note aggiuntive..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Annulla</button>
          <button onClick={onSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editId ? 'Salva modifiche' : 'Crea Progetto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProgettoCard ──────────────────────────────────────────────────────────────
function ProgettoCard({ progetto, tasks, onSelect, onEdit, onDelete, canEdit }) {
  const tasksProg = tasks.filter(t => t.progetto_id === progetto.id);
  const done = tasksProg.filter(t => t.stato === 'Done').length;
  const total = tasksProg.length;
  const perc = total ? Math.round((done / total) * 100) : 0;
  const cfg = progettoStatoConfig[progetto.stato] || progettoStatoConfig['Attivo'];
  const budgetNum = parseFloat(progetto.budget) || 0;
  const spesoNum = parseFloat(progetto.speso) || 0;
  const budgetUsed = budgetNum ? Math.min(100, Math.round((spesoNum / budgetNum) * 100)) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] overflow-hidden"
      onClick={() => onSelect(progetto)}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {progetto.stato}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 leading-snug">{progetto.nome}</h3>
            {progetto.capo_progetto && (
              <p className="text-xs text-slate-500 mt-0.5">👤 {progetto.capo_progetto}</p>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(progetto)} className="text-slate-300 hover:text-blue-500 transition-colors p-1 rounded-lg hover:bg-blue-50"><Pencil size={14} /></button>
              <button onClick={() => onDelete(progetto.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50"><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        {progetto.descrizione && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{progetto.descrizione}</p>}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Task</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${perc}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-600">{done}/{total}</span>
            </div>
          </div>
          {budgetNum > 0 ? (
            <div className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Budget</p>
              <div className="flex items-center gap-2">
                {budgetUsed !== null && (
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${budgetUsed > 90 ? 'bg-rose-500' : budgetUsed > 70 ? 'bg-amber-400' : 'bg-teal-500'}`}
                      style={{ width: `${budgetUsed}%` }} />
                  </div>
                )}
                <span className="text-xs font-bold text-slate-600">€{budgetNum.toLocaleString('it-IT')}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-center">
              <span className="text-xs text-slate-400">Nessun budget</span>
            </div>
          )}
        </div>

        {progetto.scadenza && (
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1"><Clock size={11} /> Scadenza: {progetto.scadenza}</p>
        )}
      </div>
    </div>
  );
}

// ── ProgettoDetail ────────────────────────────────────────────────────────────
function ProgettoDetail({ progetto, tasks, soci, onBack, onEdit, onDelete, onAcquistiChange, onTaskAdd, onTaskEdit, onTaskDelete, onTaskChangeStato, canEdit }) {
  const [newAcquisto, setNewAcquisto] = useState('');
  const tasksProg = tasks.filter(t => t.progetto_id === progetto.id);
  const done = tasksProg.filter(t => t.stato === 'Done').length;
  const cfg = progettoStatoConfig[progetto.stato] || progettoStatoConfig['Attivo'];
  const acquisti = progetto.acquisti || [];
  const budgetNum = parseFloat(progetto.budget) || 0;
  const spesoNum = parseFloat(progetto.speso) || 0;
  const budgetPerc = budgetNum ? Math.min(100, Math.round((spesoNum / budgetNum) * 100)) : null;

  const toggleAcquisto = (id) => {
    if (!canEdit) return;
    onAcquistiChange(progetto.id, acquisti.map(a => a.id === id ? { ...a, fatto: !a.fatto } : a));
  };

  const addAcquisto = () => {
    if (!newAcquisto.trim()) return;
    onAcquistiChange(progetto.id, [...acquisti, { id: uid(), testo: newAcquisto.trim(), fatto: false }]);
    setNewAcquisto('');
  };

  const removeAcquisto = (id) => {
    onAcquistiChange(progetto.id, acquisti.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} mb-0.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{progetto.stato}
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight truncate">{progetto.nome}</h2>
        </div>
        {canEdit && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(progetto)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm">
              <Pencil size={15} />
            </button>
            <button onClick={() => onDelete(progetto.id)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Task totali</p>
          <p className="text-2xl font-extrabold text-slate-800">{tasksProg.length}</p>
          <p className="text-xs text-teal-600 font-semibold">{done} completat{done === 1 ? 'a' : 'e'}</p>
        </div>
        {budgetNum > 0 && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Budget</p>
              <p className="text-2xl font-extrabold text-slate-800">€{budgetNum.toLocaleString('it-IT')}</p>
              <p className="text-xs text-slate-500 font-medium">Totale</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Speso</p>
              <p className={`text-2xl font-extrabold ${spesoNum > budgetNum ? 'text-rose-600' : 'text-slate-800'}`}>€{spesoNum.toLocaleString('it-IT')}</p>
              {budgetPerc !== null && (
                <p className={`text-xs font-semibold ${budgetPerc > 90 ? 'text-rose-500' : budgetPerc > 70 ? 'text-amber-500' : 'text-teal-600'}`}>{budgetPerc}% del budget</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Rimanente</p>
              <p className={`text-2xl font-extrabold ${budgetNum - spesoNum < 0 ? 'text-rose-600' : 'text-teal-600'}`}>€{(budgetNum - spesoNum).toLocaleString('it-IT')}</p>
              <p className="text-xs text-slate-500 font-medium">Disponibile</p>
            </div>
          </>
        )}
        {progetto.capo_progetto && (
          <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Capo Progetto</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">{progetto.capo_progetto.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
              </div>
              <p className="text-sm font-bold text-slate-700 truncate">{progetto.capo_progetto}</p>
            </div>
          </div>
        )}
      </div>

      {/* Descrizione */}
      {progetto.descrizione && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FileText size={12} /> Descrizione</p>
          <p className="text-sm text-slate-700 leading-relaxed">{progetto.descrizione}</p>
        </div>
      )}

      {/* Avanzamento */}
      {tasksProg.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avanzamento</p>
            <span className="text-xs font-extrabold text-slate-700">{done}/{tasksProg.length} ({Math.round((done / tasksProg.length) * 100)}%)</span>
          </div>
          <div className="bg-slate-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.round((done / tasksProg.length) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* To-do list del progetto */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <CheckSquare size={15} className="text-blue-500" /> Task del Progetto
          </p>
          {canEdit && (
            <button onClick={() => onTaskAdd(progetto.id)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
              <Plus size={13} /> Aggiungi
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-50">
          {tasksProg.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <AlertCircle size={20} className="mb-2 opacity-40" />
              <p className="text-xs">Nessuna task per questo progetto</p>
            </div>
          ) : tasksProg.map(task => {
            const p = prioritaConfig[task.priorita] || prioritaConfig.Media;
            const isDone = task.stato === 'Done';
            return (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <button onClick={() => canEdit && onTaskChangeStato(task, isDone ? 'To Do' : 'Done')} disabled={!canEdit}
                  className={`shrink-0 transition-colors ${isDone ? 'text-teal-500' : 'text-slate-300 hover:text-teal-400'}`}>
                  {isDone ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.titolo}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${p.color}`}>{task.priorita}</span>
                    {task.assegnatario && <span className="text-[10px] text-slate-400">{task.assegnatario}</span>}
                    {task.scadenza && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock size={9} />{task.scadenza}</span>}
                    {task.stato === 'In Progress' && <span className="text-[10px] text-blue-600 font-bold">In corso</span>}
                    {task.stato === 'Annullata' && <span className="text-[10px] text-rose-500 font-bold">Annullata</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => onTaskEdit(task)} className="text-slate-300 hover:text-blue-500 transition-colors p-1"><Pencil size={13} /></button>
                    <button onClick={() => onTaskDelete(task.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cose da acquistare */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ShoppingCart size={15} className="text-amber-500" /> Cose da acquistare
            {acquisti.length > 0 && (
              <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                {acquisti.filter(a => a.fatto).length}/{acquisti.length}
              </span>
            )}
          </p>
        </div>
        <div className="p-4 space-y-2">
          {acquisti.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Nessun articolo</p>}
          {acquisti.map(a => (
            <div key={a.id} className="flex items-center gap-3 group">
              <button onClick={() => toggleAcquisto(a.id)} disabled={!canEdit}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${a.fatto ? 'bg-teal-500 border-teal-500' : 'border-slate-300 hover:border-teal-400'}`}>
                {a.fatto && <CheckCircle size={11} className="text-white" strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-sm ${a.fatto ? 'line-through text-slate-400' : 'text-slate-700'}`}>{a.testo}</span>
              {canEdit && (
                <button onClick={() => removeAcquisto(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-0.5">
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <div className="flex gap-2 pt-2">
              <input className="form-input flex-1 text-sm py-2" placeholder="Aggiungi articolo..."
                value={newAcquisto} onChange={e => setNewAcquisto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAcquisto()} />
              <button onClick={addAcquisto}
                className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors shrink-0 shadow-md shadow-amber-200">
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      {progetto.note && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FileText size={12} /> Note</p>
          <p className="text-sm text-amber-900 leading-relaxed">{progetto.note}</p>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Tasks() {
  const { canEdit } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [progetti, setProgetti] = useState([]);
  const [soci, setSoci]         = useState([]);
  const [loading, setLoading]   = useState(true);

  const [mainTab, setMainTab]               = useState('tasks');
  const [activeTab, setActiveTab]           = useState('To Do');
  const [progettoFiltro, setProgettoFiltro] = useState('');
  const [progettoSelezionato, setProgettoSelezionato] = useState(null);

  const [showTaskForm, setShowTaskForm]   = useState(false);
  const [taskEditId, setTaskEditId]       = useState(null);
  const [taskForm, setTaskForm]           = useState(emptyTask);
  const [savingTask, setSavingTask]       = useState(false);

  const [showProgettoForm, setShowProgettoForm] = useState(false);
  const [progettoEditId, setProgettoEditId]     = useState(null);
  const [progettoForm, setProgettoForm]         = useState(emptyProgetto);
  const [savingProgetto, setSavingProgetto]     = useState(false);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchProgetti(), fetchSoci()]);

    const ch = supabase.channel('tasks-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' },
        (p) => setTasks(prev => prev.find(t => t.id === p.new.id) ? prev : [p.new, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (p) => setTasks(prev => prev.map(t => t.id === p.new.id ? p.new : t)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' },
        (p) => setTasks(prev => prev.filter(t => t.id !== p.old.id)))
      .subscribe();

    const chP = supabase.channel('progetti-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progetti' }, fetchProgetti)
      .subscribe();

    return () => { supabase.removeChannel(ch); supabase.removeChannel(chP); };
  }, []);

  const fetchTasks    = async () => { const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }); if (data) setTasks(data); setLoading(false); };
  const fetchProgetti = async () => { const { data } = await supabase.from('progetti').select('*').order('created_at', { ascending: false }); if (data) setProgetti(data); };
  const fetchSoci     = async () => { const { data } = await supabase.from('soci').select('id, nome').eq('attivo', true).order('nome'); if (data) setSoci(data); };

  // ── Task handlers ─────────────────────────────────────────────────────────
  const openAddTask = (progettoId = '') => { setTaskEditId(null); setTaskForm({ ...emptyTask, progetto_id: progettoId }); setShowTaskForm(true); };
  const openEditTask = (task) => {
    setTaskEditId(task.id);
    setTaskForm({ titolo: task.titolo || '', descrizione: task.descrizione || '', priorita: task.priorita || 'Media', stato: task.stato || 'To Do', assegnatario: task.assegnatario || '', scadenza: task.scadenza || '', progetto_id: task.progetto_id || '' });
    setShowTaskForm(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.titolo.trim()) return;
    setSavingTask(true);
    const payload = { titolo: taskForm.titolo, descrizione: taskForm.descrizione, priorita: taskForm.priorita, stato: taskForm.stato, assegnatario: taskForm.assegnatario || null, scadenza: taskForm.scadenza || null, progetto_id: taskForm.progetto_id || null };
    if (taskEditId) {
      const prima = tasks.find(t => t.id === taskEditId);
      const { data, error } = await supabase.from('tasks').update(payload).eq('id', taskEditId).select().single();
      if (error) { alert('Errore: ' + error.message); } else {
        setTasks(prev => prev.map(t => t.id === taskEditId ? data : t));
        if (prima?.stato !== payload.stato) {
          const e = { 'Done': '✅', 'In Progress': '🔄', 'To Do': '📋', 'Annullata': '❌' };
          sendPush({ title: `${e[payload.stato] || '📋'} Task aggiornato: ${payload.titolo}`, body: `${prima?.stato} → ${payload.stato}`, url: '/' });
        }
      }
    } else {
      const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
      if (error) { alert('Errore: ' + error.message); } else {
        setTasks(prev => [data, ...prev]);
        sendPush({ title: '📋 Nuovo task: ' + payload.titolo, body: payload.assegnatario ? `Assegnato a ${payload.assegnatario}` : 'Task generale', url: '/' });
      }
    }
    setShowTaskForm(false); setSavingTask(false);
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Eliminare questo task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleChangeStato = async (task, nuovoStato) => {
    if (task.stato === nuovoStato) return;
    const { data, error } = await supabase.from('tasks').update({ stato: nuovoStato }).eq('id', task.id).select().single();
    if (error) { alert('Errore: ' + error.message); return; }
    setTasks(prev => prev.map(t => t.id === task.id ? data : t));
    const e = { 'Done': '✅', 'In Progress': '🔄', 'To Do': '📋', 'Annullata': '❌' };
    sendPush({ title: `${e[nuovoStato] || '📋'} ${task.titolo}`, body: `${task.stato} → ${nuovoStato}`, url: '/' });
  };

  // ── Progetto handlers ─────────────────────────────────────────────────────
  const openAddProgetto  = () => { setProgettoEditId(null); setProgettoForm(emptyProgetto); setShowProgettoForm(true); };
  const openEditProgetto = (p) => { setProgettoEditId(p.id); setProgettoForm({ nome: p.nome || '', descrizione: p.descrizione || '', budget: p.budget || '', speso: p.speso || '', capo_progetto: p.capo_progetto || '', stato: p.stato || 'Attivo', note: p.note || '', scadenza: p.scadenza || '' }); setShowProgettoForm(true); };

  const handleSaveProgetto = async () => {
    if (!progettoForm.nome.trim()) return;
    setSavingProgetto(true);
    const payload = { nome: progettoForm.nome, descrizione: progettoForm.descrizione || null, budget: progettoForm.budget ? parseFloat(progettoForm.budget) : null, speso: progettoForm.speso ? parseFloat(progettoForm.speso) : 0, capo_progetto: progettoForm.capo_progetto || null, stato: progettoForm.stato, note: progettoForm.note || null, scadenza: progettoForm.scadenza || null };
    if (progettoEditId) {
      const { data, error } = await supabase.from('progetti').update(payload).eq('id', progettoEditId).select().single();
      if (error) { alert('Errore: ' + error.message); } else {
        setProgetti(prev => prev.map(p => p.id === progettoEditId ? data : p));
        if (progettoSelezionato?.id === progettoEditId) setProgettoSelezionato(data);
      }
    } else {
      const { data, error } = await supabase.from('progetti').insert([payload]).select().single();
      if (error) { alert('Errore: ' + error.message); } else setProgetti(prev => [data, ...prev]);
    }
    setShowProgettoForm(false); setSavingProgetto(false);
  };

  const handleDeleteProgetto = async (id) => {
    if (!confirm('Eliminare questo progetto? Le task associate diventeranno generali.')) return;
    await supabase.from('progetti').delete().eq('id', id);
    setProgetti(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.map(t => t.progetto_id === id ? { ...t, progetto_id: null } : t));
    if (progettoSelezionato?.id === id) setProgettoSelezionato(null);
  };

  const handleAcquistiChange = async (progettoId, acquisti) => {
    const { data, error } = await supabase.from('progetti').update({ acquisti }).eq('id', progettoId).select().single();
    if (!error && data) {
      setProgetti(prev => prev.map(p => p.id === progettoId ? data : p));
      if (progettoSelezionato?.id === progettoId) setProgettoSelezionato(data);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (progettoFiltro === '') return true;
    if (progettoFiltro === 'generale') return !t.progetto_id;
    return t.progetto_id === progettoFiltro;
  });

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento...</p>
    </div>
  );

  // ── Modals (shared) ───────────────────────────────────────────────────────
  const modals = (
    <>
      {showTaskForm && (
        <TaskForm form={taskForm} setForm={setTaskForm} soci={soci} progetti={progetti}
          onSave={handleSaveTask} onClose={() => setShowTaskForm(false)} saving={savingTask} editId={taskEditId} />
      )}
      {showProgettoForm && (
        <ProgettoForm form={progettoForm} setForm={setProgettoForm} soci={soci}
          onSave={handleSaveProgetto} onClose={() => setShowProgettoForm(false)} saving={savingProgetto} editId={progettoEditId} />
      )}
    </>
  );

  // ── Progetto detail view ──────────────────────────────────────────────────
  if (progettoSelezionato) {
    return (
      <div className="page">
        {modals}
        <ProgettoDetail
          progetto={progettoSelezionato} tasks={tasks} soci={soci}
          onBack={() => setProgettoSelezionato(null)}
          onEdit={openEditProgetto}
          onDelete={(id) => { handleDeleteProgetto(id); setProgettoSelezionato(null); }}
          onAcquistiChange={handleAcquistiChange}
          onTaskAdd={openAddTask} onTaskEdit={openEditTask}
          onTaskDelete={handleDeleteTask} onTaskChangeStato={handleChangeStato}
          canEdit={canEdit()} />
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {modals}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Task & Progetti</h2>
          <p className="page-subtitle">
            {mainTab === 'tasks'
              ? `${tasks.filter(t => t.stato !== 'Done' && t.stato !== 'Annullata').length} aperti · ${tasks.filter(t => t.stato === 'Done').length} completati`
              : `${progetti.length} progetti · ${progetti.filter(p => p.stato === 'Attivo').length} attivi`}
          </p>
        </div>
        {canEdit() && (
          <button onClick={mainTab === 'tasks' ? () => openAddTask() : openAddProgetto} className="btn-primary">
            <Plus size={16} /> {mainTab === 'tasks' ? 'Nuovo Task' : 'Nuovo Progetto'}
          </button>
        )}
      </div>

      {/* Main tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
        <button onClick={() => setMainTab('tasks')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTab === 'tasks' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
          <CheckSquare size={15} /> Task
        </button>
        <button onClick={() => setMainTab('progetti')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTab === 'progetti' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
          <FolderOpen size={15} /> Progetti
        </button>
      </div>

      {/* ── TASK TAB ── */}
      {mainTab === 'tasks' && (
        <>
          {/* Filtro per progetto */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {[
              { value: '', label: 'Tutti' },
              { value: 'generale', label: '📋 Generale' },
              ...progetti.filter(p => p.stato !== 'Archiviato').map(p => ({ value: p.id, label: `📁 ${p.nome}` })),
            ].map(({ value, label }) => (
              <button key={value} onClick={() => setProgettoFiltro(value)}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${progettoFiltro === value ? 'bg-blue-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Mobile: tab per colonna */}
          <div className="md:hidden">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-4">
              {colonne.map(col => {
                const cfg = statoConfig[col];
                const Icon = cfg.icon;
                const count = filteredTasks.filter(t => t.stato === col).length;
                const isActive = activeTab === col;
                return (
                  <button key={col} onClick={() => setActiveTab(col)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${isActive ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                    <Icon size={14} className={isActive ? cfg.iconColor : ''} />
                    <span>{col === 'In Progress' ? 'In corso' : col}</span>
                    {count > 0 && <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? cfg.badge : 'bg-slate-200 text-slate-500'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
            <div className="space-y-3">
              {filteredTasks.filter(t => t.stato === activeTab).map(task => (
                <TaskCard key={task.id} task={task} progetti={progetti} onDelete={handleDeleteTask}
                  onEdit={canEdit() ? openEditTask : () => {}} onChangeStato={canEdit() ? handleChangeStato : null} />
              ))}
              {filteredTasks.filter(t => t.stato === activeTab).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <AlertCircle size={24} className="mb-2 opacity-40" /><p className="text-sm">Nessun task</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: kanban */}
          <div className="hidden md:grid md:grid-cols-4 gap-5">
            {colonne.map(col => {
              const colTasks = filteredTasks.filter(t => t.stato === col);
              const cfg = statoConfig[col];
              const Icon = cfg.icon;
              return (
                <div key={col} className={`rounded-2xl border ${cfg.headerBorder} overflow-hidden`}>
                  <div className={`${cfg.headerBg} px-4 py-3 flex items-center gap-2 border-b ${cfg.headerBorder}`}>
                    <Icon size={15} className={cfg.iconColor} />
                    <span className="text-sm font-semibold text-slate-700">{col}</span>
                    <span className="ml-auto bg-white text-slate-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">{colTasks.length}</span>
                  </div>
                  <div className="p-3 space-y-3 min-h-32 bg-slate-50/50">
                    {colTasks.map(task => (
                      <TaskCard key={task.id} task={task} progetti={progetti} onDelete={handleDeleteTask}
                        onEdit={canEdit() ? openEditTask : () => {}} onChangeStato={canEdit() ? handleChangeStato : null} />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <AlertCircle size={20} className="mb-2 opacity-40" /><p className="text-xs">Nessun task</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── PROGETTI TAB ── */}
      {mainTab === 'progetti' && (
        <>
          {progetti.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FolderOpen size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Nessun progetto ancora</p>
              {canEdit() && (
                <button onClick={openAddProgetto} className="mt-4 btn-primary"><Plus size={14} /> Crea il primo progetto</button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {[
                { label: 'Attivi & In Pausa', filter: (p) => p.stato === 'Attivo' || p.stato === 'In Pausa' },
                { label: 'Completati',         filter: (p) => p.stato === 'Completato' },
                { label: 'Archiviati',         filter: (p) => p.stato === 'Archiviato' },
              ].map(({ label, filter }) => {
                const list = progetti.filter(filter);
                if (!list.length) return null;
                return (
                  <div key={label}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map(progetto => (
                        <ProgettoCard key={progetto.id} progetto={progetto} tasks={tasks}
                          onSelect={setProgettoSelezionato} onEdit={openEditProgetto}
                          onDelete={handleDeleteProgetto} canEdit={canEdit()} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
