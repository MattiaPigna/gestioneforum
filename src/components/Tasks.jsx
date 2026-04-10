import { useState, useEffect } from 'react';
import { Plus, X, CheckCircle, Circle, Clock, AlertCircle, Trash2, Loader2, Download, FileText, Pencil, Save, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportTasksCSV, exportTasksPDF } from '../utils/export';
import { sendPush } from '../lib/push';

const prioritaConfig = {
  Alta:  { color: 'bg-rose-100 text-rose-600 border-rose-200',    border: 'border-l-rose-500' },
  Media: { color: 'bg-amber-100 text-amber-600 border-amber-200', border: 'border-l-amber-500' },
  Bassa: { color: 'bg-emerald-100 text-emerald-600 border-emerald-200', border: 'border-l-emerald-500' },
};

const statoConfig = {
  'To Do':       { icon: Circle,      headerBg: 'bg-slate-50',  headerBorder: 'border-slate-200', iconColor: 'text-slate-400',  badge: 'bg-slate-100 text-slate-600' },
  'In Progress': { icon: Clock,       headerBg: 'bg-blue-50',   headerBorder: 'border-blue-200',  iconColor: 'text-blue-500',   badge: 'bg-blue-100 text-blue-600' },
  'Done':        { icon: CheckCircle, headerBg: 'bg-teal-50',   headerBorder: 'border-teal-200',  iconColor: 'text-teal-500',   badge: 'bg-teal-100 text-teal-600' },
  'Annullata':   { icon: Ban,         headerBg: 'bg-rose-50',   headerBorder: 'border-rose-200',  iconColor: 'text-rose-400',   badge: 'bg-rose-100 text-rose-500' },
};

const colonne = ['To Do', 'In Progress', 'Done', 'Annullata'];
const emptyForm = { titolo: '', descrizione: '', priorita: 'Media', stato: 'To Do', assegnatario: '', scadenza: '', evento_id: '' };

const statoBtns = [
  { stato: 'To Do',       icon: Circle,       cls: 'bg-slate-100 text-slate-600 hover:bg-slate-200',   activeCls: 'bg-slate-500 text-white' },
  { stato: 'In Progress', icon: Clock,        cls: 'bg-blue-50 text-blue-600 hover:bg-blue-100',        activeCls: 'bg-blue-500 text-white' },
  { stato: 'Done',        icon: CheckCircle,  cls: 'bg-teal-50 text-teal-600 hover:bg-teal-100',        activeCls: 'bg-teal-500 text-white' },
  { stato: 'Annullata',   icon: Ban,          cls: 'bg-rose-50 text-rose-500 hover:bg-rose-100',        activeCls: 'bg-rose-400 text-white' },
];

