import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Plus, X, ChevronDown, ChevronUp, Send, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sendPush } from '../lib/push';

function PropostaCard({ proposta, onVote, onDelete }) {
  const { socio } = useAuth();
  const nomeUtente = socio?.nome || 'Anonimo';
  const [expanded, setExpanded] = useState(false);
  const [commenti, setCommenti] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingCommenti, setLoadingCommenti] = useState(false);

  const toggleCommenti = async () => {
    if (!expanded && commenti.length === 0) {
      setLoadingCommenti(true);
      const { data } = await supabase.from('commenti').select('*').eq('proposta_id', proposta.id).order('created_at');
      if (data) setCommenti(data);
      setLoadingCommenti(false);
    }
    setExpanded(e => !e);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const { data, error } = await supabase.from('commenti').insert([{
      proposta_id: proposta.id,
      autore: nomeUtente,
      testo: commentText,
    }]).select().single();
    if (!error) {
      setCommenti(prev => [...prev, data]);
      setCommentText('');
    }
  };

  const voteRatio = proposta.upvotes + proposta.downvotes > 0
    ? Math.round((proposta.upvotes / (proposta.upvotes + proposta.downvotes)) * 100)
    : 50;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button onClick={() => onVote(proposta.id, 'up', proposta.upvotes, proposta.downvotes, proposta.userVote)}
              className={`p-2 rounded-xl transition-all ${proposta.userVote === 'up' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-100 hover:text-emerald-500'}`}>
              <ThumbsUp size={16} />
            </button>
            <span className={`text-sm font-bold ${proposta.upvotes - proposta.downvotes >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {proposta.upvotes - proposta.downvotes}
            </span>
            <button onClick={() => onVote(proposta.id, 'down', proposta.upvotes, proposta.downvotes, proposta.userVote)}
              className={`p-2 rounded-xl transition-all ${proposta.userVote === 'down' ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:bg-slate-100 hover:text-rose-500'}`}>
              <ThumbsDown size={16} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-slate-800">{proposta.titolo}</h3>
              <button onClick={() => onDelete(proposta.id)} className="text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-1">{proposta.descrizione}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">{proposta.autore?.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <span className="text-xs text-slate-500">{proposta.autore}</span>
              </div>
              <span className="text-xs text-slate-400">{proposta.created_at?.split('T')[0]}</span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-emerald-600 font-medium">▲{proposta.upvotes}</span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-rose-500 font-medium">▼{proposta.downvotes}</span>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all" style={{ width: `${voteRatio}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">{voteRatio}% consenso</span>
              <span className="text-[10px] text-slate-400">{proposta.upvotes + proposta.downvotes} voti</span>
            </div>
          </div>
        </div>
        <button onClick={toggleCommenti} className="flex items-center gap-2 mt-4 text-xs text-slate-500 hover:text-blue-500 transition-colors font-medium">
          <MessageCircle size={13} />
          {loadingCommenti ? 'Caricamento...' : `${commenti.length} commenti`}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
          {commenti.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-300 to-teal-300 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">{c.autore?.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700">{c.autore}</span>
                <span className="text-xs text-slate-400 ml-auto">{c.created_at?.split('T')[0]}</span>
              </div>
              <p className="text-sm text-slate-600">{c.testo}</p>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Scrivi un commento..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button onClick={handleComment} className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-2 rounded-xl hover:opacity-90">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Proposte() {
  const { socio } = useAuth();
  const nomeUtente = socio?.nome || 'Anonimo';
  const [proposte, setProposte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titolo: '', descrizione: '' });

  useEffect(() => { fetchProposte(); }, []);

  const fetchProposte = async () => {
    const { data } = await supabase.from('proposte').select('*').order('created_at', { ascending: false });
    if (data) setProposte(data.map(p => ({ ...p, userVote: null })));
    setLoading(false);
  };

  const handleVote = async (id, tipo, upvotes, downvotes, userVote) => {
    const wasUp = userVote === 'up';
    const wasDown = userVote === 'down';
    let newUp = upvotes;
    let newDown = downvotes;
    let newVote = null;
    if (tipo === 'up') { newUp = wasUp ? upvotes - 1 : upvotes + 1; if (wasDown) newDown = downvotes - 1; newVote = wasUp ? null : 'up'; }
    else { newDown = wasDown ? downvotes - 1 : downvotes + 1; if (wasUp) newUp = upvotes - 1; newVote = wasDown ? null : 'down'; }
    await supabase.from('proposte').update({ upvotes: newUp, downvotes: newDown }).eq('id', id);
    setProposte(prev => prev.map(p => p.id === id ? { ...p, upvotes: newUp, downvotes: newDown, userVote: newVote } : p));
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa proposta?')) return;
    await supabase.from('proposte').delete().eq('id', id);
    setProposte(prev => prev.filter(p => p.id !== id));
  };

  const handleAdd = async () => {
    if (!form.titolo.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('proposte').insert([{
      titolo: form.titolo,
      descrizione: form.descrizione,
      autore: nomeUtente,
      upvotes: 0,
      downvotes: 0,
    }]).select().single();
    if (!error) {
      setProposte(prev => [{ ...data, userVote: null }, ...prev]);
      setForm({ titolo: '', descrizione: '' });
      setShowForm(false);
      sendPush({
        title: '💡 Nuova proposta: ' + data.titolo,
        body: `Proposta di ${data.autore} — vota ora!`,
        url: '/',
      });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento proposte...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Proposte & Votazioni</h2>
          <p className="text-slate-500 mt-1">{proposte.length} proposte attive</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all">
          <Plus size={16} /> Nuova Proposta
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Nuova Proposta</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Titolo *</label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Titolo della proposta..." value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Descrizione</label>
                <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" rows={4} placeholder="Descrivi la tua proposta..." value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Pubblica
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {proposte.map(p => <PropostaCard key={p.id} proposta={p} onVote={handleVote} onDelete={handleDelete} />)}
        {proposte.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="font-medium">Nessuna proposta ancora</p>
            <p className="text-sm mt-1">Crea la prima proposta!</p>
          </div>
        )}
      </div>
    </div>
  );
}
