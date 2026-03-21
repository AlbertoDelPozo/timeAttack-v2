import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, Flag } from 'lucide-react';

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
    <div className="flex justify-center items-center py-6 w-full">
      <div className="card w-full max-w-lg bg-[#1e1e1e]/90 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-[#333333] rounded-3xl overflow-hidden relative">
        
        {/* Decoración Neón Superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DA0037] to-transparent opacity-70"></div>

        <div className="card-body p-6 md:p-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-[#ededed] drop-shadow-sm tracking-tight">TimeAttack</h2>
            <p className="text-[#a1a1aa] font-medium mt-1">Control de Tiempos Profesional</p>
          </div>

          {/* Selector Login / Register */}
          <div className="flex bg-[#121212] p-1 rounded-2xl border border-[#333333] mb-6">
            <button 
              type="button"
              className={`flex-1 py-2 rounded-xl font-bold transition-all text-sm ${mode === 'login' ? 'bg-[#333333] text-white shadow-md' : 'text-[#a1a1aa] hover:text-white'}`}
              onClick={() => { setMode('login'); setErrorMsg(null); }}
            >
              Iniciar Sesión
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 rounded-xl font-bold transition-all text-sm ${mode === 'register' ? 'bg-[#DA0037] text-white shadow-md shadow-[#DA0037]/20' : 'text-[#a1a1aa] hover:text-white'}`}
              onClick={() => { setMode('register'); setErrorMsg(null); }}
            >
              Crear Cuenta
            </button>
          </div>
          
          {errorMsg && (
            <div className="alert alert-error text-white text-sm mb-4 rounded-xl border-none shadow-sm font-bold">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            
            {/* Campos exclusivos de Registro */}
            {mode === 'register' && (
              <>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-[#ededed]">Nombre / Equipo</span>
                  </label>
                  <label className="input bg-[#121212] border border-[#333333] text-[#ededed] focus-within:border-[#DA0037] focus-within:ring-1 focus-within:ring-[#DA0037] rounded-xl flex items-center gap-3 w-full py-6">
                    <User size={18} className="text-[#a1a1aa]" />
                    <input 
                      type="text" 
                      className="grow" 
                      placeholder="Ej: Escudería Sur"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-[#ededed]">Tipo de Cuenta</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setRole('piloto')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${role === 'piloto' ? 'bg-[#333333] border-[#a1a1aa] text-white shadow-sm' : 'bg-[#121212] border-[#333333] text-[#a1a1aa] hover:border-[#444444]'}`}
                    >
                      <Flag size={20} className="mb-1" />
                      <span className="font-bold text-sm">Piloto</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRole('club')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${role === 'club' ? 'bg-[#DA0037]/20 border-[#DA0037] text-[#DA0037] shadow-sm shadow-[#DA0037]/10' : 'bg-[#121212] border-[#333333] text-[#a1a1aa] hover:border-[#444444]'}`}
                    >
                      <ShieldCheck size={20} className="mb-1" />
                      <span className="font-bold text-sm">Organizador</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Campos Comunes */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-[#ededed]">Correo Electrónico</span>
              </label>
              <label className="input bg-[#121212] border border-[#333333] text-[#ededed] focus-within:border-[#DA0037] focus-within:ring-1 focus-within:ring-[#DA0037] rounded-xl flex items-center gap-3 w-full py-6">
                <Mail size={18} className="text-[#a1a1aa]" />
                <input 
                  type="email" 
                  className="grow" 
                  placeholder="piloto@rally.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-control w-full mb-2">
              <label className="label">
                <span className="label-text font-bold text-[#ededed]">Contraseña</span>
              </label>
              <label className="input bg-[#121212] border border-[#333333] text-[#ededed] focus-within:border-[#DA0037] focus-within:ring-1 focus-within:ring-[#DA0037] rounded-xl flex items-center gap-3 w-full py-6">
                <Lock size={18} className="text-[#a1a1aa]" />
                <input 
                  type="password" 
                  className="grow" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-control mt-2">
              <button 
                type="submit" 
                className="btn btn-lg w-full h-[3.5rem] rounded-xl bg-gradient-to-r from-white to-gray-300 text-black hover:scale-[1.02] border-none font-black tracking-wide transition-all shadow-xl" 
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner"></span> : (mode === 'login' ? 'Entrar al Paddock' : 'Registrar Cuenta')}
              </button>
            </div>
          </form>

          <div className="divider text-[#a1a1aa] text-xs font-bold my-6">O ENTRA CON</div>

          {/* OAuth Buttons */}
          <button 
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="btn btn-outline w-full h-[3.5rem] rounded-xl border-[#333333] hover:bg-[#333333] hover:border-[#444444] text-[#ededed] flex items-center justify-center gap-3"
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