// Bottom sheet di anteprima task
function TaskPreviewSheet({ task, eventi, onClose, onEdit, onDelete, onChangeStato }) {
  const p = prioritaConfig[task.priorita] || prioritaConfig.Media;
  const eventoCollegato = eventi.find(e => e.id === task.evento_id);
  const isDone = task.stato === 'Done';
  const isAnnullata = task.stato === 'Annullata';

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      {/* Overlay con blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full bg-white rounded-t-[32px] shadow-2xl overflow-y-auto"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* Barra colorata priorità + close */}
          <div className="flex items-start gap-3 pt-1">
            <div className={`w-1.5 self-stretch rounded-full shrink-0 ${
              task.priorita === 'Alta' ? 'bg-rose-500' :
              task.priorita === 'Media' ? 'bg-amber-400' : 'bg-emerald-500'
            }`} />
            <div className="flex-1 min-w-0">
              {/* Titolo grande */}
              <h2 className={`text-xl font-extrabold leading-tight ${isDone || isAnnullata ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {task.titolo}
              </h2>
              {/* Badge */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${p.color}`}>{task.priorita}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statoConfig[task.stato]?.badge}`}>{task.stato}</span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 active:scale-90 transition-transform">
              <X size={18} />
            </button>
          </div>

          {/* Descrizione — area grande e leggibile */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrizione</p>
            {task.descrizione ? (
              <p className="text-base text-slate-700 leading-relaxed font-medium">{task.descrizione}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Nessuna descrizione inserita</p>
            )}
          </div>

          {/* Meta info */}
          {(task.scadenza || task.assegnatario || eventoCollegato) && (
            <div className="grid grid-cols-1 gap-2">
              {task.scadenza && (
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scadenza</p>
                    <p className="text-sm font-bold text-slate-700">{task.scadenza}</p>
                  </div>
                </div>
              )}
              {task.assegnatario && (
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {task.assegnatario.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assegnato a</p>
                    <p className="text-sm font-bold text-slate-700">{task.assegnatario}</p>
                  </div>
                </div>
              )}
              {eventoCollegato && (
                <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-lg">
                    📅
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Evento collegato</p>
                    <p className="text-sm font-bold text-blue-700">{eventoCollegato.titolo}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cambio stato */}
          {onChangeStato && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cambia stato</p>
              <div className="grid grid-cols-4 gap-2">
                {statoBtns.map(({ stato, icon: Icon, cls, activeCls }) => {
                  const isActive = task.stato === stato;
                  return (
                    <button
                      key={stato}
                      onClick={() => { onChangeStato(task, stato); onClose(); }}
                      disabled={isActive}
                      className={`flex flex-col items-center justify-center py-3.5 gap-1.5 rounded-2xl text-[11px] font-bold transition-all active:scale-95 ${isActive ? activeCls + ' shadow-md' : cls}`}
                    >
                      <Icon size={18} />
                      <span className="leading-none">{stato === 'In Progress' ? 'In corso' : stato}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Pulsanti principali: MODIFICA ed ELIMINA ── */}
          {onChangeStato && (
            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={() => { onEdit(task); onClose(); }}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-extrabold text-lg shadow-xl shadow-blue-200 active:scale-[.97] transition-all"
              >
                <Pencil size={22} strokeWidth={2.5} />
                Modifica Task
              </button>
              <button
                onClick={() => { onDelete(task.id); onClose(); }}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold text-lg shadow-xl shadow-rose-200 active:scale-[.97] transition-all"
              >
                <Trash2 size={22} strokeWidth={2.5} />
                Elimina Task
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, eventi, onDelete, onEdit, onChangeStato }) {
  const [showPreview, setShowPreview] = useState(false);
  const p = prioritaConfig[task.priorita] || prioritaConfig.Media;
  const eventoCollegato = eventi.find(e => e.id === task.evento_id);
  const isDone = task.stato === 'Done';
  const isAnnullata = task.stato === 'Annullata';

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${p.border} hover:shadow-md transition-all md:cursor-default cursor-pointer active:scale-[0.98]`}
        onClick={() => setShowPreview(true)}
      >
        {/* Contenuto card */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold leading-snug flex-1 ${isDone || isAnnullata ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.titolo}</h4>
            {/* Pulsanti piccoli visibili solo su desktop */}
            <div className="hidden md:flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(task)} className="text-slate-300 hover:text-blue-500 transition-colors p-0.5">
                <Pencil size={13} />
              </button>
              <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-0.5">
                <Trash2 size={13} />
              </button>
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
          {eventoCollegato && (
            <div className="mt-2 flex items-center gap-1 bg-blue-50 rounded-lg px-2 py-1">
              <span className="text-[10px] text-blue-600 font-medium">📅 {eventoCollegato.titolo}</span>
            </div>
          )}
        </div>

        {/* Pulsanti stato — solo desktop */}
        {onChangeStato && (
          <div className="hidden md:grid grid-cols-4 border-t border-slate-100 rounded-b-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {statoBtns.map(({ stato, icon: Icon, cls, activeCls }) => {
              const isActive = task.stato === stato;
              return (
                <button
                  key={stato}
                  onClick={() => onChangeStato(task, stato)}
                  disabled={isActive}
                  className={`flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-semibold transition-all ${isActive ? activeCls : cls}`}
                >
                  <Icon size={14} />
                  <span className="leading-none">{stato === 'In Progress' ? 'In corso' : stato}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom sheet anteprima */}
      {showPreview && (
        <TaskPreviewSheet
          task={task}
          eventi={eventi}
          onClose={() => setShowPreview(false)}
          onEdit={onEdit}
          onDelete={onDelete}
          onChangeStato={onChangeStato}
        />
      )}
    </>
  );
}

export default function Tasks() {
  const { canEdit } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [soci, setSoci] = useState([]);
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('To Do');

  useEffect(() => {
    Promise.all([fetchTasks(), fetchSoci(), fetchEventi()]);
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  const fetchSoci = async () => {
    const { data } = await supabase.from('soci').select('id, nome').eq('attivo', true).order('nome');
    if (data) setSoci(data);
  };

  const fetchEventi = async () => {
    const { data } = await supabase.from('eventi').select('id, titolo, data').order('data');
    if (data) setEventi(data);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditId(task.id);
    setForm({
      titolo: task.titolo || '',
      descrizione: task.descrizione || '',
      priorita: task.priorita || 'Media',
      stato: task.stato || 'To Do',
      assegnatario: task.assegnatario || '',
      scadenza: task.scadenza || '',
      evento_id: task.evento_id || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.titolo.trim()) return;
    setSaving(true);
    const payload = {
      titolo: form.titolo,
      descrizione: form.descrizione,
      priorita: form.priorita,
      stato: form.stato,
      assegnatario: form.assegnatario || null,
      scadenza: form.scadenza || null,
      evento_id: form.evento_id || null,
    };
    if (editId) {
      const taskPrima = tasks.find(t => t.id === editId);
      const { data, error } = await supabase.from('tasks').update(payload).eq('id', editId).select().single();
      if (error) alert('Errore: ' + error.message);
      else {
        setTasks(prev => prev.map(t => t.id === editId ? data : t));
        // Notifica se lo stato è cambiato
        if (taskPrima?.stato !== payload.stato) {
          const statoEmoji = { 'Done': '✅', 'In Progress': '🔄', 'To Do': '📋', 'Annullata': '❌' };
          sendPush({
            title: `${statoEmoji[payload.stato] || '📋'} Task aggiornato: ${payload.titolo}`,
            body: `Stato: ${taskPrima?.stato} → ${payload.stato}${payload.assegnatario ? ` · ${payload.assegnatario}` : ''}`,
            url: '/',
            assegnatario: null,
          });
        }
      }
    } else {
      const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
      if (error) alert('Errore: ' + error.message);
      else {
        setTasks(prev => [data, ...prev]);
        // Notifica: solo all'assegnatario oppure a tutti se non assegnato
        sendPush({
          title: '📋 Nuovo task: ' + payload.titolo,
          body: payload.assegnatario
            ? `Assegnato a ${payload.assegnatario}` + (payload.scadenza ? ` · Scadenza: ${payload.scadenza}` : '')
            : 'Nessun assegnatario — task per tutti',
          url: '/',
          assegnatario: payload.assegnatario || null,
        });
      }
    }
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleChangeStato = async (task, nuovoStato) => {
    if (task.stato === nuovoStato) return;
    const { data, error } = await supabase
      .from('tasks').update({ stato: nuovoStato }).eq('id', task.id).select().single();
    if (error) { alert('Errore: ' + error.message); return; }
    setTasks(prev => prev.map(t => t.id === task.id ? data : t));
    const statoEmoji = { 'Done': '✅', 'In Progress': '🔄', 'To Do': '📋', 'Annullata': '❌' };
    sendPush({
      title: `${statoEmoji[nuovoStato] || '📋'} Task aggiornato: ${task.titolo}`,
      body: `Stato: ${task.stato} → ${nuovoStato}${task.assegnatario ? ` · ${task.assegnatario}` : ''}`,
      url: '/',
      assegnatario: null,
    });
  };

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento task...</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Task & Progetti</h2>
          <p className="page-subtitle">{tasks.filter(t => t.stato !== 'Done').length} aperti · {tasks.filter(t => t.stato === 'Done').length} completati</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportTasksCSV(tasks)} className="btn-ghost px-3 py-2 text-xs">
            <Download size={13} /> CSV
          </button>
          <button onClick={() => exportTasksPDF(tasks)} className="btn-ghost px-3 py-2 text-xs">
            <FileText size={13} /> PDF
          </button>
          {canEdit() && (
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16} /> Nuovo Task
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Modifica Task' : 'Nuovo Task'}</h3>
              <button onClick={() => setShowForm(false)} className="modal-close"><X size={16} /></button>
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
                    <option>To Do</option><option>In Progress</option><option>Done</option>
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
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editId ? 'Salva modifiche' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile: tab switcher ── */}
      <div className="md:hidden">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-4">
          {colonne.map(col => {
            const cfg = statoConfig[col];
            const Icon = cfg.icon;
            const count = tasks.filter(t => t.stato === col).length;
            const isActive = activeTab === col;
            return (
              <button
                key={col}
                onClick={() => setActiveTab(col)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                <Icon size={14} className={isActive ? cfg.iconColor : ''} />
                <span>{col === 'In Progress' ? 'In corso' : col}</span>
                {count > 0 && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? cfg.badge : 'bg-slate-200 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {tasks.filter(t => t.stato === activeTab).map(task => (
            <TaskCard key={task.id} task={task} eventi={eventi} onDelete={handleDelete} onEdit={canEdit() ? openEdit : () => {}} onChangeStato={canEdit() ? handleChangeStato : null} />
          ))}
          {tasks.filter(t => t.stato === activeTab).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <AlertCircle size={24} className="mb-2 opacity-40" />
              <p className="text-sm">Nessun task</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: kanban grid ── */}
      <div className="hidden md:grid md:grid-cols-4 gap-5">
        {colonne.map(col => {
          const colTasks = tasks.filter(t => t.stato === col);
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
                  <TaskCard key={task.id} task={task} eventi={eventi} onDelete={handleDelete} onEdit={canEdit() ? openEdit : () => {}} onChangeStato={canEdit() ? handleChangeStato : null} />
                ))}
                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <AlertCircle size={20} className="mb-2 opacity-40" />
                    <p className="text-xs">Nessun task</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
