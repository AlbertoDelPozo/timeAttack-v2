import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Trophy, Timer, Settings, LogOut, LogIn, Home as HomeIcon } from 'lucide-react';

import Login from './pages/Login';
import Cronometrador from './pages/Cronometrador';
import Clasificacion from './pages/Clasificacion';
import Gestion from './pages/Gestion';
import Onboarding from './pages/Onboarding';

// Navbar is now wrapped with logic to know if a user is logged in
function Navbar({ session, profile }: { session: Session | null, profile: any }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  return (
    <div className="navbar bg-[#171717]/80 backdrop-blur-md border-b border-[#333333] sticky top-0 z-50 px-2 md:px-8 flex-col md:flex-row py-2 md:py-0 gap-2 md:gap-0">
      <div className="flex-1 w-full md:w-auto flex justify-center md:justify-start">
        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-[#ededed] hover:text-[#DA0037] transition-colors">
          <HomeIcon size={24} />
          <span>TimeAttack</span>
        </Link>
      </div>
      <div className="flex-none gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
        <ul className="menu menu-horizontal px-1 items-center gap-1 md:gap-2 text-[#a1a1aa] font-medium flex-nowrap w-max mx-auto md:w-auto md:mx-0">
          {session && profile?.role === 'club' && (
            <>
              <li>
                <Link 
                  to="/cronometrador" 
                  className={`flex items-center gap-2 rounded-xl transition-colors hover:text-[#ededed] ${location.pathname === '/cronometrador' ? 'text-[#ededed] bg-[#333333]/50' : ''}`}
                >
                  <Timer size={18} />
                  <span className="hidden sm:inline">Cronometrador</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/gestion" 
                  className={`flex items-center gap-2 rounded-xl transition-colors hover:text-[#ededed] ${location.pathname === '/gestion' ? 'text-[#ededed] bg-[#333333]/50' : ''}`}
                >
                  <Settings size={18} />
                  <span className="hidden sm:inline">Gestión</span>
                </Link>
              </li>
            </>
          )}
          <li>
            <Link 
              to="/clasificacion" 
              className={`flex items-center gap-2 rounded-xl transition-colors hover:text-[#ededed] ${location.pathname === '/clasificacion' ? 'text-[#ededed] bg-[#333333]/50' : ''}`}
            >
              <Trophy size={18} />
              <span className="hidden sm:inline">Clasificación</span>
            </Link>
          </li>
          
          <div className="divider opacity-30 divider-horizontal mx-0"></div>

          {session ? (
            <li>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm text-[#DA0037] hover:bg-[#DA0037]/10 hover:text-[#DA0037] rounded-xl flex items-center gap-2">
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </li>
          ) : (
            location.pathname !== '/login' && (
              <li>
                <Link to="/login" className="btn btn-primary btn-sm rounded-xl text-white flex items-center gap-2 border-none">
                  <LogIn size={16} />
                  <span>Acceso</span>
                </Link>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

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

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const inicializarAuth = async () => {
      try {
        // 1. Obtener sesión inicial (solo una vez)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          // 2. Si hay usuario, pedir su perfil
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (isMounted) {
            // IMPORTANTE: Solo actualizamos el estado si el componente sigue montado
            setSession(session);
            setProfile(profileData || { notFound: true });
          }
        } else {
          // No hay sesión
          if (isMounted) {
            setSession(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
      } finally {
        // 3. APAGAR EL LOADING SIEMPRE
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    inicializarAuth();

    // 4. Escuchar cambios futuros de sesión (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Al hacer login, volvemos a cargar su perfil
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        setSession(session);
        setProfile(profileData || { notFound: true });
        setLoading(false);
      }
    });

    // 5. Cleanup function: Vital para evitar el Supabase Lock en Strict Mode
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading || (session && !profile)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#171717]">
        <span className="loading loading-spinner text-[#DA0037] loading-lg mb-4"></span>
        <p className="text-[#a1a1aa] font-bold tracking-tight">Cargando telemetría...</p>
      </div>
    );
  }

  const isAuth = !!session;
  const needsOnboarding = isAuth && profile?.notFound;

  // Helpers de redirección
  const redirectAfterLogin = () => {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    if (profile?.role === 'club') return <Navigate to="/gestion" replace />;
    return <Navigate to="/clasificacion" replace />;
  };

  // Componente Envoltorio Guard
  const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
    if (!isAuth) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRole && profile?.role !== allowedRole) {
      // Bloquear acceso a rutas de club para pilotos
      return <Navigate to="/clasificacion" replace />;
    }

    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-base-content flex flex-col">
      {/* Navbar superior */}
      <Navbar session={session} profile={profile} />

      {/* Contenedor principal */}
      <main className="p-2 md:p-8 flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/login" element={isAuth ? redirectAfterLogin() : <Login />} />
          <Route path="/onboarding" element={isAuth && needsOnboarding ? <Onboarding /> : <Navigate to="/" replace />} />
          
          {/* Rutas Protegidas para Clubes/Organizadores usando el Guard y Pasando Contexto */}
          <Route 
            path="/cronometrador" 
            element={<ProtectedRoute allowedRole="club"><Cronometrador userId={session?.user?.id} /></ProtectedRoute>} 
          />
          <Route 
            path="/gestion" 
            element={<ProtectedRoute allowedRole="club"><Gestion userId={session?.user?.id} /></ProtectedRoute>} 
          />
          
          {/* Ruta Pública compartida y para Pilotos */}
          <Route path="/clasificacion" element={<Clasificacion />} />
        </Routes>
      </main>
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