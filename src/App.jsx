import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import NotificationSetup from './components/NotificationSetup';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Proposte from './components/Proposte';
import Chat from './components/Chat';
import Drive from './components/Drive';
import Soci from './components/Soci';
import Calendario from './components/Calendario';
import Statistiche from './components/Statistiche';
import Profilo from './components/Profilo';
import Finanze from './components/Finanze';
import GestioneRuoli from './components/GestioneRuoli';
import InstallBanner from './components/InstallBanner';
import UpdateBanner from './components/UpdateBanner';
import { supabase } from './lib/supabase';

const sectionTitles = {
  finanze:     'Finanze',
  dashboard:   'Dashboard',
  calendario:  'Calendario & Eventi',
  tasks:       'Task & Progetti',
  proposte:    'Proposte & Votazioni',
  chat:        'Chat di Comunità',
  drive:       'Archivio Drive',
  soci:        'Anagrafica Soci',
  statistiche: 'Statistiche',
  profilo:     'Il mio Profilo',
};

const sectionIcons = {
  finanze:     '💰',
  dashboard:   '🏠',
  calendario:  '📅',
  tasks:       '✅',
  proposte:    '🗳️',
  chat:        '💬',
  drive:       '🗂️',
  soci:        '👥',
  statistiche: '📊',
  profilo:     '👤',
};

function useNotifiche() {
  const [notifiche, setNotifiche] = useState([]);
  const [ultimaLetta, setUltimaLetta] = useState(
    () => localStorage.getItem('notif-ultima-letta') || ''
  );

  const carica = async () => {
    const { data } = await supabase
      .from('notifiche')
      .select('id, titolo, corpo, created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifiche(data);
  };

  useEffect(() => { carica(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('notifiche-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifiche' }, () => carica())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const nonLette = notifiche.filter(n => n.created_at > ultimaLetta).length;

  const segnaLette = () => {
    const ora = new Date().toISOString();
    setUltimaLetta(ora);
    localStorage.setItem('notif-ultima-letta', ora);
  };

  return { notifiche, nonLette, segnaLette, ultimaLetta };
}

function NotifichePanel({ open, onClose, notifiche, onRead, ultimaLetta }) {
  useEffect(() => { if (open) onRead(); }, [open]);

  if (!open) return null;

  return (
    <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm">Notifiche</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifiche.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Bell size={24} className="opacity-30 mb-2" />
            <p className="text-sm">Nessuna notifica</p>
          </div>
        ) : notifiche.map(n => {
          const nuova = n.created_at > ultimaLetta;
          return (
            <div key={n.id} className={`px-4 py-3 transition-colors ${nuova ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
              <div className="flex items-start gap-2.5">
                {nuova && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{n.titolo}</p>
                  {n.corpo && <p className="text-xs text-slate-500 mt-0.5 truncate">{n.corpo}</p>}
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading, isPresidente, socio } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifiche, nonLette, segnaLette, ultimaLetta } = useNotifiche();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg,#f0f4ff,#e8f5f0)' }}>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-xl shadow-blue-200 animate-pulse">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-400">Caricamento...</p>
    </div>
  );

  if (!user) return <Login />;

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':   return <Dashboard onNavigate={setActiveSection} />;
      case 'calendario':  return <Calendario />;
      case 'tasks':       return <Tasks />;
      case 'proposte':    return <Proposte />;
      case 'chat':        return <Chat />;
      case 'drive':       return <Drive />;
      case 'soci':        return <Soci />;
      case 'finanze':     return <Finanze />;
      case 'statistiche': return <Statistiche />;
      case 'profilo':     return <Profilo />;
      case 'ruoli':       return isPresidente() ? <GestioneRuoli /> : <Dashboard onNavigate={setActiveSection} />;
      default:            return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f5f0 100%)' }}>
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-sm px-4 sm:px-6 flex items-center gap-3 shrink-0"
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            paddingBottom: '0.75rem',
          }}>

          {/* Logo + titolo sezione */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="lg:hidden w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-200 shrink-0 cursor-pointer"
              onClick={() => setSidebarOpen(p => !p)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{sectionIcons[activeSection] ?? '🏠'}</span>
                <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                  {sectionTitles[activeSection] ?? 'Forum dei Giovani'}
                </h1>
              </div>
            </div>
          </div>

          {/* Destra header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Badge online — solo desktop */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl font-medium">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Online
            </div>

            {/* Avatar + nome utente */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors"
              onClick={() => setActiveSection('profilo')}>
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{socio?.avatar || '?'}</span>
              </div>
              <span className="text-xs font-semibold text-slate-700">{socio?.nome?.split(' ')[0] || 'Utente'}</span>
            </div>

            {/* Campanella notifiche */}
            <div className="relative">
              <button onClick={() => setNotifOpen(p => !p)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                <Bell size={17} />
                {nonLette > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                    {nonLette > 9 ? '9+' : nonLette}
                  </span>
                )}
              </button>
              <NotifichePanel open={notifOpen} onClose={() => setNotifOpen(false)} notifiche={notifiche} onRead={segnaLette} ultimaLetta={ultimaLetta} />
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 lg:pb-8">
          {renderSection()}
        </main>

        <NotificationSetup />
      </div>
      <InstallBanner />
      <UpdateBanner />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
