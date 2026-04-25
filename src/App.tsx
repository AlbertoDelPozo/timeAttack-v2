
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Trophy, Timer, Settings, LogOut, LogIn } from 'lucide-react';
import { Spinner, Button } from '@nextui-org/react';

import Login from './pages/Login';
import Cronometrador from './pages/Cronometrador';
import Clasificacion from './pages/Clasificacion';
import Management from './pages/Management';
import Championships from './pages/Championships';
import RallyManager from './pages/RallyManager';
import Onboarding from './pages/Onboarding';
import RightSidebar from './components/layout/RightSidebar';
import DashboardLayout from './components/layout/DashboardLayout';


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
    return <Navigate to="/clasificacion" replace />;
  };

  const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
    if (!isAuth) return <Navigate to="/login" replace />;
    if (allowedRole && profile?.role !== allowedRole) return <Navigate to="/clasificacion" replace />;
    return <>{children}</>;
  };

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

  if (!isAuth) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
        {/* We can expose Clasificacion publicly later, but for now Public is just Login */}
      </Routes>
    );
  }

  return (
    <DashboardLayout session={session} profile={profile} handleLogout={handleLogout}>
      <Routes>
        <Route path="/" element={redirectAfterLogin()} />
        <Route path="/login" element={redirectAfterLogin()} />
        <Route path="/onboarding" element={needsOnboarding ? <Onboarding /> : <Navigate to="/" replace />} />
        
        <Route
          path="/cronometrador"
          element={profile?.role === 'club' ? <Cronometrador userId={session.user.id} /> : <Navigate to="/clasificacion" replace />}
        />
        <Route
          path="/campeonatos"
          element={profile?.role === 'club' ? <Championships userId={session.user.id} /> : <Navigate to="/clasificacion" replace />}
        />
        <Route
          path="/gestion-rally/:rallyId"
          element={profile?.role === 'club' ? <RallyManager userId={session.user.id} /> : <Navigate to="/clasificacion" replace />}
        />
        <Route
          path="/gestion"
          element={profile?.role === 'club' ? <Management userId={session.user.id} /> : <Navigate to="/clasificacion" replace />}
        />
        <Route path="/clasificacion" element={<Clasificacion />} />
        <Route path="*" element={redirectAfterLogin()} />
      </Routes>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}