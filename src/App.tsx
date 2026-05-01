
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Trophy, Timer, Settings, LogOut, LogIn, Award, LayoutDashboard, Compass, ClipboardList } from 'lucide-react';
import { NextUIProvider, Spinner, Button } from '@nextui-org/react';
import { AnimatePresence, motion } from 'framer-motion';

import Login from './pages/Login';
import Cronometrador from './pages/Cronometrador';
import Clasificacion from './pages/Clasificacion';
import Management from './pages/Management';
import Championships from './pages/Championships';
import RallyManager from './pages/RallyManager';
import Onboarding from './pages/Onboarding';
import PilotoDashboard from './pages/PilotoDashboard';
import PilotoExplorar from './pages/PilotoExplorar';
import PilotoMisPruebas from './pages/PilotoMisPruebas';
import RightSidebar from './components/layout/RightSidebar';
import DashboardLayout from './components/layout/DashboardLayout';

// ── Page transition wrapper ───────────────────────────────────
import { Transition, Variants } from 'framer-motion';

const pageTransition: Transition = { duration: 0.2, ease: 'easeOut' };
const pageExitTransition: Transition = { duration: 0.15, ease: 'easeIn' };

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: pageTransition },
  exit:    { opacity: 0, y: -8, transition: pageExitTransition },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-full"
    >
      {children}
    </motion.div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ session, profile, handleLogout }: { session: Session | null, profile: any, handleLogout: () => void }) {
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-zinc-800/60 bg-zinc-950 flex flex-col h-full hidden lg:flex relative z-50">
      <div className="p-6 border-b border-zinc-800/60">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2 hover:text-zinc-300 transition-colors">
          <Settings size={22} className="text-zinc-400" />
          <span>TimeAttack</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
        {session && profile?.role === 'club' && (
          <>
            <Link
              to="/cronometrador"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/cronometrador' ? 'bg-brand-950/60 text-brand-100 border-l-2 border-brand-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <Timer size={18} />
              <span>Cronometrador</span>
            </Link>
            <Link
              to="/gestion"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/gestion' ? 'bg-brand-950/60 text-brand-100 border-l-2 border-brand-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <Settings size={18} />
              <span>Gestión</span>
            </Link>
            <Link
              to="/campeonatos"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/campeonatos' ? 'bg-brand-950/60 text-brand-100 border-l-2 border-brand-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <Award size={18} />
              <span>Campeonatos</span>
            </Link>
          </>
        )}
        {session && profile?.role === 'piloto' && (
          <>
            <Link
              to="/piloto"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/piloto' ? 'bg-brand-950/60 text-brand-100 border-l-2 border-brand-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <LayoutDashboard size={18} />
              <span>Mi Panel</span>
            </Link>
            <Link
              to="/piloto/explorar"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/piloto/explorar' ? 'bg-brand-950/60 text-brand-100 border-l-2 border-brand-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <Compass size={18} />
              <span>Explorar</span>
            </Link>
            <Link
              to="/piloto/mis-pruebas"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/piloto/mis-pruebas' ? 'bg-brand-950/60 text-brand-100 border-l-2 border-brand-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <ClipboardList size={18} />
              <span>Mis Pruebas</span>
            </Link>
          </>
        )}
        <Link
          to="/clasificacion"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/clasificacion' ? 'bg-brand-950/60 text-brand-100 border-l-2 border-brand-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
        >
          <Trophy size={18} />
          <span>Clasificación</span>
        </Link>
      </nav>

      {session ? (
        <div className="p-4 mt-auto border-t border-zinc-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      ) : (
        location.pathname !== '/login' && (
          <div className="p-4 mt-auto border-t border-zinc-800/60">
            <Link
              to="/login"
              className="w-full flex justify-center items-center gap-2 px-3 py-2.5 text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors shadow-md shadow-brand-900/20"
            >
              <LogIn size={18} />
              <span>Acceso</span>
            </Link>
          </div>
        )
      )}
    </aside>
  );
}

