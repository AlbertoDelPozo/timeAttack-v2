import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Select, SelectItem, Spinner } from '@nextui-org/react';

export default function Cronometrador({ userId, sessionId, rallyId }: { userId?: string, sessionId?: string, rallyId?: string }) {
  const [pilotos, setPilotos] = useState<any[]>([]);
  const [config, setConfig] = useState({ num_tramos: 1, num_pasadas: 1 });

  // Contexto seleccionado
  const [tramo, setTramo] = useState<number>(1);
  const [pasada, setPasada] = useState<number>(1);

  // Piloto
  const [pilotoId, setPilotoId] = useState('');
  
  // Tiempos (Strings para los inputs numéricos)
  const [minutos, setMinutos] = useState('');
  const [segundos, setSegundos] = useState('');
  const [milesimas, setMilesimas] = useState('');
  const [penalizacion, setPenalizacion] = useState('');

  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);
  const [sessionLapTimes, setSessionLapTimes] = useState<any[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  const fetchSessionTimes = async () => {
    if (!userId) return;
    let q = supabase
      .from('lap_times')
      .select('*, pilots(name), categories(name)')
      .eq('club_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (rallyId) {
      q = q.eq('rally_id', rallyId);
    } else if (sessionId) {
      q = q.eq('session_id', sessionId);
    } else {
      q = q.is('session_id', null).is('rally_id', null);
    }

    const { data } = await q;
    if (data) setSessionLapTimes(data);
  };

  useEffect(() => { fetchSessionTimes(); }, [userId, sessionId, rallyId]);

  useEffect(() => {
    let isMounted = true;

    const fetchSelectData = async () => {
      if (!userId) return;
      setLoadingTop(true);

      try {
        if (rallyId || sessionId) {
          // Si es un rally específico, cargamos sus inscripciones para los pilotos (+ dorsales y categorias)
          const targetCol = rallyId ? 'rally_id' : 'session_id';
          const targetVal = rallyId || sessionId;
          
          const { data: insData, error: insErr } = await supabase
            .from('inscriptions')
            .select(`pilot_id, category_id, number, pilots ( name ), categories ( name )`)
            .eq(targetCol, targetVal);

          if (insErr) throw insErr;

          if (isMounted && insData) {
            const parsedPilots = insData.map((i: any) => ({
              id: i.pilot_id,
              name: i.pilots?.name || 'Desconocido',
              category_id: i.category_id,
              number: i.number || null
            })).sort((a, b) => (a.number || 999) - (b.number || 999));
            
            setPilotos(parsedPilots);
          }
        } else {
          // Fallback global (cronometro libre)
          const { data: pilotsData, error: pilotsError } = await supabase.from('pilots').select('id, name').eq('club_id', userId);
          if (pilotsError) throw pilotsError;
          if (isMounted && pilotsData) {
            setPilotos(pilotsData.map(p => ({ ...p, category_id: null, number: null })));
          }
        }

        // Configuración de Tramos y Pasadas
        let tramos_cfg = 1, pasadas_cfg = 1;
        if (rallyId) {
          const { data: configData } = await supabase.from('race_config').select('num_tramos, num_pasadas').eq('rally_id', rallyId).maybeSingle();
          if (configData) { tramos_cfg = configData.num_tramos || 1; pasadas_cfg = configData.num_pasadas || 1; }
        } else {
          // Prueba actual heredada globalmente (legacy)
          const { data: cfgLegacy } = await supabase.from('race_config').select('num_tramos, num_pasadas').eq('club_id', userId).is('rally_id', null).maybeSingle();
          if (cfgLegacy) { tramos_cfg = cfgLegacy.num_tramos || 1; pasadas_cfg = cfgLegacy.num_pasadas || 1; }
        }
        
        if (isMounted) setConfig({ num_tramos: tramos_cfg, num_pasadas: pasadas_cfg });

      } catch (error: any) {
        console.error('Error fetching datos de cronómetro:', error);
      } finally {
         if (isMounted) setLoadingTop(false);
      }
    };

    fetchSelectData();
    return () => { isMounted = false; };
  }, [userId, rallyId, sessionId]);

  const handlePadChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, maxLength: number) => {
    let val = e.target.value.replace(/\D/g, ''); // Ensure only numbers
    if (val.length > maxLength) val = val.slice(0, maxLength);
    setter(val);
  };

  const calculateMilliseconds = (min: string, sec: string, ms: string) => {
    const minVal = parseInt(min || '0', 10);
    const secVal = parseInt(sec || '0', 10);
    const msVal = parseInt(ms || '0', 10);
    // Si el msVal se introduce como "5", podría significar 500 o 5, asumiremos direct match de input o lo paddearemos?
    // En rally, 5 = 005. Si meten "50", es 050. Usaremos direct match numérico. Pero para UI es mejor que paddeen.
    return (minVal * 60000) + (secVal * 1000) + msVal;
  };

  const guardarTiempo = async () => {
    try {
      if (!pilotoId) {
        setMensaje({ texto: 'Selecciona un piloto primero.', tipo: 'error' });
        return;
      }
      if (!minutos && !segundos && !milesimas) {
        setMensaje({ texto: 'Introduce un tiempo de pista válido.', tipo: 'error' });
        return;
      }

      const selectedPilot = pilotos.find(p => p.id === pilotoId);
      const catId = selectedPilot?.category_id || null;

      const trackTimeMs = calculateMilliseconds(minutos, segundos, milesimas);
      const pen = parseFloat(penalizacion || '0');
      const penaltyMs = isNaN(pen) ? 0 : Math.round(pen * 1000);
      const totalTimeMs = trackTimeMs + penaltyMs;

      // Check if already exists for avoid duplicates
      let queryExistentes = supabase
        .from('lap_times').select('id')
        .eq('club_id', userId)
        .eq('pilot_id', pilotoId)
        .eq('pasada_num', pasada)
        .eq('tramo_num', tramo);

      if (rallyId) queryExistentes = queryExistentes.eq('rally_id', rallyId);
      else if (sessionId) queryExistentes = queryExistentes.eq('session_id', sessionId);
      else queryExistentes = queryExistentes.is('session_id', null).is('rally_id', null);

      const { data: existentes } = await queryExistentes;
      if (existentes && existentes.length > 0) {
        setMensaje({ texto: 'Ese piloto ya tiene tiempo en este tramo y pasada.', tipo: 'error' });
        return;
      }

      const payload = {
        pilot_id: pilotoId,
        category_id: catId, // si no tiene null
        tramo_num: tramo,
        pasada_num: pasada,
        track_time_ms: trackTimeMs,
        penalty_ms: penaltyMs,
        total_time_ms: totalTimeMs,
        club_id: userId,
        rally_id: rallyId || null,
        session_id: (!rallyId && sessionId) ? sessionId : null 
      };

      const { error } = await supabase.from('lap_times').insert([payload]);
      if (error) throw error;

      setMensaje({ texto: '¡Tiempo registrado con éxito!', tipo: 'success' });
      
      // Reset variables
      setMinutos('');
      setSegundos('');
      setMilesimas('');
      setPenalizacion('');
      setPilotoId('');
      
      setTimeout(() => setMensaje(null), 4000);
      fetchSessionTimes();

    } catch (error: any) {
      console.error("Error al guardar:", error);
      setMensaje({ texto: `Error: ${error.message || 'Fallo de red'}`, tipo: 'error' });
    }
  };


  return (
    <div className="w-full flex-1 flex flex-col md:max-w-4xl max-w-full mx-auto md:py-6 relative h-full">

      <h1 className="text-3xl font-black text-white px-2 mt-4 md:mt-0 mb-6 hidden md:block tracking-tight text-center">Dashboard de Cronometraje</h1>

      {/* BLOQUE SUPERIOR: CONTEXTO (Tramo / Pasada) */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm p-4 mb-4 md:mb-6">
        <div className="flex items-center gap-4 justify-between">
           <div className="flex gap-4 w-full">
             <Select
                label="Tramo"
                variant="bordered"
                selectedKeys={[String(tramo)]}
                onSelectionChange={(k) => setTramo(Number(Array.from(k)[0]))}
                className="flex-1"
                classNames={{ trigger: "border-zinc-800 bg-zinc-950", value: "font-bold text-zinc-100", label: "text-zinc-500" }}
             >
                {Array.from({ length: config.num_tramos }, (_, i) => i + 1).map(num => (
                  <SelectItem key={String(num)} value={String(num)}>Tramo {num}</SelectItem>
                ))}
             </Select>
             <Select
                label="Pasada"
                variant="bordered"
                selectedKeys={[String(pasada)]}
                onSelectionChange={(k) => setPasada(Number(Array.from(k)[0]))}
                className="flex-1"
                classNames={{ trigger: "border-zinc-800 bg-zinc-950", value: "font-bold text-zinc-100", label: "text-zinc-500" }}
             >
                {Array.from({ length: config.num_pasadas }, (_, i) => i + 1).map(num => (
                  <SelectItem key={String(num)} value={String(num)}>Pasada {num}</SelectItem>
                ))}
             </Select>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 min-h-0">
        
        {/* BLOQUE IZQUIERDO: PILOTOS GRID */}
        <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm p-4 overflow-y-auto min-h-[250px] lg:h-full">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Selector de Piloto</h3>
             {loadingTop && <Spinner size="sm" color="default" />}
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
             {pilotos.map(p => {
               const isSelected = p.id === pilotoId;
               return (
                 <button
                   key={p.id}
                   type="button"
                   onClick={() => setPilotoId(p.id)}
                   className={`h-24 flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 p-1 ${
                     isSelected 
                       ? 'bg-red-600/10 border-red-600 shadow-[0_0_15px_-3px_rgba(220,38,38,0.3)]' 
                       : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                   }`}
                 >
                   <span className={`text-4xl font-black font-mono leading-none mb-1 ${isSelected ? 'text-red-500' : 'text-zinc-300'}`}>
                     {p.number || '-'}
                   </span>
                   <span className="text-[10px] md:text-xs text-center font-semibold text-zinc-500 line-clamp-2 leading-tight px-1">
                     {p.name}
                   </span>
                 </button>
               );
             })}
             {pilotos.length === 0 && !loadingTop && (
               <div className="col-span-full py-10 text-center text-zinc-500 text-sm">
                 No hay pilotos inscritos.
               </div>
             )}
          </div>
        </div>

        {/* BLOQUE DERECHO: FORMULARIO */}
        <div className="w-full lg:w-[420px] shrink-0 bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm p-5 md:p-6 lg:h-full flex flex-col justify-center relative">
          
          {mensaje && (
            <div className={`absolute top-4 left-4 right-4 px-4 py-3 rounded-md text-sm font-bold border text-center z-10 ${mensaje.tipo === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
              {mensaje.texto}
            </div>
          )}

          <div className="text-center mb-6 pt-4">
             <div className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-1">Entrada de Telemetría</div>
             <div className="text-zinc-500 text-xs">Formato: MM : SS . MMM</div>
          </div>

          <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); guardarTiempo(); }}>
             {/* Inputs de Tiempo (Gigantes) */}
             <div className="flex items-end justify-center gap-2">
                {/* Minutos */}
                <div className="flex flex-col items-center">
                   <span className="text-zinc-500 text-xs font-bold uppercase mb-1">MIN</span>
                   <input
                     type="number" inputMode="numeric" pattern="[0-9]*"
                     placeholder="00"
                     value={minutos}
                     onChange={(e) => handlePadChange(e, setMinutos, 2)}
                     className="w-20 md:w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-4xl md:text-5xl font-black font-mono text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-zinc-800"
                   />
                </div>

                <span className="text-4xl text-zinc-700 font-black mb-6">:</span>

                {/* Segundos */}
                <div className="flex flex-col items-center">
                   <span className="text-zinc-500 text-xs font-bold uppercase mb-1">SEG</span>
                   <input
                     type="number" inputMode="numeric" pattern="[0-9]*"
                     placeholder="00"
                     value={segundos}
                     onChange={(e) => handlePadChange(e, setSegundos, 2)}
                     className="w-20 md:w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-4xl md:text-5xl font-black font-mono text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-zinc-800"
                   />
                </div>

                <span className="text-4xl text-zinc-700 font-black mb-6">.</span>

                {/* Milésimas */}
                <div className="flex flex-col items-center">
                   <span className="text-zinc-500 text-xs font-bold uppercase mb-1">MIL</span>
                   <input
                     type="number" inputMode="numeric" pattern="[0-9]*"
                     placeholder="000"
                     value={milesimas}
                     onChange={(e) => handlePadChange(e, setMilesimas, 3)}
                     className="w-24 md:w-28 h-24 bg-zinc-950 border border-zinc-700 rounded-xl text-center text-4xl md:text-5xl font-black font-mono text-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-zinc-800"
                   />
                </div>
             </div>

             {/* Penalización */}
             <div className="mt-4 px-2">
                <div className="flex items-center justify-between border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 pr-4 focus-within:border-amber-500/50 transition-colors hidden md:flex">
                  <span className="text-amber-600/70 text-sm font-bold ml-2">Penalización (+seg)</span>
                  <input
                     type="number" inputMode="numeric" step="0.1"
                     placeholder="0.0"
                     value={penalizacion}
                     onChange={(e) => setPenalizacion(e.target.value)}
                     className="w-20 bg-transparent text-right text-xl font-bold font-mono text-amber-500 outline-none placeholder:text-amber-900/30"
                  />
                </div>
                 {/* Mobile version */}
                 <div className="md:hidden flex flex-col border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 focus-within:border-amber-500/50 transition-colors">
                  <span className="text-amber-600/70 text-sm font-bold text-center mb-2">Penalización (+seg)</span>
                  <input
                     type="number" inputMode="numeric" step="0.1"
                     placeholder="0.0"
                     value={penalizacion}
                     onChange={(e) => setPenalizacion(e.target.value)}
                     className="w-full bg-transparent text-center text-2xl font-bold font-mono text-amber-500 outline-none placeholder:text-amber-900/30"
                  />
                </div>
             </div>

             {/* Guardar */}
             <button
               type="submit"
               disabled={!pilotoId}
               className="w-full h-20 md:h-24 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-2xl tracking-widest uppercase rounded-xl shadow-lg mt-4 transition-all active:scale-[0.98]"
             >
               Registrar Tiempo
             </button>
          </form>
        </div>
      </div>

    </div>
  );
}
