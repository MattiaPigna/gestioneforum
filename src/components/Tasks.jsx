import { useState, useEffect } from 'react';
import { Plus, X, CheckCircle, Circle, Clock, AlertCircle, Trash2, Loader2, Download, FileText, Pencil, Save } from 'lucide-react';
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
  'To Do':       { icon: Circle,       headerBg: 'bg-slate-50',  headerBorder: 'border-slate-200', iconColor: 'text-slate-400' },
  'In Progress': { icon: Clock,        headerBg: 'bg-blue-50',   headerBorder: 'border-blue-200',  iconColor: 'text-blue-500' },
  'Done':        { icon: CheckCircle,  headerBg: 'bg-teal-50',   headerBorder: 'border-teal-200',  iconColor: 'text-teal-500' },
};

const colonne = ['To Do', 'In Progress', 'Done'];
const emptyForm = { titolo: '', descrizione: '', priorita: 'Media', stato: 'To Do', assegnatario: '', scadenza: '', evento_id: '' };

function TaskCard({ task, eventi, onDelete, onEdit }) {
  const p = prioritaConfig[task.priorita] || prioritaConfig.Media;
  const eventoCollegato = eventi.find(e => e.id === task.evento_id);
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 border-l-4 ${p.border} hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-800 leading-snug flex-1">{task.titolo}</h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          <button onClick={() => onEdit(task)} className="text-slate-300 hover:text-blue-500 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {task.descrizione && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{task.descrizione}</p>}
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.color}`}>{task.priorita}</span>
        {task.assegnatario && (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">{task.assegnatario.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <span className="text-xs text-slate-400">{task.assegnatario.split(' ')[0]}</span>
          </div>
        )}
      </div>
      {task.scadenza && (
        <div className="flex items-center gap-1 mt-2">
          <Clock size={10} className="text-slate-400" />
          <span className="text-xs text-slate-400">{task.scadenza}</span>
        </div>
      )}
      {eventoCollegato && (
        <div className="mt-2 flex items-center gap-1 bg-blue-50 rounded-lg px-2 py-1">
          <span className="text-[10px] text-blue-600 font-medium">📅 {eventoCollegato.titolo}</span>
        </div>
      )}
    </div>
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
        // Notifica completamento (solo quando passa a Done)
        if (payload.stato === 'Done' && taskPrima?.stato !== 'Done') {
          sendPush({
            title: '✅ Task completato: ' + payload.titolo,
            body: payload.assegnatario ? `Completato da ${payload.assegnatario}` : 'Task completato',
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

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento task...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Task & Progetti</h2>
          <p className="text-slate-500 mt-1">{tasks.filter(t => t.stato !== 'Done').length} aperti · {tasks.filter(t => t.stato === 'Done').length} completati</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button onClick={() => exportTasksCSV(tasks)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => exportTasksPDF(tasks)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
              <FileText size={14} /> PDF
            </button>
          </div>
          {canEdit() && (
            <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <Plus size={16} /> Nuovo Task
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Modifica Task' : 'Nuovo Task'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Titolo *</label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Titolo del task..." value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Descrizione</label>
                <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" rows={3} placeholder="Descrizione..." value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Priorità</label>
                  <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.priorita} onChange={e => setForm(f => ({ ...f, priorita: e.target.value }))}>
                    <option>Alta</option><option>Media</option><option>Bassa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Stato</label>
                  <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.stato} onChange={e => setForm(f => ({ ...f, stato: e.target.value }))}>
                    <option>To Do</option><option>In Progress</option><option>Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Assegnatario</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.assegnatario} onChange={e => setForm(f => ({ ...f, assegnatario: e.target.value }))}>
                  <option value="">— Nessuno —</option>
                  {soci.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Scadenza</label>
                <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.scadenza} onChange={e => setForm(f => ({ ...f, scadenza: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editId ? 'Salva modifiche' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  <TaskCard key={task.id} task={task} eventi={eventi} onDelete={handleDelete} onEdit={canEdit() ? openEdit : () => {}} />
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
