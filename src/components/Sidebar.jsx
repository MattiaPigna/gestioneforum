import {
  LayoutDashboard, Vote, CheckSquare, MessageSquare, HardDrive,
  Users, CalendarDays, BarChart2, UserCircle, X, ChevronRight,
  LogOut, Wallet, ShieldCheck, Menu, Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'calendario',  label: 'Calendario & Eventi',  icon: CalendarDays },
  { id: 'proposte',    label: 'Proposte & Votazioni', icon: Vote },
  { id: 'tasks',       label: 'Task & Progetti',      icon: CheckSquare },
  { id: 'chat',        label: 'Chat di Comunità',     icon: MessageSquare },
  { id: 'drive',       label: 'Archivio Drive',       icon: HardDrive },
  { id: 'soci',        label: 'Anagrafica Soci',      icon: Users },
  { id: 'finanze',     label: 'Finanze',              icon: Wallet },
  { id: 'statistiche', label: 'Statistiche',          icon: BarChart2 },
];

const bottomNavItems = [
  { id: 'dashboard',  label: 'Home',      icon: LayoutDashboard },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'tasks',      label: 'Task',       icon: CheckSquare },
  { id: 'chat',       label: 'Chat',       icon: MessageSquare },
];

export default function Sidebar({ activeSection, onNavigate, isOpen, onToggle }) {
  const { socio, logout, canSee, isPresidente, canEdit } = useAuth();

  const navigate = (id) => {
    onNavigate(id);
    if (isOpen) onToggle();
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={onToggle} />
      )}

      {/* ── Sidebar laterale ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col
        w-64 bg-white/90 backdrop-blur-xl border-r border-white/60
        shadow-2xl shadow-slate-200/80 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto lg:shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-slate-800 truncate">Forum dei Giovani</h1>
            <p className="text-xs text-slate-400 font-medium">Gestione Interna</p>
          </div>
          <button onClick={onToggle} className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.filter(item => canSee(item.id)).map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button key={id} onClick={() => navigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-200/60'
                    : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all
                  ${isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
                  <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
                </div>
                <span className="flex-1 text-left">{label}</span>
                {isActive && <ChevronRight size={13} className="text-white/70" />}
              </button>
            );
          })}

          {/* Gestione Ruoli — solo Presidente */}
          {isPresidente() && (
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button onClick={() => navigate('ruoli')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all group
                  ${activeSection === 'ruoli'
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-200/60'
                    : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0
                  ${activeSection === 'ruoli' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
                  <ShieldCheck size={15} className={activeSection === 'ruoli' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
                </div>
                <span className="flex-1 text-left">Gestione Ruoli</span>
              </button>
            </div>
          )}

          {/* Profilo */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <button onClick={() => navigate('profilo')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all group
                ${activeSection === 'profilo'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-200/60'
                  : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0
                ${activeSection === 'profilo' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
                <UserCircle size={15} className={activeSection === 'profilo' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
              </div>
              <span className="flex-1 text-left">Il mio Profilo</span>
            </button>
          </div>
        </nav>

        {/* Footer utente */}
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('profilo')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shrink-0 shadow-md shadow-blue-100">
              <span className="text-white text-xs font-bold">{socio?.avatar || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{socio?.nome || 'Utente'}</p>
              <p className="text-xs text-slate-400 truncate">{socio?.ruolo || ''}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }}
              className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 rounded-xl hover:bg-rose-50 shrink-0">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Bottom Navigation mobile ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl shadow-slate-200/60"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center px-2">
          {/* prime 2 voci */}
          {bottomNavItems.slice(0, 2).map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button key={id} onClick={() => navigate(id)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors relative">
                <Icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{label}</span>
                {isActive && <span className="absolute bottom-1 w-4 h-0.5 bg-blue-500 rounded-full" />}
              </button>
            );
          })}

          {/* Pulsante centrale + */}
          {canEdit && (
            <button onClick={onToggle}
              className="flex-1 flex flex-col items-center justify-center py-1.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-xl shadow-blue-300/50 -mt-5 border-4 border-white">
                <Plus size={22} className="text-white" strokeWidth={2.8} />
              </div>
            </button>
          )}

          {/* ultime 2 voci */}
          {bottomNavItems.slice(2).map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button key={id} onClick={() => navigate(id)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors relative">
                <Icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{label}</span>
                {isActive && <span className="absolute bottom-1 w-4 h-0.5 bg-blue-500 rounded-full" />}
              </button>
            );
          })}

          {/* Altro → apre sidebar */}
          <button onClick={onToggle}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors">
            <Menu size={20} className={isOpen ? 'text-blue-500' : 'text-slate-400'} />
            <span className={`text-[10px] font-semibold ${isOpen ? 'text-blue-500' : 'text-slate-400'}`}>Altro</span>
          </button>
        </div>
      </nav>
    </>
  );
}
