import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Trophy, Timer, Settings, LogOut, LogIn } from 'lucide-react';
import { Spinner } from '@nextui-org/react';

import Login from './pages/Login';
import Cronometrador from './pages/Cronometrador';
import Clasificacion from './pages/Clasificacion';
import Management from './pages/Management';
import Onboarding from './pages/Onboarding';

// ─── Sidebar (Desktop ≥ lg) ──────────────────────────────────────────────────
function Sidebar({ session, profile, handleLogout }: { session: Session | null, profile: any, handleLogout: () => void }) {
  const location = useLocation();

  const navLink = (to: string, icon: React.ReactNode, label: string) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
        ${location.pathname === to
          ? 'bg-primary/20 text-primary border-l-2 border-primary shadow-sm'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white border-l-2 border-transparent'}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col h-screen border-r border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800/60">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 hover:text-zinc-300 transition-colors">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
            <Timer size={16} className="text-white" />
          </div>
          <span>TimeAttack</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {session && profile?.role === 'club' && (
          <>
            {navLink('/cronometrador', <Timer size={18} />, 'Cronometrador')}
            {navLink('/gestion', <Settings size={18} />, 'Gestión')}
          </>
        )}
        {navLink('/clasificacion', <Trophy size={18} />, 'Clasificación')}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800/60">
        {session ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        ) : (
          location.pathname !== '/login' && (
            <Link
              to="/login"
              className="w-full flex justify-center items-center gap-2 px-3 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-md shadow-primary/20"
            >
              <LogIn size={18} />
              <span>Acceso</span>
            </Link>
          )
        )}
      </div>
    </aside>
  );
}

// ─── Bottom Nav (Mobile < lg) ────────────────────────────────────────────────
function BottomNav({ session, profile, handleLogout }: { session: Session | null, profile: any, handleLogout: () => void }) {
  const location = useLocation();

  const tabClass = (path: string) =>
    `flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
      location.pathname === path
        ? 'text-primary'
        : 'text-zinc-500'
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/70 flex items-center justify-around px-2 pb-safe h-16">
      {session && profile?.role === 'club' && (
        <>
          <Link to="/cronometrador" className={tabClass('/cronometrador')}>
            <Timer size={22} />
            <span>Crono</span>
          </Link>
          <Link to="/gestion" className={tabClass('/gestion')}>
            <Settings size={22} />
            <span>Gestión</span>
          </Link>
        </>
      )}
      <Link to="/clasificacion" className={tabClass('/clasificacion')}>
        <Trophy size={22} />
        <span>Clasif.</span>
      </Link>
      {session ? (
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium text-zinc-500 hover:text-primary transition-colors rounded-xl">
          <LogOut size={22} />
          <span>Salir</span>
        </button>
      ) : (
        location.pathname !== '/login' && (
          <Link to="/login" className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium text-primary rounded-xl">
            <LogIn size={22} />
            <span>Acceso</span>
          </Link>
        )
      )}
    </nav>
  );
}

// ─── Top Bar (Mobile < lg, header) ───────────────────────────────────────────
function TopBar() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60 flex items-center px-4 h-14">
      <Link to="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <Timer size={14} className="text-white" />
        </div>
        <span>TimeAttack</span>
      </Link>
    </header>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────────────
function Home() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-16 h-16 bg-red-600/20 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-900/20">
        <Timer size={32} className="text-red-400" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white tracking-tight">Bienvenido a TimeAttack v2</h1>
      <p className="text-base text-zinc-400 max-w-md leading-relaxed mb-8">
        Sistema de control de tiempos para rally. Si eres oficial de carrera, inicia sesión para acceder al cronómetro.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/clasificacion"
          className="px-6 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-900/20"
        >
          Ver Clasificación
        </Link>
        <Link
          to="/login"
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl transition-all border border-zinc-700"
        >
          Acceso Oficial
        </Link>
      </div>
    </div>
  );
}

// ─── App Content ──────────────────────────────────────────────────────────────
function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const inicializarAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          await supabase.auth.signOut();
          if (isMounted) { setSession(null); setProfile(null); }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

        if (isMounted) {
          setSession(session);
          setProfile(profile || { notFound: true });
        }
      } catch (error) {
        console.error("Error crítico inicializando auth:", error);
        await supabase.auth.signOut();
        if (isMounted) { setSession(null); setProfile(null); }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    inicializarAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null); setProfile(null); setLoading(false);
      } else if (event === 'SIGNED_IN' && session) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        setSession(session);
        setProfile(profileData || { notFound: true });
        setLoading(false);
      }
    });

    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  if (loading || (session && !profile)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] gap-4">
        <Spinner size="lg" color="danger" />
        <p className="text-zinc-400 font-semibold tracking-tight text-sm">Cargando telemetría...</p>
      </div>
    );
  }

  const isAuth = !!session;
  const needsOnboarding = isAuth && profile?.notFound;

  const redirectAfterLogin = () => {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    if (profile?.role === 'club') return <Navigate to="/gestion" replace />;
    return <Navigate to="/clasificacion" replace />;
  };

  const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
    if (!isAuth) return <Navigate to="/login" replace />;
    if (allowedRole && profile?.role !== allowedRole) return <Navigate to="/clasificacion" replace />;
    return <>{children}</>;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    // ─ Contenedor raíz: flex horizontal en desktop, columna en móvil
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* Desktop sidebar */}
      <Sidebar session={session} profile={profile} handleLogout={handleLogout} />

      {/* Columna de contenido (TopBar + Main + BottomNav en móvil) */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <TopBar />

        {/* Main content — scrollable, con padding bottom en móvil para la bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={isAuth ? redirectAfterLogin() : <Login />} />
              <Route path="/onboarding" element={isAuth && needsOnboarding ? <Onboarding /> : <Navigate to="/" replace />} />
              <Route
                path="/cronometrador"
                element={<ProtectedRoute allowedRole="club"><Cronometrador userId={session?.user?.id} /></ProtectedRoute>}
              />
              <Route
                path="/gestion"
                element={<ProtectedRoute allowedRole="club"><Management userId={session?.user?.id} /></ProtectedRoute>}
              />
              <Route path="/clasificacion" element={<Clasificacion />} />
            </Routes>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav session={session} profile={profile} handleLogout={handleLogout} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}