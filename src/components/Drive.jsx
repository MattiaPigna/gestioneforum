import { useState, useEffect, useRef } from 'react';
import { FileText, Sheet, Folder, Presentation, ExternalLink, Search, Filter, Plus, X, Loader2, Trash2, Link, Upload, CloudUpload, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

const DRIVE_FUNC_URL = `${SUPABASE_URL}/functions/v1/upload-drive`;

const tipoConfig = {
  pdf:    { icon: FileText,     color: 'text-rose-500',   bg: 'bg-rose-50',    label: 'PDF' },
  sheet:  { icon: Sheet,        color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Foglio' },
  doc:    { icon: FileText,     color: 'text-blue-500',   bg: 'bg-blue-50',    label: 'Documento' },
  folder: { icon: Folder,       color: 'text-amber-500',  bg: 'bg-amber-50',   label: 'Cartella' },
  slides: { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50',  label: 'Presentazione' },
};

/* Riconosce il tipo dal MIME o dall'estensione del file */
function detectTipo(file) {
  const mime = file.type || '';
  const name = file.name.toLowerCase();
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('spreadsheet') || mime.includes('excel') || name.match(/\.(xlsx?|csv|ods)$/)) return 'sheet';
  if (mime.includes('presentation') || mime.includes('powerpoint') || name.match(/\.(pptx?|odp)$/)) return 'slides';
  return 'doc';
}

/* Formatta byte → KB / MB / GB */
function formatSize(bytes) {
  if (!bytes || bytes === '—') return '—';
  const n = parseInt(bytes, 10);
  if (isNaN(n) || n === 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

/* Estrae ID da link Google Drive per anteprima */
const getDriveId = (url) => {
  const m = (url || '').match(/[-\w]{25,}/);
  return m ? m[0] : null;
};


export default function Drive() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('tutti');
  const [showForm, setShowForm] = useState(false);
  const [modo, setModo] = useState('upload'); // 'upload' | 'link'
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null | 'uploading' | 'done' | 'error'
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({ nome: '', tipo: 'doc', dimensione: '', link: '', condiviso: true });
  const fileInputRef = useRef(null);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    const { data } = await supabase.from('drive').select('*').order('created_at', { ascending: false });
    if (data) setFiles(data);
    setLoading(false);
  };

  /* ─── Caricamento su Google Drive via Edge Function ─── */
  const uploadToDrive = async (file) => {
    setSaving(true);
    setUploadProgress('uploading');
    setUploadError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const fd = new FormData();
      fd.append('file', file);

      const resp = await fetch(DRIVE_FUNC_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: fd,
      });

      const rawText = await resp.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch {
        throw new Error(`Risposta non-JSON [${resp.status}]: ${rawText.slice(0, 300)}`);
      }

      if (!resp.ok || result.error) {
        throw new Error(`[${resp.status}] ${result.error || 'Upload fallito'}`);
      }

      // Salva metadati in Supabase
      const tipo = detectTipo(file);
      const { data, error } = await supabase.from('drive').insert([{
        nome:       result.name,
        tipo,
        dimensione: formatSize(result.size),
        link:       result.link,
        condiviso:  true,
        drive_id:   result.driveId,
      }]).select().single();

      if (error) throw new Error(error.message);

      setFiles(prev => [data, ...prev]);
      setUploadProgress('done');

      setTimeout(() => {
        setShowForm(false);
        setUploadProgress(null);
      }, 1200);

    } catch (err) {
      setUploadError(err.message);
      setUploadProgress('error');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Aggiunta link manuale ─── */
  const handleAddLink = async () => {
    if (!form.nome.trim() || !form.link.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('drive').insert([{
      nome:       form.nome,
      tipo:       form.tipo,
      dimensione: form.dimensione || '—',
      link:       form.link,
      condiviso:  form.condiviso,
    }]).select().single();
    if (!error) {
      setFiles(prev => [data, ...prev]);
      setForm({ nome: '', tipo: 'doc', dimensione: '', link: '', condiviso: true });
      setShowForm(false);
    } else {
      alert('Errore: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Rimuovere questo file dall\'archivio?')) return;
    await supabase.from('drive').delete().eq('id', id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadToDrive(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) uploadToDrive(file);
  };

  const openForm = () => {
    setModo('upload');
    setUploadProgress(null);
    setUploadError('');
    setForm({ nome: '', tipo: 'doc', dimensione: '', link: '', condiviso: true });
    setShowForm(true);
  };

  const tipi = ['tutti', ...Object.keys(tipoConfig)];

  const filtered = files.filter(f => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === 'tutti' || f.tipo === filtroTipo;
    return matchSearch && matchTipo;
  });

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento archivio...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Archivio Drive</h2>
          <p className="text-slate-500 mt-1">{files.length} file collegati</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all">
          <Plus size={16} /> Aggiungi File
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Aggiungi File Drive</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              <button onClick={() => setModo('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                  ${modo === 'upload' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                <CloudUpload size={15} /> Carica file
              </button>
              <button onClick={() => setModo('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                  ${modo === 'link' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                <Link size={15} /> Aggiungi link
              </button>
            </div>

            {modo === 'upload' ? (
              <div className="space-y-4">
                {/* Drop zone */}
                {uploadProgress === null && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                      ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                    <CloudUpload size={32} className={`mx-auto mb-3 ${dragOver ? 'text-blue-500' : 'text-slate-300'}`} />
                    <p className="text-sm font-medium text-slate-600">Trascina un file qui</p>
                    <p className="text-xs text-slate-400 mt-1">oppure clicca per selezionare</p>
                    <p className="text-xs text-slate-300 mt-2">PDF, Word, Excel, PowerPoint...</p>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
                  </div>
                )}

                {/* Uploading state */}
                {uploadProgress === 'uploading' && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-sm font-medium text-slate-600">Caricamento su Google Drive...</p>
                    <p className="text-xs text-slate-400">Attendi, il file viene caricato</p>
                  </div>
                )}

                {/* Success state */}
                {uploadProgress === 'done' && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <CheckCircle2 size={32} className="text-teal-500" />
                    <p className="text-sm font-medium text-teal-700">File caricato con successo!</p>
                  </div>
                )}

                {/* Error state */}
                {uploadProgress === 'error' && (
                  <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <AlertCircle size={32} className="text-rose-400" />
                      <p className="text-sm font-medium text-rose-600">Caricamento fallito</p>
                      <p className="text-xs text-slate-500 text-center max-w-xs">{uploadError}</p>
                    </div>
                    <button onClick={() => { setUploadProgress(null); setUploadError(''); }}
                      className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                      Riprova
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Link manuale */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Nome file *</label>
                  <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Es. Verbale riunione.pdf" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Link Google Drive *</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-400">
                    <Link size={14} className="text-slate-400 shrink-0" />
                    <input className="flex-1 py-2 text-sm focus:outline-none" placeholder="https://drive.google.com/file/d/..."
                      value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Incolla il link di condivisione da Google Drive</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                      {Object.entries(tipoConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Dimensione</label>
                    <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Es. 2.3 MB" value={form.dimensione} onChange={e => setForm(f => ({ ...f, dimensione: e.target.value }))} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.condiviso} onChange={e => setForm(f => ({ ...f, condiviso: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-slate-600">File condiviso con tutti i soci</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
                  <button onClick={handleAddLink} disabled={saving}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving && <Loader2 size={14} className="animate-spin" />} Aggiungi
                  </button>
                </div>
              </div>
            )}

            {modo === 'upload' && uploadProgress === null && (
              <button onClick={() => setShowForm(false)} className="w-full mt-3 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                Annulla
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder-slate-400"
            placeholder="Cerca file..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <div className="flex gap-1 flex-wrap">
            {tipi.map(tipo => (
              <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                  ${filtroTipo === tipo ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {tipo === 'tutti' ? 'Tutti' : tipoConfig[tipo]?.label || tipo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(file => {
          const cfg = tipoConfig[file.tipo] || tipoConfig.doc;
          const Icon = cfg.icon;
          return (
            <div key={file.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group p-4">
              <div className="flex items-start gap-3">
                <div className={`${cfg.bg} p-3 rounded-xl`}>
                  <Icon size={22} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">{file.nome}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-slate-400">{file.dimensione}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(file.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${file.condiviso ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                  {file.condiviso ? '🌐 Condiviso' : '🔒 Privato'}
                </span>
                <a href={file.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors">
                  Apri su Drive <ExternalLink size={11} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FileText size={40} className="opacity-30 mb-3" />
          <p className="font-medium">{files.length === 0 ? 'Nessun file ancora' : 'Nessun file trovato'}</p>
          <p className="text-sm mt-1">{files.length === 0 ? 'Aggiungi il primo file con il pulsante in alto' : 'Prova a modificare i filtri'}</p>
        </div>
      )}
    </div>
  );
}
