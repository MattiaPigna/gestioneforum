import { useState, useEffect } from 'react';
import { Menu, Bell, X } from 'lucide-react';
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

  // Realtime: aggiorna campanella quando arriva nuova notifica
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
    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Notifiche</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifiche.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Nessuna notifica</p>
        ) : notifiche.map(n => {
          const nuova = n.created_at > ultimaLetta;
          return (
            <div key={n.id} className={`px-4 py-3 ${nuova ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
              <div className="flex items-start gap-2">
                {nuova && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{n.titolo}</p>
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
  const { user, loading, isPresidente } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifiche, nonLette, segnaLette, ultimaLetta } = useNotifiche();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 animate-pulse" />
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
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <button onClick={() => setSidebarOpen(p => !p)} className="lg:hidden text-slate-500 hover:text-slate-700 shrink-0">
            <Menu size={20} />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate min-w-0">{sectionTitles[activeSection] ?? 'Forum dei Giovani'}</h1>
          <div className="ml-auto flex items-center gap-3 relative">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Forum dei Giovani — Online
            </div>
            <div className="relative">
              <button onClick={() => setNotifOpen(p => !p)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors relative">
                <Bell size={18} />
                {nonLette > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {nonLette > 9 ? '9+' : nonLette}
                  </span>
                )}
              </button>
              <NotifichePanel open={notifOpen} onClose={() => setNotifOpen(false)} notifiche={notifiche} onRead={segnaLette} ultimaLetta={ultimaLetta} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6">
          {renderSection()}
        </main>
        <NotificationSetup />
      </div>
      <InstallBanner />
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
