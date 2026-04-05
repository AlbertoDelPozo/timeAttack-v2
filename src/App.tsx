import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Trophy, Timer, Settings, LogOut, LogIn, Home as HomeIcon } from 'lucide-react';

import Login from './pages/Login';
import Cronometrador from './pages/Cronometrador';
import Clasificacion from './pages/Clasificacion';
import Management from './pages/Management';
import Onboarding from './pages/Onboarding';

// Sidebar incorporates SaaS Dashboard layout
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/cronometrador' ? 'bg-red-950/60 text-red-100 border-l-2 border-red-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <Timer size={18} />
              <span>Cronometrador</span>
            </Link>
            <Link 
              to="/gestion" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/gestion' ? 'bg-red-950/60 text-red-100 border-l-2 border-red-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
            >
              <Settings size={18} />
              <span>Gestión</span>
            </Link>
          </>
        )}
        <Link 
          to="/clasificacion" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/clasificacion' ? 'bg-red-950/60 text-red-100 border-l-2 border-red-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent'}`}
        >
          <Trophy size={18} />
          <span>Clasificación</span>
        </Link>
      </nav>

      {session ? (
        <div className="p-4 mt-auto border-t border-zinc-800/60">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
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
              className="w-full flex justify-center items-center gap-2 px-3 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-md shadow-red-900/20"
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

// Mobile Navbar (For small screens)
function MobileNavbar({ session, profile, handleLogout }: { session: Session | null, profile: any, handleLogout: () => void }) {
  const location = useLocation();
  
  return (
    <div className="lg:hidden bg-zinc-950 border-b border-zinc-800/60 flex items-center justify-between p-4 sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
         <span>TimeAttack</span>
      </Link>
      <div className="flex items-center gap-2">
         {session && profile?.role === 'club' && (
           <Link to="/gestion" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/gestion' ? 'bg-red-950/60 text-red-100 border-red-500' : 'text-zinc-400 border-transparent'}`}>
             <Settings size={20} />
           </Link>
         )}
         <Link to="/clasificacion" className={`p-2 rounded-lg border-b-2 ${location.pathname === '/clasificacion' ? 'bg-red-950/60 text-red-100 border-red-500' : 'text-zinc-400 border-transparent'}`}>
           <Trophy size={20} />
         </Link>
         {session ? (
           <button onClick={handleLogout} className="p-2 rounded-lg text-zinc-400 hover:text-red-400"><LogOut size={20} /></button>
         ) : (
           <Link to="/login" className="p-2 rounded-lg text-red-500"><LogIn size={20} /></Link>
         )}
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
        // 1. Usar getUser() para validar contra el servidor, no solo el local
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // SESIÓN ZOMBI DETECTADA: Limpiamos automáticamente
          await supabase.auth.signOut();
          if (isMounted) {
            setSession(null);
            setProfile(null);
          }
          return; // Salimos de la función
        }

        // Necesitamos la sesión real para el estado de la app
        const { data: { session } } = await supabase.auth.getSession();

        // 2. Si el usuario es válido y existe, buscamos su perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted) {
          // IMPORTANTE: Solo actualizamos el estado si el componente sigue montado
          setSession(session);
          setProfile(profile || { notFound: true });
        }
        
      } catch (error) {
        console.error("Error crítico inicializando auth:", error);
        // Ante cualquier error fatal, limpiamos por seguridad
        await supabase.auth.signOut();
        if (isMounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        // 3. PASE LO QUE PASE, QUITAR PANTALLA DE CARGA
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Sidebar session={session} profile={profile} handleLogout={handleLogout} />
      <MobileNavbar session={session} profile={profile} handleLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto bg-[#09090b] p-4 lg:p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
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
              element={<ProtectedRoute allowedRole="club"><Management userId={session?.user?.id} /></ProtectedRoute>} 
            />
            
            {/* Ruta Pública compartida y para Pilotos */}
            <Route path="/clasificacion" element={<Clasificacion />} />
          </Routes>
        </div>
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