import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [role, setRole] = useState<'piloto' | 'club'>('piloto');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Autocompletar el nombre si el auth.user lo tiene (ej: Google OAuth fullname)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.full_name) {
        setDisplayName(data.user.user_metadata.full_name);
      }
    });
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setErrorMsg("Error de sesión. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }

    // 1. Insert Profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      role: role,
      display_name: displayName
    });

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
      return;
    }

    // 2. Insert Club (if applies)
    if (role === 'club') {
      const { error: clubError } = await supabase.from('clubs').insert({
        id: user.id,
        name: displayName
      });
      if (clubError) {
         console.error("Error creando el club:", clubError);
      }
    }

    // Done! Recargar la ventana para actualizar los contextos en App.tsx
    window.location.href = role === 'club' ? '/gestion' : '/clasificacion';
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] w-full p-4">
      <div className="card w-full max-w-md bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-3xl">
        <div className="card-body p-6 md:p-8">
          <h2 className="card-title text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Completar Perfil</h2>
          <p className="text-[#a1a1aa] mb-6">Un último paso para arrancar motores.</p>
          
          {errorMsg && (
            <div className="alert alert-error text-white font-bold mb-4 rounded-xl border-none shadow-sm">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateProfile} className="flex flex-col gap-6">
            
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-[#ededed]">Nombre para mostrar</span>
              </label>
              <input 
                type="text" 
                className="input w-full bg-[#121212] border border-[#333333] text-[#ededed] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] rounded-xl py-6" 
                placeholder="Ej: Escudería Ourense / Carlos Sainz"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-[#ededed]">¿Cuál es tu rol?</span>
              </label>
              <div className="flex bg-[#121212] p-1 rounded-2xl border border-[#333333]">
                <button 
                  type="button"
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${role === 'piloto' ? 'bg-[#333333] text-white shadow-md' : 'text-[#a1a1aa] hover:text-white'}`}
                  onClick={() => setRole('piloto')}
                >
                  🏁 Soy Piloto
                </button>
                <button 
                  type="button"
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${role === 'club' ? 'bg-[#DA0037] text-white shadow-md shadow-[#DA0037]/20' : 'text-[#a1a1aa] hover:text-white'}`}
                  onClick={() => setRole('club')}
                >
                  🏢 Organizador
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-lg h-[3.5rem] w-full bg-white text-black hover:bg-gray-200 border-none rounded-2xl mt-4 font-bold tracking-wide" 
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Empezar a correr ->'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
