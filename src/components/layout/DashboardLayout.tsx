import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Trophy, Timer, Settings, LogOut, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@nextui-org/react';
import RightSidebar from './RightSidebar';

// ─── Sidebar (Desktop ≥ lg) ──────────────────────────────────────────────────
function Sidebar({ session, profile, handleLogout }: { session: Session | null, profile: any, handleLogout: () => void }) {
  const location = useLocation();

  const navLink = (to: string, icon: React.ReactNode, label: string) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
        ${location.pathname.startsWith(to) && to !== '/'
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-400 hover:bg-zinc-800/50'}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-zinc-800 bg-[#09090b] flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-3 hover:text-zinc-300 transition-colors">
          <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center shadow-lg shadow-brand-900/20">
            <Timer size={18} className="text-white" />
          </div>
          <span>TimeAttack</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {session && profile?.role === 'club' && (
          <>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-3">Organización</div>
            {navLink('/cronometrador', <Timer size={18} />, 'Cronometrador')}
            {navLink('/campeonatos', <Trophy size={18} />, 'Campeonatos')}
            {/* Prueba Actual is removed since we have RallyManager. Can keep '/gestion' as a fallback or remove it. We'll leave it since it exists. */}
            {navLink('/gestion', <Settings size={18} />, 'Prueba Local')}
            <div className="h-4"></div>
          </>
        )}
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-3">Consultas</div>
        {navLink('/clasificacion', <Trophy size={18} />, 'Clasificación')}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <Button
          onClick={handleLogout}
          className="w-full flex justify-start items-center gap-3 px-3 py-2 text-sm font-medium bg-transparent hover:bg-brand-500/10 text-zinc-400 hover:text-brand-500 rounded-md shadow-none"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </Button>
      </div>
    </aside>
  );
}

// ─── Bottom Nav (Mobile < lg) ────────────────────────────────────────────────
function BottomNav({ session, profile, handleLogout }: { session: Session | null, profile: any, handleLogout: () => void }) {
  const location = useLocation();

  const tabClass = (path: string) =>
    `flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${location.pathname.startsWith(path) && path !== '/'
      ? 'text-brand-500'
      : 'text-zinc-500 hover:text-zinc-300'
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#09090b] border-t border-zinc-800 flex items-center justify-around px-2 pb-safe h-16">
      {session && profile?.role === 'club' && (
        <>
          <Link to="/cronometrador" className={tabClass('/cronometrador')}>
            <Timer size={20} />
            <span>Crono</span>
          </Link>
          <Link to="/campeonatos" className={tabClass('/campeonatos')}>
            <Trophy size={20} />
            <span>Campos.</span>
          </Link>
        </>
      )}
      <Link to="/clasificacion" className={tabClass('/clasificacion')}>
        <Trophy size={20} />
        <span>Clasif.</span>
      </Link>
      <button 
        onClick={handleLogout} 
        className="flex flex-col items-center justify-center gap-1 h-auto min-w-0 px-4 py-2 text-zinc-500 hover:text-brand-500"
      >
        <LogOut size={20} />
        <span className="text-[10px] leading-none font-medium">Salir</span>
      </button>
    </nav>
  );
}

// ─── Top Bar (Mobile < lg) ───────────────────────────────────────────
function TopBar() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800 flex items-center px-4 h-14">
      <Link to="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-600 rounded-md flex items-center justify-center">
          <Timer size={14} className="text-white" />
        </div>
        <span>TimeAttack</span>
      </Link>
    </header>
  );
}

// ─── Dashboard Layout ────────────────────────────────────────────────────────
interface DashboardLayoutProps {
  session: Session | null;
  profile: any;
  handleLogout: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ session, profile, handleLogout, children }: DashboardLayoutProps) {
  const location = useLocation();
  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Desktop sidebar (Col 1) */}
      <Sidebar session={session} profile={profile} handleLogout={handleLogout} />

      {/* Columna de contenido */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#09090b]">
        {/* Mobile top bar */}
        <TopBar />

        {/* Main content (Col 2) */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#09090b] w-full pb-20 lg:pb-6">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav session={session} profile={profile} handleLogout={handleLogout} />
      </div>

      {/* Right Sidebar - Calendar (Col 3) */}
      <RightSidebar />
    </div>
  );
}
