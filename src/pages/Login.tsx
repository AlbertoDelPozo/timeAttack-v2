import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, Flag, Timer } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // States compartidos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // States de Registro
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'piloto' | 'club'>('piloto');

  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // La redirección ocurrirá automáticamente por App.tsx monitorizando OnAuthStateChange
      } else {
        // Modo Registro
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user) {
          // Intentar inyectar el perfil manualmente (Asume Email Confirmation = OFF o RLS permisivo momentáneo)
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            role: role,
            display_name: displayName
          });

          if (profileError) {
            console.error("No se pudo crear el perfil automáticamente. Caerá al Onboarding si hace login.", profileError);
          } else if (role === 'club') {
            await supabase.from('clubs').insert({ id: data.user.id, name: displayName });
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (providerName: 'google' | 'facebook') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: providerName,
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] flex flex-col lg:flex-row relative overflow-hidden font-sans">

      {/* Columna Izquierda - Branding (Oculta en móvil) */}
      <div className="hidden lg:flex relative flex-1 flex-col justify-center items-center bg-zinc-950 border-r border-zinc-800 p-12">
        {/* Glow de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-start justify-center max-w-md w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <Timer size={28} className="text-white" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-zinc-100 tracking-tight">TimeAttack</h1>
          </div>
          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed font-medium mb-12">
            Control de tiempos profesional y gestión de campeonatos. La telemetría definitiva para pilotos y organizadores de motorsport.
          </p>

          <div className="flex items-center gap-4 text-zinc-500 font-medium text-sm border-t border-zinc-800/80 pt-6 w-full">
            <ShieldCheck size={18} /> Seguridad integral y precisión milimétrica
          </div>
        </div>

        <div className="absolute bottom-8 left-8 text-zinc-600 text-sm font-medium">
          © 2026 Motorsport Devs
        </div>
      </div>

      {/* Columna Derecha - Auth */}
      <div className="flex-1 flex justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-md mx-auto flex flex-col">

          {/* Header en móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-10 pt-8">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <Timer size={22} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-zinc-100 tracking-tight">TimeAttack</h2>
          </div>

          {/* Selector Login / Register */}
          <div className="flex bg-[#09090b] p-1 rounded-lg border border-zinc-800 mb-8 w-full max-w-[280px]">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md font-bold transition-all text-sm ${mode === 'login' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => { setMode('login'); setErrorMsg(null); }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md font-bold transition-all text-sm ${mode === 'register' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => { setMode('register'); setErrorMsg(null); }}
            >
              Registro
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm mb-6 p-3 rounded-md font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">

            {/* Campos exclusivos de Registro */}
            {mode === 'register' && (
              <>
                <div className="form-control w-full">
                  <label className="label mb-1.5 px-0">
                    <span className="text-zinc-400 font-semibold text-sm">Nombre / Equipo</span>
                  </label>
                  <label className="input bg-transparent border border-zinc-800 text-zinc-100 focus-within:border-red-500/50 rounded-md flex items-center gap-3 w-full h-11 px-3">
                    <User size={18} className="text-zinc-400" />
                    <input
                      type="text"
                      className="grow bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-red-500 focus-visible:border-red-500 w-full"
                      placeholder="Ej: Escudería Sur"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label mb-1.5 px-0 mt-2">
                    <span className="text-zinc-400 font-semibold text-sm">Tipo de Cuenta</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('piloto')}
                      className={`flex flex-col items-center justify-center p-4 rounded-md border transition-all ${role === 'piloto' ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                    >
                      <Flag size={20} className="mb-2" />
                      <span className="font-semibold text-sm">Piloto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('club')}
                      className={`flex flex-col items-center justify-center p-4 rounded-md border transition-all ${role === 'club' ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                    >
                      <ShieldCheck size={20} className="mb-2" />
                      <span className="font-semibold text-sm">Organizador</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Campos Comunes */}
            <div className="form-control w-full">
              <label className="label mb-1.5 px-0 mt-2">
                <span className="text-zinc-400 font-semibold text-sm">Correo Electrónico</span>
              </label>
              <label className="input bg-transparent border border-zinc-800 text-zinc-100 focus-within:border-red-500/50 rounded-md flex items-center gap-3 w-full h-11 px-3">
                <Mail size={18} className="text-zinc-400" />
                <input
                  type="email"
                  className="grow bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-red-500 focus-visible:border-red-500 w-full"
                  placeholder="Escribe tu correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-control w-full mb-2">
              <label className="label mb-1.5 px-0 mt-2">
                <span className="text-zinc-400 font-semibold text-sm">Contraseña</span>
              </label>
              <label className="input bg-transparent border border-zinc-800 text-zinc-100 focus-within:border-red-500/50 rounded-md flex items-center gap-3 w-full h-11 px-3">
                <Lock size={18} className="text-zinc-400" />
                <input
                  type="password"
                  className="grow bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-red-500 focus-visible:border-red-500 w-full"
                  placeholder="Escribe tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-control mt-2">
              <button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-all duration-200 border-none disabled:opacity-70 flex justify-center items-center shadow-sm text-sm"
                disabled={loading}
              >
                {loading ? "Cargando..." : (mode === 'login' ? 'Entrar al Paddock' : 'Registrar Cuenta')}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px bg-zinc-800 flex-1"></div>
            <span className="text-zinc-600 text-xs font-semibold uppercase tracking-wider">o continuar con</span>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          {/* OAuth Buttons */}
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="w-full h-11 bg-[#09090b] border border-zinc-800 hover:bg-zinc-800/50 text-zinc-300 font-semibold rounded-md flex items-center justify-center gap-3 text-sm transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}
