import { useState, useEffect } from 'react';
import { Plus, X, Loader2, Trash2, TrendingUp, TrendingDown, Wallet, Filter, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportCSV } from '../utils/export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const categorie = ['Evento', 'Materiale', 'Affitto', 'Comunicazione', 'Contributo', 'Rimborso', 'Altro'];

const categoriaColor = {
  Evento:        'bg-blue-100 text-blue-700',
  Materiale:     'bg-amber-100 text-amber-700',
  Affitto:       'bg-violet-100 text-violet-700',
  Comunicazione: 'bg-teal-100 text-teal-700',
  Contributo:    'bg-emerald-100 text-emerald-700',
  Rimborso:      'bg-orange-100 text-orange-700',
  Altro:         'bg-slate-100 text-slate-600',
};

function exportFinanzePDF(movimenti, saldo) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text('Registro Finanze - Forum dei Giovani', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} · Saldo: €${saldo.toFixed(2)}`, 14, 28);
  autoTable(doc, {
    startY: 34,
    head: [['Data', 'Descrizione', 'Categoria', 'Tipo', 'Importo']],
    body: movimenti.map(m => [
      m.data,
      m.descrizione,
      m.categoria || '—',
      m.tipo,
      (m.tipo === 'entrata' ? '+' : '-') + '€' + Number(m.importo).toFixed(2),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 4: { halign: 'right' } },
  });
  doc.save('finanze.pdf');
}

export default function Finanze() {
  const { canEdit } = useAuth();
  const [movimenti, setMovimenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('tutti');
  const [filtroCategoria, setFiltroCategoria] = useState('tutte');
  const [form, setForm] = useState({ descrizione: '', importo: '', tipo: 'uscita', categoria: 'Altro', data: new Date().toISOString().split('T')[0], note: '' });

  useEffect(() => { fetchMovimenti(); }, []);

  const fetchMovimenti = async () => {
    const { data } = await supabase.from('finanze').select('*').order('data', { ascending: false });
    if (data) setMovimenti(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.descrizione.trim() || !form.importo) return;
    setSaving(true);
    const { data, error } = await supabase.from('finanze').insert([{
      descrizione: form.descrizione,
      importo: parseFloat(form.importo),
      tipo: form.tipo,
      categoria: form.categoria,
      data: form.data,
      note: form.note,
    }]).select().single();
    if (!error) {
      setMovimenti(prev => [data, ...prev]);
      setForm({ descrizione: '', importo: '', tipo: 'uscita', categoria: 'Altro', data: new Date().toISOString().split('T')[0], note: '' });
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo movimento?')) return;
    await supabase.from('finanze').delete().eq('id', id);
    setMovimenti(prev => prev.filter(m => m.id !== id));
  };

  const filtered = movimenti.filter(m => {
    const matchTipo = filtroTipo === 'tutti' || m.tipo === filtroTipo;
    const matchCat = filtroCategoria === 'tutte' || m.categoria === filtroCategoria;
    return matchTipo && matchCat;
  });

  const totEntrate = movimenti.filter(m => m.tipo === 'entrata').reduce((s, m) => s + Number(m.importo), 0);
  const totUscite  = movimenti.filter(m => m.tipo === 'uscita').reduce((s, m) => s + Number(m.importo), 0);
  const saldo = totEntrate - totUscite;

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento finanze...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestione Finanze</h2>
          <p className="text-slate-500 mt-1">{movimenti.length} movimenti registrati</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button onClick={() => exportCSV(filtered, 'finanze.csv', [
              { key: 'data', label: 'Data' }, { key: 'descrizione', label: 'Descrizione' },
              { key: 'categoria', label: 'Categoria' }, { key: 'tipo', label: 'Tipo' }, { key: 'importo', label: 'Importo' },
            ])} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => exportFinanzePDF(filtered, saldo)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
              <FileText size={14} /> PDF
            </button>
          </div>
          {canEdit() && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <Plus size={16} /> Nuovo Movimento
            </button>
          )}
        </div>
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-50 p-2 rounded-xl"><TrendingUp size={18} className="text-emerald-500" /></div>
            <span className="text-sm font-medium text-slate-600">Totale Entrate</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">+€{totEntrate.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-rose-50 p-2 rounded-xl"><TrendingDown size={18} className="text-rose-500" /></div>
            <span className="text-sm font-medium text-slate-600">Totale Uscite</span>
          </div>
          <p className="text-2xl font-bold text-rose-500">-€{totUscite.toFixed(2)}</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm border ${saldo >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-2 rounded-xl"><Wallet size={18} className={saldo >= 0 ? 'text-emerald-600' : 'text-rose-500'} /></div>
            <span className="text-sm font-medium text-slate-600">Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {saldo >= 0 ? '+' : ''}€{saldo.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Nuovo Movimento</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            {/* Tipo toggle */}
            <div className="flex gap-2 mb-4">
              {['entrata', 'uscita'].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize
                    ${form.tipo === t
                      ? t === 'entrata' ? 'bg-emerald-500 text-white shadow-md' : 'bg-rose-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t === 'entrata' ? '▲ Entrata' : '▼ Uscita'}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Descrizione *</label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Es. Acquisto materiale evento..." value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Importo (€) *</label>
                  <input type="number" min="0" step="0.01" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0.00" value={form.importo} onChange={e => setForm(f => ({ ...f, importo: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Data</label>
                  <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Categoria</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {categorie.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Note</label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Opzionale..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
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

      {/* Filtri */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-slate-400" />
        {['tutti', 'entrata', 'uscita'].map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
              ${filtroTipo === t ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'tutti' ? 'Tutti' : t === 'entrata' ? '▲ Entrate' : '▼ Uscite'}
          </button>
        ))}
        <span className="text-slate-300">|</span>
        <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="tutte">Tutte le categorie</option>
          {categorie.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabella movimenti */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrizione</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Importo</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">{m.data}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-slate-700">{m.descrizione}</p>
                    {m.note && <p className="text-xs text-slate-400 mt-0.5">{m.note}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoriaColor[m.categoria] || categoriaColor.Altro}`}>
                      {m.categoria || 'Altro'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`text-sm font-bold ${m.tipo === 'entrata' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {m.tipo === 'entrata' ? '+' : '-'}€{Number(m.importo).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {canEdit() && (
                      <button onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                        <Trash2 size={14} />
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
            <Wallet size={32} className="opacity-30 mb-2" />
            <p className="text-sm font-medium">Nessun movimento</p>
          </div>
        )}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{filtered.length} movimenti</span>
          <span className={`text-sm font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            Saldo: {saldo >= 0 ? '+' : ''}€{saldo.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
