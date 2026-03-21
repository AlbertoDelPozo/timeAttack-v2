import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus } from 'lucide-react';

const formatMs = (ms: number) => (ms / 1000).toFixed(3);

export default function Gestion() {
  const [pilotos, setPilotos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiempos, setTiempos] = useState<any[]>([]);

  const [nuevoPiloto, setNuevoPiloto] = useState('');
  const [nuevoDorsal, setNuevoDorsal] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  // Configuración de Carrera
  const [tramos, setTramos] = useState<number | ''>('');
  const [pasadas, setPasadas] = useState<number | ''>('');
  const [mensajeConfig, setMensajeConfig] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  const cargarDatos = async () => {
    // Cargar Pilotos
    const { data: pData } = await supabase.from('pilots').select('*').order('name');
    if (pData) setPilotos(pData);

    // Cargar Categorías
    const { data: cData } = await supabase.from('categories').select('*').order('name');
    if (cData) setCategorias(cData);

    // Cargar últimos 10 tiempos
    const { data: tData } = await supabase
      .from('lap_times')
      .select('*, pilots(name), categories(name)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (tData) setTiempos(tData);

    // Cargar Configuración de Carrera
    const { data: configData } = await supabase.from('race_config').select('*').eq('id', 1).single();
    if (configData) {
      setTramos(configData.num_tramos || 1);
      setPasadas(configData.num_pasadas || 1);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleInsertPiloto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPiloto.trim()) return;
    const dorsalValue = nuevoDorsal.trim() ? parseInt(nuevoDorsal, 10) : null;
    await supabase.from('pilots').insert({ name: nuevoPiloto, dorsal: dorsalValue });
    setNuevoPiloto('');
    setNuevoDorsal('');
    cargarDatos();
  };

  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeConfig(null);
    
    if (tramos === '' || pasadas === '') return;
    
    const { error } = await supabase
      .from('race_config')
      .update({ num_tramos: Number(tramos), num_pasadas: Number(pasadas) })
      .eq('id', 1);
      
    if (error) {
      console.error("Error al actualizar la configuración:", error);
      setMensajeConfig({ texto: `Error al guardar: ${error.message}`, tipo: 'error' });
    } else {
      setMensajeConfig({ texto: "Rally configurado con éxito", tipo: 'success' });
      setTimeout(() => setMensajeConfig(null), 3000);
    }
  };

  const handleInsertCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    await supabase.from('categories').insert({ name: nuevaCategoria });
    setNuevaCategoria('');
    cargarDatos();
  };

  const handleDeletePiloto = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este piloto?")) {
      const { error } = await supabase.from('pilots').delete().eq('id', id);
      if (error) {
        console.error("Error exacto de Supabase al borrar piloto:", error);
        alert(`Error al borrar piloto: ${error.message}`);
      } else {
        setPilotos((prev) => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleDeleteCategoria = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error("Error exacto de Supabase al borrar categoría:", error);
        alert(`Error al borrar categoría: ${error.message}`);
      } else {
        setCategorias((prev) => prev.filter(c => c.id !== id));
      }
    }
  };

  const handleDeleteTiempo = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este tiempo?")) {
      const { error } = await supabase.from('lap_times').delete().eq('id', id);
      if (error) {
        console.error("Error exacto de Supabase al borrar tiempo:", error);
        alert(`Error al borrar tiempo: ${error.message}`);
      } else {
        setTiempos((prev) => prev.filter(t => t.id !== id));
      }
    }
  };

  return (
    <div className="bg-[#171717] min-h-screen p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-[#ededed] mb-8 drop-shadow-sm">Panel de Gestión</h1>

      {/* Configuración de Carrera (WRC Mode) */}
      <div className="w-full max-w-7xl mb-8">
        <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-2xl w-full">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold mb-4 text-[#ededed]">Configuración del Rally</h2>
            
            {mensajeConfig && (
              <div className={`alert ${mensajeConfig.tipo === 'success' ? 'alert-success' : 'alert-error'} mb-4 shadow-sm text-white font-bold rounded-xl border-none`}>
                <span>{mensajeConfig.texto}</span>
              </div>
            )}

            <form onSubmit={handleGuardarConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-lg font-semibold text-[#a1a1aa]">Número de Tramos</span>
                </label>
                <input 
                  type="number" 
                  min="1"
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] text-xl py-6 px-4" 
                  value={tramos}
                  onChange={(e) => setTramos(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-lg font-semibold text-[#a1a1aa]">Número de Pasadas</span>
                </label>
                <input 
                  type="number" 
                  min="1"
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] text-xl py-6 px-4" 
                  value={pasadas}
                  onChange={(e) => setPasadas(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-control w-full">
                <button type="submit" className="btn btn-lg w-full h-[3.8rem] rounded-xl bg-gradient-to-r from-[#DA0037] to-[#b9002f] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(218,0,55,0.4)] border-none text-[#ededed] transition-all">
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Columna Izquierda: Pilotos y Categorías */}
        <div className="flex flex-col gap-8">
          
          {/* Panel Pilotos */}
          <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-2xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold mb-4">Gestión de Pilotos</h2>
              
              <form onSubmit={handleInsertPiloto} className="flex flex-col md:flex-row gap-2 mb-6 items-center">
                <input 
                  type="number" 
                  placeholder="Dorsal" 
                  className="input w-32 rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={nuevoDorsal}
                  onChange={(e) => setNuevoDorsal(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Nombre del nuevo piloto" 
                  className="input flex-1 w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={nuevoPiloto}
                  onChange={(e) => setNuevoPiloto(e.target.value)}
                  required
                />
                <button type="submit" className="btn rounded-full bg-[#DA0037] hover:bg-[#b9002f] border-none text-[#ededed] shadow-lg shadow-[#DA0037]/20 h-[3rem] px-6 flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <Plus size={20} />
                  <span>Añadir</span>
                </button>
              </form>

              <div className="overflow-x-auto max-h-64 border border-[#333333] rounded-2xl">
                <table className="table w-full text-base">
                  <thead className="bg-base-300 sticky top-0 z-10">
                    <tr>
                      <th className="w-20 text-center">Dorsal</th>
                      <th>Nombre</th>
                      <th className="w-16 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pilotos.map((p) => (
                      <tr key={p.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                        <td className="text-center font-mono font-bold text-[#a1a1aa] py-4 px-4">{p.dorsal || '-'}</td>
                        <td className="font-semibold py-4 px-4 text-[#ededed]">{p.name}</td>
                        <td className="text-center py-4 px-4">
                          <button 
                            className="btn btn-ghost btn-md text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                            onClick={() => handleDeletePiloto(p.id)}
                            title="Eliminar Piloto"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pilotos.length === 0 && (
                      <tr><td colSpan={3} className="text-center italic text-base-content/50">No hay pilotos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Panel Categorías */}
          <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-2xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold mb-4">Gestión de Categorías</h2>
              
              <form onSubmit={handleInsertCategoria} className="flex gap-2 mb-6 items-center">
                <input 
                  type="text" 
                  placeholder="Nombre de la nueva categoría" 
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  required
                />
                <button type="submit" className="btn rounded-full bg-[#DA0037] hover:bg-[#b9002f] border-none text-[#ededed] shadow-lg shadow-[#DA0037]/20 h-full min-h-[3rem] px-6 flex items-center gap-2">
                  <Plus size={20} />
                  <span>Añadir</span>
                </button>
              </form>

              <div className="overflow-x-auto max-h-48 border border-[#333333] rounded-2xl">
                <table className="table w-full text-base">
                  <thead className="bg-base-300 sticky top-0 z-10">
                    <tr>
                      <th>Categoría</th>
                      <th className="w-16 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((c) => (
                      <tr key={c.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                        <td className="font-semibold py-4 px-4">{c.name}</td>
                        <td className="text-center py-4 px-4">
                          <button 
                            className="btn btn-ghost btn-md text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                            onClick={() => handleDeleteCategoria(c.id)}
                            title="Eliminar Categoría"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categorias.length === 0 && (
                      <tr><td colSpan={2} className="text-center italic text-base-content/50">No hay categorías</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Historial de Tiempos */}
        <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-2xl h-full">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold mb-4 text-[#ededed]">Últimos 10 Tiempos Registrados</h2>
            <p className="text-sm text-[#a1a1aa] mb-4">Usa el botón borrar en caso de cometer un error al introducir el tiempo de un coche.</p>

            <div className="overflow-x-auto rounded-2xl border border-[#333333] flex-1">
              <table className="table w-full text-sm shrink-0">
                <thead className="bg-base-300">
                  <tr>
                    <th>Piloto</th>
                    <th>Cat.</th>
                    <th className="text-right">T. Total</th>
                    <th className="w-16 text-center">Borrar</th>
                  </tr>
                </thead>
                <tbody>
                  {tiempos.map((t) => (
                    <tr key={t.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                      <td className="font-semibold py-4 px-4">{t.pilots?.name}</td>
                      <td className="py-4 px-4"><span className="badge badge-sm badge-neutral rounded-full px-2">{t.categories?.name}</span></td>
                      <td className="text-right font-mono font-bold py-4 px-4">{formatMs(t.total_time_ms)}</td>
                      <td className="text-center py-4 px-4">
                        <button 
                          className="btn btn-ghost btn-md text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                          onClick={() => handleDeleteTiempo(t.id)}
                          title="Borrar Tiempo Erróneo"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tiempos.length === 0 && (
                    <tr><td colSpan={4} className="text-center italic text-base-content/50 p-4">No hay tiempos en el historial</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