// ── Mobile Navbar ─────────────────────────────────────────────
function MobileNavbar({ session, profile, handleLogout }: { session: Session | null, profile: any, handleLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="lg:hidden bg-zinc-950 border-b border-zinc-800/60 flex items-center justify-between p-4 sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
        <span>TimeAttack</span>
      </Link>
      <div className="flex items-center gap-2">
        {session && profile?.role === 'club' && (
          <>
            <Link to="/gestion" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/gestion' ? 'bg-brand-950/60 text-brand-100 border-brand-500' : 'text-zinc-400 border-transparent'}`}>
              <Settings size={20} />
            </Link>
            <Link to="/campeonatos" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/campeonatos' ? 'bg-brand-950/60 text-brand-100 border-brand-500' : 'text-zinc-400 border-transparent'}`}>
              <Award size={20} />
            </Link>
          </>
        )}
        {session && profile?.role === 'piloto' && (
          <>
            <Link to="/piloto" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/piloto' ? 'bg-brand-950/60 text-brand-100 border-brand-500' : 'text-zinc-400 border-transparent'}`}>
              <LayoutDashboard size={20} />
            </Link>
            <Link to="/piloto/explorar" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/piloto/explorar' ? 'bg-brand-950/60 text-brand-100 border-brand-500' : 'text-zinc-400 border-transparent'}`}>
              <Compass size={20} />
            </Link>
            <Link to="/piloto/mis-pruebas" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/piloto/mis-pruebas' ? 'bg-brand-950/60 text-brand-100 border-brand-500' : 'text-zinc-400 border-transparent'}`}>
              <ClipboardList size={20} />
            </Link>
          </>
        )}
        <Link to="/clasificacion" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/clasificacion' ? 'bg-brand-950/60 text-brand-100 border-brand-500' : 'text-zinc-400 border-transparent'}`}>
          <Trophy size={20} />
        </Link>
        {session ? (
          <button onClick={handleLogout} className="p-2 rounded-lg text-zinc-400 hover:text-brand-400"><LogOut size={20} /></button>
        ) : (
          <Link to="/login" className="p-2 rounded-lg text-brand-500"><LogIn size={20} /></Link>
        )}
      </div>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────
function Home() {
  return (
    <div className="container mx-auto bg-base-100 rounded-box p-6 min-h-[50vh] flex flex-col items-center justify-center border border-base-300 text-center">
      <h1 className="text-4xl font-bold mb-4">Bienvenido a TimeAttack v2</h1>
      <p className="text-lg text-base-content/60 max-w-xl">
        Sistema de control de tiempos para rally. Si eres oficial de carrera, inicia sesión para acceder al cronómetro. El público puede ver la clasificación general en tiempo real.
      </p>
      <div className="flex gap-4 mt-8">
        <Link to="/clasificacion" className="btn btn-primary btn-lg">Ver Clasificación</Link>
      </div>
    </div>
  );
}

// ── AppContent ────────────────────────────────────────────────
function AppContent() {
  const location = useLocation();
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
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

        if (isMounted) {
          setSession(session);
          setProfile(profileData || { notFound: true });
        }
      } catch (error) {
        console.error('Error crítico inicializando auth:', error);
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
        try {
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          setSession(session);
          setProfile(profileData || { notFound: true });
        } catch (error) {
          console.error('Error fetching profile on SIGNED_IN:', error);
          setSession(session);
          setProfile({ notFound: true });
        } finally {
          setLoading(false);
        }
      }
    });

    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  if (loading || (session && !profile)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-transparent">
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
    if (profile?.role === 'piloto') return <Navigate to="/piloto" replace />;
    return <Navigate to="/clasificacion" replace />;
  };

  const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
    if (!isAuth) return <Navigate to="/login" replace />;
    if (allowedRole && profile?.role !== allowedRole) return <Navigate to="/clasificacion" replace />;
    return <>{children}</>;
  };

  // ── Nuclear Logout ─────────────────────────────────────────
  const handleLogout = async () => {
    try {
      // 1. Petición oficial a Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error en Supabase signOut:", error);
    } finally {
      // 2. Destrucción forzada de la memoria local
      localStorage.clear(); 
      sessionStorage.clear();

      // 3. Limpieza manual de estados de React
      setSession(null);
      setProfile(null);

      // 4. LA OPCIÓN NUCLEAR: Redirección dura del navegador.
      window.location.href = "/"; 
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Sidebar session={session} profile={profile} handleLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileNavbar session={session} profile={profile} handleLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto bg-[#09090b] p-4 lg:p-8">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/login" element={<PageWrapper>{isAuth ? redirectAfterLogin() : <Login />}</PageWrapper>} />
                <Route path="/onboarding" element={<PageWrapper>{isAuth && needsOnboarding ? <Onboarding /> : <Navigate to="/" replace />}</PageWrapper>} />
                
                {/* Rutas Protegidas para Oficiales/Club */}
                <Route
                  path="/cronometrador"
                  element={<PageWrapper><ProtectedRoute allowedRole="club"><Cronometrador userId={session?.user?.id} /></ProtectedRoute></PageWrapper>}
                />
                <Route
                  path="/campeonatos"
                  element={<PageWrapper><ProtectedRoute allowedRole="club"><Championships userId={session?.user?.id} /></ProtectedRoute></PageWrapper>}
                />
                <Route
                  path="/gestion-rally/:rallyId"
                  element={<PageWrapper><ProtectedRoute allowedRole="club"><RallyManager userId={session?.user?.id} /></ProtectedRoute></PageWrapper>}
                />
                <Route
                  path="/gestion"
                  element={<PageWrapper><ProtectedRoute allowedRole="club"><Management userId={session?.user?.id} /></ProtectedRoute></PageWrapper>}
                />
                
                {/* Rutas Protegidas para Pilotos */}
                <Route
                  path="/piloto"
                  element={<PageWrapper><ProtectedRoute allowedRole="piloto"><PilotoDashboard userId={session?.user?.id} displayName={profile?.display_name} /></ProtectedRoute></PageWrapper>}
                />
                <Route
                  path="/piloto/explorar"
                  element={<PageWrapper><ProtectedRoute allowedRole="piloto"><PilotoExplorar userId={session?.user?.id} displayName={profile?.display_name} /></ProtectedRoute></PageWrapper>}
                />
                <Route
                  path="/piloto/mis-pruebas"
                  element={<PageWrapper><ProtectedRoute allowedRole="piloto"><PilotoMisPruebas userId={session?.user?.id} /></ProtectedRoute></PageWrapper>}
                />

                {/* Ruta Pública */}
                <Route path="/clasificacion" element={<PageWrapper><Clasificacion /></PageWrapper>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <NextUIProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </NextUIProvider>
  );
}