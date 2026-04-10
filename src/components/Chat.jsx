import { useState, useRef, useEffect } from 'react';
import { Send, Hash, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { socio } = useAuth();
  const nomeUtente = socio?.nome || 'Ospite';
  const avatarUtente = socio?.avatar || '??';
  const [canali, setCanali] = useState([]);
  const [canaleCorrente, setCanaleCorrente] = useState(null);
  const [messaggi, setMessaggi] = useState([]);
  const [messaggio, setMessaggio] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    fetchCanali();
  }, []);

  useEffect(() => {
    if (!canaleCorrente) return;
    fetchMessaggi(canaleCorrente);
    // Realtime subscription
    const sub = supabase.channel(`messaggi-${canaleCorrente}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messaggi', filter: `canale_id=eq.${canaleCorrente}` },
        (payload) => setMessaggi(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        })
      ).subscribe();
    return () => supabase.removeChannel(sub);
  }, [canaleCorrente]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messaggi]);

  const fetchCanali = async () => {
    const { data } = await supabase.from('canali').select('*').order('nome');
    if (data && data.length > 0) {
      setCanali(data);
      setCanaleCorrente(data[0].id);
    }
    setLoading(false);
  };

  const fetchMessaggi = async (canaleId) => {
    const { data } = await supabase.from('messaggi').select('*').eq('canale_id', canaleId).order('created_at');
    if (data) setMessaggi(data);
  };

  const handleSend = async () => {
    if (!messaggio.trim()) return;
    const { data, error } = await supabase.from('messaggi').insert([{
      canale_id: canaleCorrente,
      autore: nomeUtente,
      avatar: avatarUtente,
      testo: messaggio,
    }]).select().single();
    if (!error) {
      setMessaggi(prev => [...prev, data]);
      setMessaggio('');
    }
  };

  const canaleAttivo = canali.find(c => c.id === canaleCorrente);

  if (loading) return (
    <div className="loading-screen">
      <Loader2 size={28} className="animate-spin text-blue-400" />
      <p>Caricamento chat...</p>
    </div>
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-96">
      {/* Canali */}
      <div className="w-48 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col gap-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Canali</p>
        {canali.map(c => (
          <button
            key={c.id}
            onClick={() => setCanaleCorrente(c.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left w-full
              ${canaleCorrente === c.id
                ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Hash size={13} className={canaleCorrente === c.id ? 'text-white/70' : 'text-slate-400'} />
            {c.nome}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <Hash size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800"># {canaleAttivo?.nome}</p>
            <p className="text-xs text-slate-400">{messaggi.length} messaggi</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messaggi.map((msg, i) => {
            const isMe = msg.autore === nomeUtente;
            const prevMsg = messaggi[i - 1];
            const sameAuthor = prevMsg && prevMsg.autore === msg.autore;
            const ora = new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!sameAuthor ? (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold
                    ${isMe ? 'bg-gradient-to-br from-blue-500 to-teal-500' : 'bg-gradient-to-br from-violet-400 to-purple-500'}`}>
                    {msg.avatar}
                  </div>
                ) : <div className="w-8 shrink-0" />}
                <div className={`max-w-xs lg:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!sameAuthor && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold text-slate-700">{msg.autore}</span>
                      <span className="text-[10px] text-slate-400">{ora}</span>
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${isMe ? 'bg-gradient-to-br from-blue-500 to-teal-500 text-white rounded-tr-md' : 'bg-slate-100 text-slate-700 rounded-tl-md'}`}>
                    {msg.testo}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              placeholder={`Messaggio in #${canaleAttivo?.nome}...`}
              value={messaggio}
              onChange={e => setMessaggio(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!messaggio.trim()} className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-1.5 rounded-lg hover:opacity-90 disabled:opacity-30 transition-all">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
