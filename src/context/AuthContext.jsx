import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [socio, setSocio] = useState(null);
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
      else { setSocio(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSocio = async (email) => {
    const { data } = await supabase.from('soci').select('*').eq('email', email).maybeSingle();
    setSocio(data || null);
    setLoading(false);
  };

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const register = async (email, password, nome) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    // Cerca se esiste già un socio con quella email
    const { data: esistente } = await supabase.from('soci').select('*').eq('email', email).maybeSingle();

    if (esistente) {
      // Collega l'account al socio esistente (mantiene il ruolo già assegnato)
      await supabase.from('soci').update({ user_id: data.user?.id }).eq('email', email);
    } else {
      // Crea un nuovo socio con ruolo Membro
      const avatar = nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      await supabase.from('soci').insert([{
        nome,
        email,
        ruolo: 'Membro',
        avatar,
        iscrizione: new Date().toISOString().split('T')[0],
        user_id: data.user?.id,
      }]);
    }

    return { message: esistente
      ? `Benvenuto! Hai il ruolo di "${esistente.ruolo}".`
      : 'Registrazione completata! Controlla la tua email per confermare.'
    };
  };

  const logout = () => supabase.auth.signOut();

  // Può modificare: Presidente, Vice Presidente, Segretario
  const canEdit = () => ['Presidente', 'Vice Presidente', 'Segretario'].includes(socio?.ruolo);

  // Ha un ruolo effettivo (non semplice Membro)
  const hasRole = () => socio?.ruolo && socio.ruolo !== 'Membro';

  return (
    <AuthContext.Provider value={{ user, socio, loading, login, logout, register, canEdit, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
