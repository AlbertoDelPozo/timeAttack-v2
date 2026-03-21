import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Trophy, Timer, Settings, LogOut, LogIn, Home as HomeIcon } from 'lucide-react';

import Login from './pages/Login';
import Cronometrador from './pages/Cronometrador';
import Clasificacion from './pages/Clasificacion';
import Gestion from './pages/Gestion';

// Navbar is now wrapped with logic to know if a user is logged in
function Navbar({ session }: { session: Session | null }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  return (
    <div className="navbar bg-[#171717]/80 backdrop-blur-md border-b border-[#333333] sticky top-0 z-50 px-4 md:px-8">
      <div className="flex-1">
        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-[#ededed] hover:text-[#DA0037] transition-colors">
          <HomeIcon size={24} />
          <span>TimeAttack</span>
        </Link>
      </div>
      <div className="flex-none gap-2">
        <ul className="menu menu-horizontal px-1 items-center gap-2 text-[#a1a1aa] font-medium">
          {session && (
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen to changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 font-sans text-base-content flex flex-col">
      {/* Navbar superior */}
      <Navbar session={session} />

      {/* Contenedor principal */}
      <main className="p-4 md:p-8 flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={session ? <Navigate to="/cronometrador" replace /> : <Login />} />
          
          {/* Rutas Protegidas */}
          <Route 
            path="/cronometrador" 
            element={session ? <Cronometrador /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/gestion" 
            element={session ? <Gestion /> : <Navigate to="/login" replace />} 
          />
          
          {/* Ruta Pública */}
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