import { useState, useEffect } from 'react';
import { Menu, Bell, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
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

function NotifichePanel({ open, onClose }) {
  const [notifiche, setNotifiche] = useState([]);

  useEffect(() => {
    if (!open) return;
    const fetchAll = async () => {
      const oggi = new Date().toISOString().split('T')[0];
      const fra7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const [{ data: tasks }, { data: eventi }] = await Promise.all([
        supabase.from('tasks').select('titolo, scadenza, stato').lte('scadenza', fra7).neq('stato', 'Done').not('scadenza', 'is', null),
        supabase.from('eventi').select('titolo, data, tipo').lte('data', fra7).gte('data', oggi),
      ]);

      const items = [
        ...(tasks || []).map(t => ({
          id: 'task-' + t.titolo,
          tipo: 'task',
          titolo: `Task in scadenza: ${t.titolo}`,
          data: t.scadenza,
          urgente: t.scadenza <= oggi,
        })),
        ...(eventi || []).map(e => ({
          id: 'ev-' + e.titolo,
          tipo: 'evento',
          titolo: `Evento: ${e.titolo}`,
          data: e.data,
          urgente: e.data === oggi,
        })),
      ].sort((a, b) => a.data.localeCompare(b.data));

      setNotifiche(items);
    };
    fetchAll();
  }, [open]);

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
        ) : notifiche.map(n => (
          <div key={n.id} className={`px-4 py-3 ${n.urgente ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>
            <p className="text-sm font-medium text-slate-700">{n.titolo}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${n.tipo === 'task' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>{n.tipo}</span>
              <span className="text-xs text-slate-400">{n.data}</span>
              {n.urgente && <span className="text-xs text-rose-500 font-medium">⚠ Oggi</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

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
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 flex items-center gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(p => !p)} className="lg:hidden text-slate-500 hover:text-slate-700">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-800">{sectionTitles[activeSection]}</h1>
          <div className="ml-auto flex items-center gap-3 relative">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Forum dei Giovani — Online
            </div>
            <div className="relative">
              <button onClick={() => setNotifOpen(p => !p)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors relative">
                <Bell size={18} />
              </button>
              <NotifichePanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {renderSection()}
        </main>
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
