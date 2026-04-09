import { useState, useEffect } from 'react';
import { Plus, X, Loader2, Trash2, Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const tipoConfig = {
  riunione:  { color: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-500' },
  scadenza:  { color: 'bg-rose-100 text-rose-700 border-rose-200',   dot: 'bg-rose-500' },
  evento:    { color: 'bg-teal-100 text-teal-700 border-teal-200',   dot: 'bg-teal-500' },
  workshop:  { color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  altro:     { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
};

const mesi = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const giorni = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];

const prioritaDot = { Alta: 'bg-rose-500', Media: 'bg-amber-400', Bassa: 'bg-emerald-500' };
const prioritaColor = { Alta: 'bg-rose-100 text-rose-700 border-rose-200', Media: 'bg-amber-100 text-amber-700 border-amber-200', Bassa: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

export default function Calendario() {
  const { canEdit } = useAuth();
  const [eventi, setEventi] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [oggi] = useState(new Date());
  const [meseCorrente, setMeseCorrente] = useState(new Date());
  const [form, setForm] = useState({ titolo: '', descrizione: '', data: '', ora: '', tipo: 'evento', luogo: '' });

  useEffect(() => {
    Promise.all([fetchEventi(), fetchTasks()]);
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

  const handleAdd = async () => {
    if (!form.titolo.trim() || !form.data) return;
    setSaving(true);
    const { data, error } = await supabase.from('eventi').insert([{
      titolo: form.titolo, descrizione: form.descrizione,
      data: form.data, ora: form.ora || null,
      tipo: form.tipo, luogo: form.luogo,
    }]).select().single();
    if (!error) { setEventi(prev => [...prev, data].sort((a,b) => a.data.localeCompare(b.data))); setForm({ titolo: '', descrizione: '', data: '', ora: '', tipo: 'evento', luogo: '' }); setShowForm(false); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('eventi').delete().eq('id', id);
    setEventi(prev => prev.filter(e => e.id !== id));
  };

  // Costruisci griglia calendario
  const anno = meseCorrente.getFullYear();
  const mese = meseCorrente.getMonth();
  const primoGiorno = new Date(anno, mese, 1);
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

  const eventiDelGiorno = (data) => {
    const d = data.toISOString().split('T')[0];
    return eventi.filter(e => e.data === d);
  };

  const taskDelGiorno = (data) => {
    const d = data.toISOString().split('T')[0];
    return tasks.filter(t => t.scadenza === d);
  };

  const completeTask = async (id) => {
    await supabase.from('tasks').update({ stato: 'Done' }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, stato: 'Done' } : t));
  };

  const removeTask = async (id) => {
    if (!confirm('Rimuovere questo task dal calendario?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const prossimiEventi = eventi.filter(e => new Date(e.data) >= oggi).slice(0, 5);
  const oggi_str = oggi.toISOString().split('T')[0];
  const taskCalendario = tasks
    .filter(t => t.scadenza)
    .sort((a, b) => a.scadenza.localeCompare(b.scadenza))
    .slice(0, 8);

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento calendario...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendario & Eventi</h2>
          <p className="text-slate-500 mt-1">{eventi.length} eventi in agenda</p>
        </div>
        {canEdit() && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all">
            <Plus size={16} /> Nuovo Evento
          </button>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Nuovo Evento</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Titolo *</label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nome evento..." value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Data *</label>
                  <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Ora</label>
                  <input type="time" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.ora} onChange={e => setForm(f => ({ ...f, ora: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
                  <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    {Object.keys(tipoConfig).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Luogo</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Sede, online..." value={form.luogo} onChange={e => setForm(f => ({ ...f, luogo: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Descrizione</label>
                <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" rows={2} value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Salva
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
              const isToday = data.toDateString() === oggi.toDateString();
              const eventiDay = eventiDelGiorno(data);
              const tasksDay = taskDelGiorno(data);
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
                const isDone = t.stato === 'Done';
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
            const cfg = tipoConfig[ev.tipo] || tipoConfig.altro;
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
