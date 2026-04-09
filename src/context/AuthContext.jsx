import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const defaultPermessi = {
  dashboard: true, calendario: true, proposte: true, tasks: true,
  chat: true, drive: true, soci: false, finanze: false,
  statistiche: false, can_edit: false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [socio, setSocio] = useState(null);
  const [permessi, setPermessi] = useState(defaultPermessi);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSocio(session.user.email);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSocio(session.user.email);
      else { setSocio(null); setPermessi(defaultPermessi); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSocio = async (email) => {
    const { data: socioData } = await supabase
      .from('soci').select('*').eq('email', email).maybeSingle();

    // Se il socio è stato eliminato o disattivato → logout forzato
    if (!socioData || socioData.attivo === false) {
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setSocio(socioData);

    if (socioData.ruolo) {
      const { data: ruoloData } = await supabase
        .from('ruoli').select('permessi').eq('nome', socioData.ruolo).maybeSingle();
      setPermessi(ruoloData?.permessi ? { ...defaultPermessi, ...ruoloData.permessi } : defaultPermessi);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    // Verifica prima che esista come socio attivo
    const { data: socioData } = await supabase
      .from('soci').select('id, attivo').eq('email', email).maybeSingle();

    if (!socioData) return { error: { message: 'Utente non trovato. Contatta il Presidente per essere aggiunto.' } };
    if (socioData.attivo === false) return { error: { message: 'Il tuo account è stato disattivato. Contatta il Presidente.' } };

    return supabase.auth.signInWithPassword({ email, password });
  };

  const register = async (email, password, nome) => {
    // Solo chi è già in anagrafica può registrarsi
    const { data: esistente } = await supabase
      .from('soci').select('*').eq('email', email).maybeSingle();

    if (!esistente) {
      return { error: { message: 'Email non trovata in anagrafica. Contatta il Presidente per essere aggiunto prima di registrarti.' } };
    }
    if (esistente.attivo === false) {
      return { error: { message: 'Il tuo account è stato disattivato.' } };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    await supabase.from('soci').update({
      user_id: data.user?.id,
      nome: esistente.nome || nome,
    }).eq('email', email);

    return { message: `Benvenuto! Hai il ruolo di "${esistente.ruolo}". Controlla la tua email per confermare.` };
  };

  const logout = () => supabase.auth.signOut();
  const canEdit = () => !!permessi.can_edit;
  const hasRole = () => socio?.ruolo && socio.ruolo !== 'Membro';
  const canSee = (sezione) => !!permessi[sezione];
  const isPresidente = () => socio?.ruolo === 'Presidente';

  return (
    <AuthContext.Provider value={{ user, socio, permessi, loading, login, logout, register, canEdit, hasRole, canSee, isPresidente }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
