import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Cronometrador() {
  const [pilotos, setPilotos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [config, setConfig] = useState({ num_tramos: 1, num_pasadas: 1 });

  const [pilotoId, setPilotoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [pasada, setPasada] = useState<number>(1);
  const [tiemposTramos, setTiemposTramos] = useState<Record<number, string>>({});
  const [penalizacionPasada, setPenalizacionPasada] = useState('0');

  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  // Fetch pilotos and categorias on mount
  useEffect(() => {
    const fetchSelectData = async () => {
      // 1. Fetch pilots
      const { data: pilotsData, error: pilotsError } = await supabase
        .from('pilots')
        .select('id, name');
      
      if (pilotsError) {
        console.error('Error fetching pilotos:', pilotsError);
      } else if (pilotsData) {
        setPilotos(pilotsData);
      }

      // 2. Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
        
      if (categoriesError) {
        console.error('Error fetching categorias:', categoriesError);
      } else if (categoriesData) {
        setCategorias(categoriesData);
      }

      // 3. Fetch race config
      const { data: configData, error: configError } = await supabase
        .from('race_config')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (configError) {
        console.error('Error fetching config:', configError);
      } else if (configData) {
        setConfig({ num_tramos: configData.num_tramos, num_pasadas: configData.num_pasadas });
      }
    };

    fetchSelectData();
  }, []);

  // Set default values automatically if lists are populated but selection is empty
  useEffect(() => {
    if (pilotos.length > 0 && !pilotoId) {
      setPilotoId(pilotos[0].id);
    }
  }, [pilotos, pilotoId]);

  useEffect(() => {
    if (categorias.length > 0 && !categoriaId) {
      setCategoriaId(categorias[0].id.toString());
    }
  }, [categorias, categoriaId]);

  // Init tiempos template array when config loads
  useEffect(() => {
    if (config.num_tramos > 0) {
      const initTiempos: Record<number, string> = {};
      for (let i = 1; i <= config.num_tramos; i++) {
        initTiempos[i] = '';
      }
      setTiemposTramos(initTiempos);
    }
  }, [config.num_tramos]);

  const handleTiempoChange = (tramoNum: number, value: string) => {
    setTiemposTramos(prev => ({
      ...prev,
      [tramoNum]: value
    }));
  };

  const guardarTiempo = async () => {
    try {
      if (!pilotoId || !categoriaId || !pasada) {
        setMensaje({ texto: 'Por favor selecciona Piloto, Categoría y Pasada.', tipo: 'error' });
        return;
      }

      setMensaje(null);

      const arrayDeTiempos: any[] = [];
      const globalPenaltyMs = Math.round(parseFloat(penalizacionPasada || '0') * 1000);
      let penaltyApplied = false;
      
      // Parse inputs into array payload
      Object.entries(tiemposTramos).forEach(([tramoStr, pistaStr]) => {
        const tramoNum = parseInt(tramoStr, 10);
        if (pistaStr.trim() !== '') {
          const trackTimeMs = Math.round(parseFloat(pistaStr) * 1000);
          
          if (!isNaN(trackTimeMs)) {
            // Apply the global penalty ONLY to the first valid submitted statge
            const penaltyMs = penaltyApplied ? 0 : globalPenaltyMs;
            penaltyApplied = true;

            const totalTimeMs = trackTimeMs + penaltyMs;

            arrayDeTiempos.push({
              pilot_id: pilotoId,
              category_id: parseInt(categoriaId, 10),
              tramo_num: tramoNum,
              pasada_num: pasada,
              track_time_ms: trackTimeMs,
              penalty_ms: penaltyMs,
              total_time_ms: totalTimeMs,
            });
          }
        }
      });

      if (arrayDeTiempos.length === 0) {
        setMensaje({ texto: 'Por favor, introduce al menos un tiempo de pista válido.', tipo: 'error' });
        return;
      }

      // Mitigate 23505 Error: Filter out preexisting lap_times for this pilot and iteration
      const tramosAInsertar = arrayDeTiempos.map(t => t.tramo_num);
      
      const { data: existentes } = await supabase
        .from('lap_times')
        .select('tramo_num')
        .eq('pilot_id', pilotoId)
        .eq('pasada_num', pasada)
        .in('tramo_num', tramosAInsertar);
        
      const tramosExistentes = (existentes || []).map(e => e.tramo_num);
      
      const payloadFinal = arrayDeTiempos.filter(t => !tramosExistentes.includes(t.tramo_num));
      const omitidos = arrayDeTiempos.filter(t => tramosExistentes.includes(t.tramo_num)).map(t => t.tramo_num);
      
      if (payloadFinal.length === 0) {
        setMensaje({ texto: `Todos los tramos indicados ya estaban registrados para este piloto en la pasada ${pasada}.`, tipo: 'error' });
        return;
      }

      // Bulk Insert Operation
      const { error } = await supabase.from('lap_times').insert(payloadFinal);

      if (error) {
        setMensaje({ texto: `Error: ${error.message}`, tipo: 'error' });
        return;
      }

      if (omitidos.length > 0) {
        setMensaje({ texto: `Tiempos guardados exitosamente. Se omitieron los Tramos ${omitidos.join(', ')} por duplicidad.`, tipo: 'success' });
      } else {
        setMensaje({ texto: '¡Todos los tiempos guardados con éxito!', tipo: 'success' });
      }

      // Reiniciar Formulario (manteniendo selects)
      const clearedTiempos: Record<number, string> = {};
      for (let i = 1; i <= config.num_tramos; i++) {
        clearedTiempos[i] = '';
      }
      setTiemposTramos(clearedTiempos);
      setPenalizacionPasada('0');

      // Limpiar mensaje
      setTimeout(() => setMensaje(null), 4000);

    } catch (error: any) {
      console.error("Error al guardar:", error);
      setMensaje({ texto: `Error: ${error.message || 'Fallo de red'}`, tipo: 'error' });
    }
  };

  return (
    <div className="bg-[#171717] min-h-screen p-8 w-full flex justify-center items-start">
      {/* Tarjeta principal del formulario */}
      <div className="card bg-[#1e1e1e] shadow-2xl max-w-2xl mx-auto w-full p-8 border border-[#333333] rounded-2xl">

        <h2 className="text-3xl font-bold mb-4 text-center text-[#ededed]">Control de Tiempos</h2>

        {mensaje && (
          <div className={`alert ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'} mb-4 shadow-sm text-white font-bold`}>
            <span>{mensaje.texto}</span>
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); guardarTiempo(); }}>

          {/* Fila 1: Piloto */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-lg font-semibold text-[#a1a1aa]">Piloto</span>
            </label>
            <select
              className="select select-bordered w-full text-lg rounded-2xl focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none bg-[#171717] text-[#ededed]"
              value={pilotoId}
              onChange={(e) => setPilotoId(e.target.value)}
            >
              <option value="" disabled>Selecciona un piloto...</option>
              {pilotos.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Fila 2: Categoría y Pasada en grid (sin Tramo select individual) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-lg font-semibold text-[#a1a1aa]">Categoría</span>
              </label>
              <select
                className="select select-bordered w-full text-lg rounded-2xl focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none bg-[#171717] text-[#ededed]"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                <option value="" disabled>Categoría...</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-lg font-semibold text-[#a1a1aa]">Pasada</span>
              </label>
              <select
                className="select select-bordered w-full text-lg rounded-2xl focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none bg-[#171717] text-[#ededed]"
                value={pasada}
                onChange={(e) => setPasada(Number(e.target.value))}
              >
                {Array.from({ length: config.num_pasadas }, (_, i) => i + 1).map(num => (
                  <option key={`p-${num}`} value={num}>Pasada {num}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider my-4">TIEMPOS DE TRAMOS</div>

          {/* Fila 3: Grid de Tramos (Multi-Input) */}
          <div className="flex flex-col gap-4">
            {Array.from({ length: config.num_tramos }, (_, i) => i + 1).map(num => (
              <div key={`tramo-input-${num}`} className="flex flex-col md:flex-row gap-4 items-center bg-[#121212] p-4 rounded-2xl border border-[#333333]">
                <div className="w-full md:w-32 flex-shrink-0">
                  <span className="text-xl font-bold text-[#DA0037]">Tramo {num}</span>
                </div>
                
                <div className="form-control w-full flex-1">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Tiempo (00.000)"
                    className="input input-bordered w-full text-center text-xl font-mono font-bold spin-button-none focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none transition-colors rounded-xl bg-[#171717] text-[#ededed]"
                    value={tiemposTramos[num] || ''}
                    onChange={(e) => handleTiempoChange(num, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="divider my-2">PENALIZACIÓN (PASADA COMPLETA)</div>

          {/* Fila 4: Penalización Global */}
          <div className="flex justify-center">
            <div className="form-control w-full max-w-sm bg-[#121212] p-4 rounded-3xl border border-error/30 shadow-[0_0_15px_rgba(255,0,0,0.05)]">
              <label className="label justify-center">
                <span className="label-text text-lg font-bold text-error uppercase tracking-wider">Penalización Total (seg)</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-bordered input-lg w-full text-center text-4xl font-mono font-black spin-button-none text-error h-20 rounded-2xl focus:border-error focus:ring-2 focus:ring-error focus:outline-none bg-[#0a0a0a]"
                value={penalizacionPasada}
                onChange={(e) => setPenalizacionPasada(e.target.value)}
              />
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="form-control mt-6">
            <button
              type="submit"
              className="btn btn-lg w-full mt-6 text-2xl h-20 bg-gradient-to-r from-[#DA0037] to-[#b9002f] text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(218,0,55,0.4)] transition-all rounded-3xl border-none"
            >
              GUARDAR TIEMPO
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
