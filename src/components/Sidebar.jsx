import { LayoutDashboard, Vote, CheckSquare, MessageSquare, HardDrive, Users, CalendarDays, BarChart2, UserCircle, X, ChevronRight, LogOut, Wallet, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'calendario',   label: 'Calendario & Eventi',  icon: CalendarDays },
  { id: 'proposte',     label: 'Proposte & Votazioni', icon: Vote },
  { id: 'tasks',        label: 'Task & Progetti',      icon: CheckSquare },
  { id: 'chat',         label: 'Chat di Comunità',     icon: MessageSquare },
  { id: 'drive',        label: 'Archivio Drive',       icon: HardDrive },
  { id: 'soci',         label: 'Anagrafica Soci',      icon: Users },
  { id: 'finanze',      label: 'Finanze',              icon: Wallet },
  { id: 'statistiche',  label: 'Statistiche',          icon: BarChart2 },
];

export default function Sidebar({ activeSection, onNavigate, isOpen, onToggle }) {
  const { socio, logout, canSee, canEdit } = useAuth();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onToggle} />}

      <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col
        w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60
        shadow-xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">FG</span>
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-slate-800">Forum dei Giovani</h1>
            <p className="text-xs text-slate-500">Gestione Interna</p>
          </div>
          <button onClick={onToggle} className="lg:hidden text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => canSee(item.id)).map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button key={id} onClick={() => { onNavigate(id); onToggle(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
                <span className="flex-1 text-left">{label}</span>
                {isActive && <ChevronRight size={14} className="text-white/70" />}
              </button>
            );
          })}

          {/* Gestione Ruoli — solo chi può modificare */}
          {canEdit() && (
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              <button onClick={() => { onNavigate('ruoli'); onToggle(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${activeSection === 'ruoli' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                <ShieldCheck size={18} className={activeSection === 'ruoli' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
                <span className="flex-1 text-left">Gestione Ruoli</span>
              </button>
            </div>
          )}

          {/* Profilo */}
          <div className={`pt-2 border-t border-slate-100 mt-2 ${canEdit() ? '' : ''}`}>
            <button onClick={() => { onNavigate('profilo'); onToggle(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${activeSection === 'profilo' ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <UserCircle size={18} className={activeSection === 'profilo' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
              <span className="flex-1 text-left">Il mio Profilo</span>
            </button>
          </div>
        </nav>

        {/* Footer utente */}
        <div className="px-4 py-4 border-t border-slate-200/60">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => onNavigate('profilo')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{socio?.avatar || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{socio?.nome || 'Utente'}</p>
              <p className="text-xs text-slate-400">{socio?.ruolo || ''}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-slate-300 hover:text-rose-500 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
