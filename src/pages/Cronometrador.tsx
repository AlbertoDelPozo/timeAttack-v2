import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Cronometrador({ userId, sessionId, rallyId }: { userId?: string, sessionId?: string, rallyId?: string }) {
  const [pilotos, setPilotos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [config, setConfig] = useState({ num_tramos: 1, num_pasadas: 1 });

  const [pilotoId, setPilotoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [pasada, setPasada] = useState<number>(1);
  const [tiemposTramos, setTiemposTramos] = useState<Record<number, string>>({});
  const [penalizacionPasada, setPenalizacionPasada] = useState('0');

  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);
  const [sessionLapTimes, setSessionLapTimes] = useState<any[]>([]);

  const fetchSessionTimes = async () => {
    if (!userId) return;
    let q = supabase
      .from('lap_times')
      .select('*, pilots(name), categories(name)')
      .eq('club_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionId) {
      q = q.eq('session_id', sessionId);
    } else {
      q = q.is('session_id', null);
    }
    
    const { data } = await q;
    if (data) setSessionLapTimes(data);
  };

  useEffect(() => {
    fetchSessionTimes();
  }, [userId, sessionId]);

  // Fetch pilotos and categorias on mount
  useEffect(() => {
    let isMounted = true;

    const fetchSelectData = async () => {
      if (!userId) return;

      try {
        if (sessionId) {
          // Filtered by specific session inscriptions
          const { data: insData, error: insErr } = await supabase
            .from('inscriptions')
            .select(`
              pilot_id,
              category_id,
              pilots ( name ),
              categories ( name )
            `)
            .eq('session_id', sessionId);
          
          if (insErr) throw insErr;
          
          if (isMounted && insData) {
            const pMap = new Map();
            insData.forEach((i: any) => {
              if (i.pilots && !pMap.has(i.pilot_id)) pMap.set(i.pilot_id, { id: i.pilot_id, name: i.pilots.name, assigned_category_id: i.category_id });
            });
            setPilotos(Array.from(pMap.values()));
            
            // Fetch all global categories as requested
            const { data: catData } = await supabase.from('categories').select('id, name').eq('club_id', userId);
            if (catData) setCategorias(catData);
          }
        } else {
          // Global club fallback
          // 1. Fetch pilots
          const { data: pilotsData, error: pilotsError } = await supabase
            .from('pilots')
            .select('id, name')
            .eq('club_id', userId);
          
          if (pilotsError) throw pilotsError;
          if (isMounted && pilotsData) setPilotos(pilotsData);

          // 2. Fetch categories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name')
            .eq('club_id', userId);
            
          if (categoriesError) throw categoriesError;
          if (isMounted && categoriesData) setCategorias(categoriesData);
        }

        // 3. Fetch race config OR specific rally config
        if (rallyId) {
          const { data: rallyData, error: rallyError } = await supabase
            .from('rallies')
            .select('stages, passes')
            .eq('id', rallyId)
            .maybeSingle();
            
          if (rallyError) throw rallyError;
          if (isMounted && rallyData) {
            setConfig({ num_tramos: rallyData.stages || 1, num_pasadas: rallyData.passes || 1 });
          }
        } else {
          const { data: configData, error: configError } = await supabase
            .from('race_config')
            .select('*')
            .eq('club_id', userId)
            .maybeSingle();
            
          if (configError) throw configError;
          if (isMounted && configData) {
            setConfig({ num_tramos: configData.num_tramos || 1, num_pasadas: configData.num_pasadas || 1 });
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error?.message?.includes('Lock broken') || error?.message?.includes('Fetch is aborted')) {
          console.warn("Petición de cronómetro abortada por concurrencia (ignorando).");
          return;
        }
        console.error('Error fetching datos de cronómetro:', error);
      }
    };

    if (userId) {
      fetchSelectData();
    }

    return () => { isMounted = false; };
  }, [userId, rallyId]);

  // Set default values automatically if lists are populated but selection is empty
  useEffect(() => {
    if (pilotos.length > 0 && !pilotoId) {
      const firstPilot = pilotos[0];
      setPilotoId(firstPilot.id);
      if (sessionId && firstPilot.assigned_category_id) {
        setCategoriaId(firstPilot.assigned_category_id.toString());
      }
    }
  }, [pilotos, pilotoId, sessionId]);

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
      if (!pilotoId || !categoriaId || !pasada || !userId) {
        setMensaje({ texto: 'Por favor selecciona Piloto, Categoría y Pasada verificando tu sesión.', tipo: 'error' });
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
              club_id: userId,
              session_id: sessionId || null
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
      
      let queryExistentes = supabase
        .from('lap_times')
        .select('tramo_num')
        .eq('club_id', userId)
        .eq('pilot_id', pilotoId)
        .eq('pasada_num', pasada)
        .in('tramo_num', tramosAInsertar);
        
      if (sessionId) {
        queryExistentes = queryExistentes.eq('session_id', sessionId);
      } else {
        queryExistentes = queryExistentes.is('session_id', null);
      }
      
      const { data: existentes } = await queryExistentes;
        
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
      
      // Update session lap times locally
      fetchSessionTimes();

    } catch (error: any) {
      console.error("Error al guardar:", error);
      setMensaje({ texto: `Error: ${error.message || 'Fallo de red'}`, tipo: 'error' });
    }
  };

  return (
    <div className="bg-[#171717] min-h-screen p-2 md:p-8 w-full flex justify-center items-start">
      {/* Tarjeta principal del formulario */}
      <div className="card bg-[#1e1e1e] shadow-2xl max-w-2xl mx-auto w-full p-4 md:p-8 mb-4 border border-[#333333] rounded-2xl md:rounded-3xl">

        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center text-[#ededed]">Control de Tiempos</h2>

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
              onChange={(e) => {
                const selectedPilotId = e.target.value;
                setPilotoId(selectedPilotId);
                
                if (sessionId) {
                  const pilotoSeleccionado = pilotos.find(p => p.id === selectedPilotId);
                  if (pilotoSeleccionado && pilotoSeleccionado.assigned_category_id) {
                    setCategoriaId(pilotoSeleccionado.assigned_category_id.toString());
                  }
                }
              }}
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

          <div className="divider my-4 before:bg-zinc-800 after:bg-zinc-800 text-zinc-500 font-medium text-xs tracking-wider">TIEMPOS DE TRAMOS</div>

          {/* Fila 3: Grid de Tramos (Multi-Input) */}
          <div className="flex flex-col gap-2 md:gap-4">
            {Array.from({ length: config.num_tramos }, (_, i) => i + 1).map(num => (
              <div key={`tramo-input-${num}`} className="flex flex-col md:flex-row gap-4 items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800/80">
                <div className="w-full md:w-32 flex-shrink-0">
                  <span className="text-xl text-zinc-400 font-medium">Tramo {num}</span>
                </div>
                
                <div className="form-control w-full flex-1">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Tiempo (00.000)"
                    className="input w-full text-center text-xl font-mono font-bold spin-button-none bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-100 transition-colors rounded-xl"
                    value={tiemposTramos[num] || ''}
                    onChange={(e) => handleTiempoChange(num, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="divider my-4 before:bg-zinc-800 after:bg-zinc-800 text-zinc-500 font-medium text-xs tracking-wider">PENALIZACIÓN (PASADA COMPLETA)</div>

          {/* Fila 4: Penalización Global */}
          <div className="flex justify-center">
            <div className="form-control w-full max-w-sm bg-amber-500/10 p-6 rounded-2xl border border-amber-500/30">
              <label className="label justify-center p-0 mb-4">
                <span className="block text-sm font-bold text-amber-500 uppercase tracking-wider">Penalización Total (seg)</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full text-center text-4xl font-mono font-black border border-amber-500/30 bg-transparent text-amber-500 h-20 rounded-xl block outline-none transition-all focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-sm spin-button-none"
                value={penalizacionPasada}
                onChange={(e) => setPenalizacionPasada(e.target.value)}
              />
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="form-control mt-8">
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-red-900/20 active:scale-[0.98] text-xl tracking-wide border-none"
            >
              GUARDAR TIEMPO
            </button>
          </div>
        </form>

        {/* Historial Aislado Exclusivo para este Corte/Sesión (O Genérico si se usa standalone) */}
        {sessionLapTimes.length > 0 && (
          <div className="mt-8 border-t border-zinc-800/80 pt-8">
            <h3 className="text-zinc-500 font-bold text-xs mb-4 uppercase text-center tracking-widest block">Registros de Sesión</h3>
            <div className="overflow-x-auto rounded-xl border border-zinc-800/80 shadow-sm">
              <table className="w-full text-sm text-left">
                <tbody>
                  {sessionLapTimes.map(t => (
                    <tr key={t.id} className="border-b last:border-0 border-zinc-800/40 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
                      <td className="text-zinc-200 font-medium py-3 pl-4 rounded-l-lg">{t.pilots?.name}</td>
                      <td className="text-zinc-500 font-mono py-3">T{t.tramo_num} / P{t.pasada_num}</td>
                      <td className="text-right text-red-400 font-mono font-bold py-3 pr-4 rounded-r-lg">{(t.total_time_ms / 1000).toFixed(3)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
