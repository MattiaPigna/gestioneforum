import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import NotificationSetup from './components/NotificationSetup';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Proposte from './components/Proposte';
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
  drive:       '🗂️',
  soci:        '👥',
  statistiche: '📊',
  profilo:     '👤',
};

// ── Notifica scadenza task (controlla all'avvio) ─────────────────────────
function useScadenzaCheck() {
  useEffect(() => {
    const check = async () => {
      const domani = new Date();
      domani.setDate(domani.getDate() + 1);
      const domaniStr = `${domani.getFullYear()}-${String(domani.getMonth()+1).padStart(2,'0')}-${String(domani.getDate()).padStart(2,'0')}`;
      const { data } = await supabase.from('tasks').select('id, titolo, assegnatario').eq('scadenza', domaniStr).neq('stato', 'Done');
      if (!data?.length) return;
      data.forEach(task => {
        const key = `scad-notif-${task.id}-${domaniStr}`;
        if (localStorage.getItem(key)) return; // già notificato oggi
        localStorage.setItem(key, '1');
        import('./lib/push').then(({ sendPush }) => sendPush({
          title: `⏰ Scadenza domani: ${task.titolo}`,
          body: task.assegnatario ? `Assegnato a ${task.assegnatario}` : 'Nessun assegnatario',
          url: '/',
        }));
      });
    };
    const t = setTimeout(check, 3000); // aspetta 3s dopo il login
    return () => clearTimeout(t);
  }, []);
}

// ── Pull to refresh ───────────────────────────────────────────────────────
function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const mainRef = useRef(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
    const onTouchEnd = async (e) => {
      const diff = e.changedTouches[0].clientY - startY.current;
      if (diff > 80 && el.scrollTop === 0) {
        setPulling(false);
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      } else {
        setPulling(false);
      }
    };
    const onTouchMove = (e) => {
      if (el.scrollTop === 0 && e.touches[0].clientY - startY.current > 20) setPulling(true);
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  return { mainRef, pulling, refreshing };
}

function AppInner() {
  const { user, loading, isPresidente, socio } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useScadenzaCheck();

  // navigate: cambia sezione E forza il remount del componente → dati sempre freschi
  const navigate = useCallback((section) => {
    setActiveSection(section);
    setRefreshKey(k => k + 1);
    setSidebarOpen(false);
  }, []);

  const doRefresh = useCallback(() => new Promise(r => { setRefreshKey(k => k + 1); setTimeout(r, 600); }), []);
  const { mainRef, pulling, refreshing } = usePullToRefresh(doRefresh);

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
    const k = refreshKey;
    switch (activeSection) {
      case 'dashboard':   return <Dashboard key={k} onNavigate={navigate} />;
      case 'calendario':  return <Calendario key={k} />;
      case 'tasks':       return <Tasks key={k} />;
      case 'proposte':    return <Proposte key={k} />;
      case 'drive':       return <Drive key={k} />;
      case 'soci':        return <Soci key={k} />;
      case 'finanze':     return <Finanze key={k} />;
      case 'statistiche': return <Statistiche key={k} />;
      case 'profilo':     return <Profilo key={k} />;
      case 'ruoli':       return isPresidente() ? <GestioneRuoli key={k} /> : <Dashboard key={k} onNavigate={navigate} />;
      default:            return <Dashboard key={k} onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f5f0 100%)' }}>
      <Sidebar
        activeSection={activeSection}
        onNavigate={navigate}
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

            {/* Tasto aggiorna — sempre visibile */}
            <button
              onClick={doRefresh}
              title="Aggiorna pagina"
              className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95">
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-500' : ''} />
            </button>

            {/* Avatar + nome utente */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors"
              onClick={() => navigate('profilo')}>
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{socio?.avatar || '?'}</span>
              </div>
              <span className="text-xs font-semibold text-slate-700">{socio?.nome?.split(' ')[0] || 'Utente'}</span>
            </div>

          </div>
        </header>

        {/* ── Main content ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-3 sm:p-6 pb-28 lg:pb-8">
          {/* Pull to refresh indicator */}
          {(pulling || refreshing) && (
            <div className="flex justify-center mb-3 -mt-1">
              <div className="bg-white rounded-full shadow-md px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-500 border border-slate-100">
                <RefreshCw size={13} className={refreshing ? 'animate-spin text-blue-500' : 'text-slate-400'} />
                {refreshing ? 'Aggiornamento...' : 'Rilascia per aggiornare'}
              </div>
            </div>
          )}
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
