import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // Login exitoso, enviamos al cronometrador
      navigate('/cronometrador');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] w-full">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">Acceso Oficiales</h2>
          
          {errorMsg && (
            <div className="alert alert-error text-sm mb-4">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Correo Electrónico</span>
              </label>
              <input 
                type="email" 
                className="input input-bordered w-full" 
                placeholder="oficial@rally.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Contraseña</span>
              </label>
              <input 
                type="password" 
                className="input input-bordered w-full" 
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-control mt-4">
              <button 
                type="submit" 
                className="btn btn-primary w-full text-lg" 
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner"></span> : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
