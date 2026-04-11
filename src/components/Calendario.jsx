import { useState, useEffect } from 'react';
import { Plus, X, Loader2, Trash2, Calendar, Clock, MapPin, CheckCircle2, CheckSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sendPush } from '../lib/push';

const tipoConfig = {
  riunione:  { color: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  scadenza:  { color: 'bg-rose-100 text-rose-700 border-rose-200',     dot: 'bg-rose-500' },
  evento:    { color: 'bg-teal-100 text-teal-700 border-teal-200',     dot: 'bg-teal-500' },
  workshop:  { color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  altro:     { color: 'bg-slate-100 text-slate-700 border-slate-200',  dot: 'bg-slate-400' },
};

const mesi   = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const giorni = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];

const prioritaDot   = { Alta: 'bg-rose-500', Media: 'bg-amber-400', Bassa: 'bg-emerald-500' };

const emptyForm = { titolo: '', descrizione: '', data: '', ora: '', tipo: 'evento', luogo: '' };
const emptyTaskRow = { titolo: '', assegnatario: '', priorita: 'Media' };

export default function Calendario() {
  const { canEdit } = useAuth();
  const [eventi, setEventi]         = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [soci, setSoci]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [oggi]                      = useState(new Date());
  const [meseCorrente, setMeseCorrente] = useState(new Date());
  const [form, setForm]             = useState(emptyForm);
  const [formTasks, setFormTasks]   = useState([]); // task da creare con l'evento

  useEffect(() => {
    Promise.all([fetchEventi(), fetchTasks(), fetchSoci()]);
  }, []);

  const fetchEventi = async () => {
    const { data } = await supabase.from('eventi').select('*').order('data');
    if (data) setEventi(data);
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('id, titolo, scadenza, priorita, stato').not('scadenza', 'is', null);
    if (data) setTasks(data);
  };

  const fetchSoci = async () => {
    const { data } = await supabase.from('soci').select('id, nome').eq('attivo', true).order('nome');
    if (data) setSoci(data);
  };

  const openForm = () => {
    setForm(emptyForm);
    setFormTasks([]);
    setShowForm(true);
  };

  const addTaskRow    = () => setFormTasks(prev => [...prev, { ...emptyTaskRow }]);
  const removeTaskRow = (i) => setFormTasks(prev => prev.filter((_, idx) => idx !== i));
  const updateTaskRow = (i, field, value) =>
    setFormTasks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));

  const handleAdd = async () => {
    if (!form.titolo.trim() || !form.data) return;
    setSaving(true);

    // Salva evento
    const { data: ev, error } = await supabase.from('eventi').insert([{
      titolo: form.titolo, descrizione: form.descrizione,
      data: form.data, ora: form.ora || null,
      tipo: form.tipo, luogo: form.luogo,
    }]).select().single();

    if (!error) {
      setEventi(prev => [...prev, ev].sort((a, b) => a.data.localeCompare(b.data)));

      // Crea task collegati all'evento
      const taskValide = formTasks.filter(t => t.titolo.trim());
      if (taskValide.length > 0) {
        const taskPayload = taskValide.map(t => ({
          titolo:       t.titolo.trim(),
          assegnatario: t.assegnatario || null,
          priorita:     t.priorita,
          stato:        'To Do',
          scadenza:     form.data,
        }));
        await supabase.from('tasks').insert(taskPayload);
        fetchTasks();
      }

      sendPush({
        title: '📅 Nuovo evento: ' + ev.titolo,
        body: ev.data + (ev.ora ? ` alle ${ev.ora}` : '') + (ev.luogo ? ` · ${ev.luogo}` : ''),
        url: '/',
      });

      setForm(emptyForm);
      setFormTasks([]);
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('eventi').delete().eq('id', id);
    setEventi(prev => prev.filter(e => e.id !== id));
  };

  // Griglia calendario
  const anno = meseCorrente.getFullYear();
  const mese = meseCorrente.getMonth();
  const primoGiorno  = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0);
  const inizioGriglia = new Date(primoGiorno);
  inizioGriglia.setDate(inizioGriglia.getDate() - ((primoGiorno.getDay() + 6) % 7));

  const celle = [];
  const cur = new Date(inizioGriglia);
  while (cur <= ultimoGiorno || celle.length % 7 !== 0) {
    celle.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
    if (celle.length > 42) break;
  }

  const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const eventiDelGiorno = (d) => eventi.filter(e => e.data === toStr(d));
  const taskDelGiorno   = (d) => tasks.filter(t => t.scadenza === toStr(d));

  const completeTask = async (id) => {
    await supabase.from('tasks').update({ stato: 'Done' }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, stato: 'Done' } : t));
  };

  const removeTask = async (id) => {
    if (!confirm('Rimuovere questo task dal calendario?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const oggi_str        = toStr(oggi);
  const prossimiEventi  = eventi.filter(e => e.data >= oggi_str).slice(0, 5);
  const taskCalendario  = tasks.filter(t => t.scadenza).sort((a,b) => a.scadenza.localeCompare(b.scadenza)).slice(0, 8);

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento calendario...</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Calendario & Eventi</h2>
          <p className="page-subtitle">{eventi.length} eventi in agenda</p>
        </div>
        {canEdit() && (
          <button onClick={openForm} className="btn-primary">
            <Plus size={16} /> Nuovo Evento
          </button>
        )}
      </div>

      {/* Modal Nuovo Evento */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nuovo Evento</h3>
              <button onClick={() => setShowForm(false)} className="modal-close"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Titolo *</label>
                <input className="form-input" placeholder="Nome evento..." value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Data *</label>
                  <input type="date" className="form-input" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Ora</label>
                  <input type="time" className="form-input" value={form.ora} onChange={e => setForm(f => ({ ...f, ora: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    {Object.keys(tipoConfig).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Luogo</label>
                  <input className="form-input" placeholder="Sede, online..." value={form.luogo} onChange={e => setForm(f => ({ ...f, luogo: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Descrizione</label>
                <textarea className="form-textarea" rows={2} value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
              </div>

              {/* Sezione task collegati */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="form-label mb-0 flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-blue-500" /> Task da creare
                  </label>
                  <button type="button" onClick={addTaskRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Plus size={12} /> Aggiungi task
                  </button>
                </div>
                {formTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">Nessun task collegato — opzionale</p>
                )}
                <div className="space-y-2">
                  {formTasks.map((t, i) => (
                    <div key={i} className="flex gap-2 items-center bg-slate-50 rounded-xl p-2">
                      <input className="form-input flex-1 py-1.5 text-xs" placeholder="Titolo task..."
                        value={t.titolo} onChange={e => updateTaskRow(i, 'titolo', e.target.value)} />
                      <select className="form-select py-1.5 text-xs w-28"
                        value={t.assegnatario} onChange={e => updateTaskRow(i, 'assegnatario', e.target.value)}>
                        <option value="">Nessuno</option>
                        {soci.map(s => <option key={s.id} value={s.nome}>{s.nome.split(' ')[0]}</option>)}
                      </select>
                      <select className="form-select py-1.5 text-xs w-24"
                        value={t.priorita} onChange={e => updateTaskRow(i, 'priorita', e.target.value)}>
                        <option>Alta</option><option>Media</option><option>Bassa</option>
                      </select>
                      <button onClick={() => removeTaskRow(i)} className="text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Salva{formTasks.filter(t => t.titolo.trim()).length > 0 ? ` + ${formTasks.filter(t => t.titolo.trim()).length} task` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario griglia */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMeseCorrente(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">‹</button>
            <h3 className="font-bold text-slate-800">{mesi[mese]} {anno}</h3>
            <button onClick={() => setMeseCorrente(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {giorni.map(g => <div key={g} className="text-center text-xs font-semibold text-slate-400 py-1">{g}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celle.map((data, i) => {
              const isCurrentMonth = data.getMonth() === mese;
              const isToday        = data.toDateString() === oggi.toDateString();
              const eventiDay      = eventiDelGiorno(data);
              const tasksDay       = taskDelGiorno(data);
              return (
                <div key={i} className={`min-h-12 p-1 rounded-lg text-xs ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'} ${isToday ? 'ring-2 ring-blue-400' : ''}`}>
                  <span className={`block text-center w-6 h-6 rounded-full flex items-center justify-center mx-auto font-medium
                    ${isToday ? 'bg-gradient-to-br from-blue-500 to-teal-500 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                    {data.getDate()}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {eventiDay.slice(0, 2).map(ev => (
                      <div key={ev.id} className={`w-full h-1.5 rounded-full ${tipoConfig[ev.tipo]?.dot || 'bg-slate-400'}`} title={ev.titolo} />
                    ))}
                    {tasksDay.slice(0, 2).map(t => (
                      <div key={t.id} className={`w-full h-1.5 rounded-full opacity-70 ${t.stato === 'Done' ? 'bg-emerald-500' : prioritaDot[t.priorita] || 'bg-slate-400'}`} title={`Task: ${t.titolo}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pannello laterale */}
        <div className="space-y-4 flex flex-col">
          {/* Prossimi eventi */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Prossimi Eventi</h3>
            <div className="space-y-3">
              {prossimiEventi.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nessun evento in programma</p>
              ) : prossimiEventi.map(ev => {
                const cfg = tipoConfig[ev.tipo] || tipoConfig.altro;
                return (
                  <div key={ev.id} className="group flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-1 rounded-full ${cfg.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{ev.titolo}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium border ${cfg.color}`}>{ev.tipo}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/>{ev.data}</span>
                        {ev.ora && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10}/>{ev.ora.slice(0,5)}</span>}
                        {ev.luogo && <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10}/>{ev.luogo}</span>}
                      </div>
                    </div>
                    {canEdit() && (
                      <button onClick={() => handleDelete(ev.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task in scadenza */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Task sul calendario</h3>
            <div className="space-y-2">
              {taskCalendario.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nessun task con scadenza</p>
              ) : taskCalendario.map(t => {
                const isDone    = t.stato === 'Done';
                const isScaduto = !isDone && t.scadenza < oggi_str;
                return (
                  <div key={t.id} className={`flex gap-3 items-center p-2.5 rounded-xl transition-colors ${isDone ? 'bg-emerald-50' : isScaduto ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : prioritaDot[t.priorita] || 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDone ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>{t.titolo}</p>
                      <p className={`text-xs ${isDone ? 'text-emerald-500' : isScaduto ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                        {isScaduto ? '⚠ ' : ''}{t.scadenza}
                      </p>
                    </div>
                    {isDone ? (
                      <button onClick={() => removeTask(t.id)} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-1 rounded-lg font-medium transition-colors shrink-0">
                        Rimuovi
                      </button>
                    ) : (
                      <button onClick={() => completeTask(t.id)} className="text-slate-300 hover:text-emerald-500 transition-colors shrink-0" title="Segna completato">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lista completa */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Tutti gli eventi ({eventi.length})</h3>
        <div className="space-y-2">
          {eventi.map(ev => {
            const cfg    = tipoConfig[ev.tipo] || tipoConfig.altro;
            const passato = new Date(ev.data) < oggi;
            return (
              <div key={ev.id} className={`group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors ${passato ? 'opacity-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">{ev.titolo}</span>
                  {ev.descrizione && <span className="text-xs text-slate-400 ml-2">{ev.descrizione}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.color}`}>{ev.tipo}</span>
                  <span className="text-xs text-slate-400">{ev.data}{ev.ora ? ' · ' + ev.ora.slice(0,5) : ''}</span>
                  {ev.luogo && <span className="text-xs text-slate-400 hidden sm:block">{ev.luogo}</span>}
                  {passato && <span className="text-xs text-slate-300">passato</span>}
                </div>
                {canEdit() && (
                  <button onClick={() => handleDelete(ev.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
          {eventi.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Nessun evento ancora</p>}
        </div>
      </div>
    </div>
  );
}
