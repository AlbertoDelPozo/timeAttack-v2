import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Select as NextUISelect, SelectItem, Spinner } from '@nextui-org/react';
import { Trophy, Flag, Clock, Layers } from 'lucide-react';

export default function Cronometrador({ userId, sessionId, rallyId }: { userId?: string, sessionId?: string, rallyId?: string }) {
  // Cascading Selectors
  const [championships, setChampionships] = useState<any[]>([]);
  const [allRallies, setAllRallies] = useState<any[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [selectedRally, setSelectedRally] = useState<string>(rallyId || '');

  const [pilotosInscritos, setPilotosInscritos] = useState<any[]>([]);
  const [pilotosPendientes, setPilotosPendientes] = useState<any[]>([]);
  const [pilotosCompletados, setPilotosCompletados] = useState<any[]>([]);
  const [numTramos, setNumTramos] = useState<number>(1);
  const [numPasadas, setNumPasadas] = useState<number>(1);
  const [uiMode, setUiMode] = useState<'pendientes' | 'edicion'>('pendientes');
  const [configStatus, setConfigStatus] = useState<'idle' | 'ok' | 'missing'>('idle');

  // Contexto seleccionado
  const [pasada, setPasada] = useState<number>(1);

  // Piloto
  const [pilotoId, setPilotoId] = useState('');

  // Tiempos Multi-Tramo
  type TramoData = { tiempo: string; penalizacion: string };
  const [tramosData, setTramosData] = useState<Record<number, TramoData>>({});

  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);
  const [sessionLapTimes, setSessionLapTimes] = useState<any[]>([]);
  const [loadingTop, setLoadingTop] = useState(false);

  // 1. Fetch initial ALL data for Dropdowns
  useEffect(() => {
    let isMounted = true;
    if (!userId) return;
    supabase.from('championships').select('*').eq('club_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => { if (isMounted && data) setChampionships(data); });

    supabase.from('rallies').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (isMounted && data) setAllRallies(data); });
    return () => { isMounted = false; };
  }, [userId]);

  const filteredRallies = allRallies.filter(r => r.championship_id === selectedCamp);

  useEffect(() => {
    if (rallyId) setSelectedRally(rallyId);
  }, [rallyId]);

  const fetchSessionTimes = async () => {
    if (!userId) return;
    let q = supabase
      .from('lap_times')
      .select('*, pilots(name), categories(name)')
      .eq('club_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (selectedRally) {
      q = q.eq('rally_id', selectedRally);
    } else if (sessionId) {
      q = q.eq('session_id', sessionId);
    } else {
      q = q.is('session_id', null);
    }

    const { data } = await q;
    if (data) setSessionLapTimes(data);
  };

  useEffect(() => { fetchSessionTimes(); }, [userId, sessionId, selectedRally]);

  // Handle Pilots & Race Config Fetch
  useEffect(() => {
    let isMounted = true;

    const fetchSelectData = async () => {
      if (!userId) return;

      try {
        if (selectedRally || sessionId) {
          const targetCol = selectedRally ? 'rally_id' : 'session_id';
          const targetVal = selectedRally || sessionId;

          const { data: insData, error: insErr } = await supabase
            .from('inscriptions')
            .select(`id, pilot_id, category_id, pilots (*), categories ( name )`)
            .eq(targetCol, targetVal);

          if (insErr) throw insErr;

          if (isMounted && insData) {
            const parsedPilots = insData.map((i: any) => ({
              id: i.pilot_id,
              name: i.pilots?.name || 'Desconocido',
              category_id: i.category_id,
              number: i.pilots?.dorsal || i.pilots?.num_dorsal || i.dorsal || null
            })).sort((a, b) => (a.number || 999) - (b.number || 999));

            setPilotosInscritos(parsedPilots);
          }
        } else {
          if (isMounted) setPilotosInscritos([]);
        }
      } catch (error: any) {
        console.error('Error fetching pilots for cronómetro:', error);
      } finally {
        if (isMounted) setLoadingTop(false);
      }
    };

    const fetchRaceConfig = async () => {
      if (!selectedRally && !userId) return;

      console.log("Buscando config para Rally ID (Misión 102):", selectedRally);

      let num = 1;
      let foundConfig = false;

      // Lectura DDL nativa: Tabla rallies
      if (selectedRally) {
        const { data: rallyData, error: rallyErr } = await supabase
          .from('rallies')
          .select('stages, passes')
          .eq('id', selectedRally)
          .maybeSingle();

        if (rallyErr) {
          console.error("Error fetching rally config:", rallyErr);
        }

        if (rallyData) {
          console.log("Configuración extraída de tabla rallies:", rallyData);
          num = rallyData.stages || 1;
          if (isMounted) setNumPasadas(rallyData.passes || 1);
          foundConfig = true;
        }
      }

      if (isMounted) {
        setNumTramos(num);
        setConfigStatus(foundConfig ? 'ok' : 'missing');
      }
    };

    fetchSelectData();
    fetchRaceConfig();
    return () => { isMounted = false; };
  }, [userId, selectedRally, sessionId]);

  // Lógica Exclusión Dinámica "Pendientes"
  useEffect(() => {
    let isMounted = true;
    const fetchLapTimesToExclude = async () => {
      if (!selectedRally || !pasada) {
        if (isMounted) setPilotosPendientes(pilotosInscritos);
        return;
      }

      setLoadingTop(true);
      try {
        // Buscamos a los pilotos que ya han rellenado TODOS los tramos de esta pasada?
        // Si hacen multi-tramo, el piloto terminará la pasada entera de golpe normalmente.
        // Vamos a excluir a los pilotos que tienen AL MÚLTIPLE número de registros igual a num_tramos.
        const { data: doneData } = await supabase
          .from('lap_times')
          .select('pilot_id')
          .eq('rally_id', selectedRally)
          .eq('pasada_num', pasada);

        if (isMounted) {
          if (!doneData || doneData.length === 0) {
            setPilotosPendientes(pilotosInscritos);
            setPilotosCompletados([]);
          } else {
            const counts = new Map<string, number>();
            doneData.forEach(d => {
              counts.set(d.pilot_id, (counts.get(d.pilot_id) || 0) + 1);
            });
            // Excluimos solo a los que han completado todos los tramos de esta pasada
            setPilotosPendientes(pilotosInscritos.filter(p => (counts.get(p.id) || 0) < numTramos));
            // Completados/Parciales para modo edición
            setPilotosCompletados(pilotosInscritos.filter(p => (counts.get(p.id) || 0) > 0));
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setPilotosPendientes(pilotosInscritos);
          setPilotosCompletados([]);
        }
      } finally {
        if (isMounted) setLoadingTop(false);
      }
    };

    fetchLapTimesToExclude();
    return () => { isMounted = false; };
  }, [pilotosInscritos, selectedRally, pasada, sessionLapTimes, numTramos]);

  // Smart Fetching (Auto-rellenado)
  useEffect(() => {
    let isMounted = true;
    const fetchPilotData = async () => {
      if (!pilotoId || !selectedRally || !pasada) {
        if (isMounted) setTramosData({});
        return;
      }

      const { data } = await supabase.from('lap_times')
        .select('*')
        .eq('rally_id', selectedRally)
        .eq('pilot_id', pilotoId)
        .eq('pasada_num', pasada);

      if (isMounted) {
        if (data && data.length > 0) {
          const newTramos: Record<number, TramoData> = {};
          data.forEach(lap => {
            const trackMs = lap.track_time_ms || 0;
            newTramos[lap.tramo_num] = {
              tiempo: trackMs > 0 ? (trackMs / 1000).toFixed(3) : '',
              penalizacion: lap.penalty_ms ? String(lap.penalty_ms / 1000) : ''
            };
          });
          setTramosData(newTramos);
        } else {
          setTramosData({});
        }
      }
    };
    fetchPilotData();
    return () => { isMounted = false; };
  }, [pilotoId, selectedRally, pasada]);

  const updateTramoData = (tNum: number, key: keyof TramoData, val: string) => {
    setTramosData(prev => ({
      ...prev,
      [tNum]: { ...(prev[tNum] || { tiempo: '', penalizacion: '' }), [key]: val }
    }));
  };

  const hasAnyValidData = () => {
    return Object.keys(tramosData).some(k => {
      const t = tramosData[Number(k)];
      if (!t) return false;
      const ms = Math.round(parseFloat(t.tiempo || '0') * 1000);
      return ms > 0 || parseFloat(t.penalizacion || '0') > 0;
    });
  };

  const isValidToSave = typeof selectedRally !== "undefined" && selectedRally !== '' && pilotoId && hasAnyValidData();

  const guardarTiempo = async () => {
    try {
      if (!isValidToSave) {
        setMensaje({ texto: 'Faltan datos o el tiempo es cero.', tipo: 'error' });
        return;
      }

      const activeTramoKeys = Object.keys(tramosData).map(Number).filter(k => {
        const t = tramosData[k];
        const ms = Math.round(parseFloat(t?.tiempo || '0') * 1000);
        return ms > 0 || parseFloat(t?.penalizacion || '0') > 0;
      });

      if (activeTramoKeys.length === 0) {
        setMensaje({ texto: 'No has introducido ningún tiempo válido.', tipo: 'error' });
        return;
      }

      const selectedPilot = pilotosInscritos.find(p => p.id === pilotoId);
      const catId = selectedPilot?.category_id || null;

      // Implementación Check & Write (Misión 98) 
      // Iteramos asíncronamente para cada tramo que el usuario haya rellenado en pantalla
      for (const tNum of activeTramoKeys) {
        const t = tramosData[tNum];
        const trackMs = Math.round(parseFloat(t?.tiempo || '0') * 1000);
        const pen = parseFloat(t?.penalizacion || '0');
        const penMs = isNaN(pen) ? 0 : Math.round(pen * 1000);

        const payload = {
          pilot_id: pilotoId,
          category_id: catId,
          tramo_num: tNum,
          pasada_num: pasada,
          track_time_ms: trackMs,
          penalty_ms: penMs,
          total_time_ms: trackMs + penMs,
          club_id: userId,
          rally_id: selectedRally
        };

        // 1. Buscar si el tiempo ya existe para este piloto en esta prueba, tramo y pasada específica.
        const { data: existingRecord, error: checkError } = await supabase
          .from('lap_times')
          .select('id')
          .eq('pilot_id', pilotoId)
          .eq('rally_id', selectedRally)
          .eq('tramo_num', tNum)
          .eq('pasada_num', pasada)
          .maybeSingle();

        if (checkError) {
          console.error("Error comprobando existencia:", checkError);
          throw checkError;
        }

        if (existingRecord) {
          // 2A. ACTUALIZAR (UPDATE) si ya existía
          const { error: updateError } = await supabase
            .from('lap_times')
            .update(payload)
            .eq('id', existingRecord.id);

          if (updateError) throw updateError;
        } else {
          // 2B. CREAR (INSERT) si es un tiempo nuevo
          const { error: insertError } = await supabase
            .from('lap_times')
            .insert(payload);

          if (insertError) throw insertError;
        }
      }

      setMensaje({ texto: '¡Tiempos registrados con éxito!', tipo: 'success' });

      setPilotoId('');
      setTimeout(() => setMensaje(null), 4000);

      // Update session lap times locally
      fetchSessionTimes();

    } catch (error: any) {
      console.error("Error al guardar:", error);
      setMensaje({ texto: `Error: ${error.message || 'Fallo de red'}`, tipo: 'error' });
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col md:max-w-[1200px] max-w-full mx-auto md:py-6 relative h-full">

      <h1 className="text-3xl lg:text-4xl font-black text-white px-2 mt-4 md:mt-0 mb-6 hidden md:block tracking-tight text-center">Dashboard de Cronometraje</h1>

      {/* BLOQUE SUPERIOR: CONTEXTO ROOT Y PASADA */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm p-4 mb-4 md:mb-6 flex flex-col gap-4">
        {/* FILA 1: CASCADA CAMPEONATO / RALLY */}
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="flex-1 w-full">
            <label className="text-[10px] sm:text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider mb-2"><Trophy size={14} /> Campeonato</label>
            <select
              className="w-full h-[40px] sm:h-[44px] bg-zinc-950 border border-zinc-800 text-zinc-100 px-3 rounded-lg focus:border-red-500 focus:ring-0 focus:outline-none outline-none transition-all shadow-sm"
              value={selectedCamp}
              onChange={(e) => { setSelectedCamp(e.target.value); setSelectedRally(''); }}
              disabled={!!rallyId}
            >
              <option value="">Seleccionar Competición...</option>
              {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[10px] sm:text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider mb-2"><Flag size={14} /> Prueba / Rally</label>
            <select
              className="w-full h-[40px] sm:h-[44px] bg-zinc-950 border border-zinc-800 text-zinc-100 px-3 rounded-lg focus:border-red-500 focus:ring-0 focus:outline-none outline-none transition-all shadow-sm disabled:opacity-50"
              value={selectedRally}
              onChange={(e) => setSelectedRally(e.target.value)}
              disabled={!selectedCamp && !rallyId}
            >
              <option value="">Seleccionar Prueba Activa...</option>
              {rallyId
                ? allRallies.filter(r => r.id === rallyId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                : filteredRallies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
              }
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[10px] sm:text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider mb-2"><Layers size={14} /> Pasada Activa</label>
            <select
              className="w-full h-[40px] sm:h-[44px] bg-zinc-950 border border-zinc-800 text-zinc-100 px-3 rounded-lg focus:border-red-500 focus:ring-0 focus:outline-none outline-none transition-all shadow-sm disabled:opacity-50"
              value={pasada}
              onChange={(e) => setPasada(Number(e.target.value))}
              disabled={!selectedRally || configStatus === 'missing'}
            >
              {Array.from({ length: numPasadas || 1 }, (_, i) => i + 1).map(num => (
                <option key={String(num)} value={String(num)}>Pasada {num}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 min-h-0">

        {/* BLOQUE IZQUIERDO: PILOTOS GRID & MODO */}
        <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm p-4 overflow-y-auto min-h-[250px] lg:h-full relative flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sticky top-0 bg-[#09090b] z-10 py-1 gap-4 sm:gap-0">
            <div className="flex items-center gap-2">
              <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider">
                Parrilla {pasada && `(Pasada ${pasada})`}
              </h3>
              {loadingTop && <Spinner size="sm" color="danger" />}
            </div>

            {/* MODE SELECTOR */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => { setUiMode('pendientes'); setPilotoId(''); setMensaje(null); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${uiMode === 'pendientes' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                🏁 Pendientes
              </button>
              <button
                onClick={() => { setUiMode('edicion'); setPilotoId(''); setMensaje(null); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${uiMode === 'edicion' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                📝 Edición
              </button>
            </div>
          </div>

          {(!selectedRally) ? (
            <div className="w-full h-40 flex flex-col items-center justify-center text-zinc-500 text-sm border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
              <Trophy size={32} className="mb-2 text-zinc-700" />
              Selecciona una competición para ver los pilotos.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-3 pb-8">
              {(uiMode === 'pendientes' ? pilotosPendientes : pilotosCompletados).map(p => {
                const isSelected = p.id === pilotoId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPilotoId(p.id); setMensaje(null); }}
                    className={`h-20 sm:h-24 flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 p-1 ${isSelected
                      ? 'bg-red-600/10 border-red-600 shadow-[0_0_15px_-3px_rgba(220,38,38,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                      }`}
                  >
                    <span className={`text-3xl sm:text-4xl font-black font-mono leading-none mb-1 ${isSelected ? 'text-red-500' : 'text-zinc-300'}`}>
                      {p.number || '-'}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-center font-semibold text-zinc-500 line-clamp-2 leading-tight px-1 hidden sm:block">
                      {p.name}
                    </span>
                  </button>
                );
              })}

              {/* ESTADOS VACÍOS */}
              {pilotosInscritos.length === 0 && !loadingTop && (
                <div className="col-span-full py-10 text-center text-zinc-500 text-sm italic">
                  Aún no hay pilotos en la lista de inscritos de este Rally.
                </div>
              )}

              {uiMode === 'pendientes' && pilotosInscritos.length > 0 && pilotosPendientes.length === 0 && !loadingTop && (
                <div className="col-span-full py-12 px-4 flex flex-col items-center justify-center gap-3 text-center border-2 border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
                  <Flag className="text-emerald-500" size={32} />
                  <span className="text-emerald-400 font-bold text-sm">
                    Manga Completada
                  </span>
                  <span className="text-zinc-400 text-xs text-balance">
                    Todos los pilotos han registrado la Pasada completa. Revisa la Edición si hay errores.
                  </span>
                </div>
              )}

              {uiMode === 'edicion' && pilotosInscritos.length > 0 && pilotosCompletados.length === 0 && !loadingTop && (
                <div className="col-span-full py-12 px-4 flex flex-col items-center justify-center text-center">
                  <span className="text-zinc-500 font-bold text-sm mb-1">Cero Tiempos Registrados</span>
                  <span className="text-zinc-600 text-xs text-balance">
                    Ningún piloto tiene cronometraje en esta pasada aún. Ve a la pestaña PENDIENTES.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BLOQUE DERECHO: FORMULARIO MULTI-TRAMO */}
        <div className="w-full lg:w-[480px] shrink-0 bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm p-4 md:p-6 lg:h-full flex flex-col relative overflow-y-auto overflow-x-hidden">

          <div className="text-center mb-4 pt-2">
            <div className="text-zinc-300 font-bold uppercase tracking-widest text-xs mb-1">
              {uiMode === 'edicion' ? 'Modo Corrección / Editor' : 'Telemetría Avanzada'}
            </div>
            <div className="text-zinc-600 text-xs">Formato: [ Segundos.Milésimas ] | Puedes omitir tramos</div>
          </div>

          {mensaje && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-bold border text-center shadow-sm ${mensaje.tipo === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
              {mensaje.texto}
            </div>
          )}

          <form className="flex flex-col flex-1" onSubmit={(e) => { e.preventDefault(); guardarTiempo(); }}>
             
             {/* Advertencia de Configuración (Misión 101) */}
             {configStatus === 'missing' && (
               <div className="mb-6 p-6 rounded-xl text-2xl font-black border-2 text-center shadow-lg bg-orange-500/20 border-orange-500 text-orange-400">
                 Falta configuración de tramos en la DB
               </div>
             )}

             {/* Dynamic TC Inputs */}
             {configStatus === 'ok' && (
               <div className="flex flex-col gap-4 mb-6">
                  {Array.from({ length: numTramos || 1 }, (_, i) => i + 1).map(tNum => {
                     const data = tramosData[tNum] || { tiempo: '', penalizacion: '' };
                   
                   return (
                     <div key={tNum} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl mt-1 relative w-full group">
                        <div className="absolute -top-3 left-3 bg-zinc-900 border border-zinc-700 text-white font-black px-2 py-0.5 rounded text-xs shadow-sm shadow-zinc-950">
                          TRAMO {tNum}
                        </div>
                        
                        <div className="flex flex-1 items-end justify-center sm:justify-start gap-1 sm:gap-2 pt-2 px-1">
                           <div className="flex flex-col flex-1">
                             <input
                               type="number" inputMode="decimal" step="0.001"
                               placeholder="0.000"
                               value={data.tiempo}
                               onChange={(e) => updateTramoData(tNum, 'tiempo', e.target.value)}
                               className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-2xl font-black font-mono text-white focus:border-red-500 focus:ring-1 focus:outline-none outline-none transition-colors placeholder:text-zinc-800"
                             />
                           </div>
                        </div>
                        
                        {/* Penalty */}
                        <div className="flex w-full sm:w-28 pt-2 sm:pt-2 mt-1 sm:mt-0">
                           <input
                             type="number" inputMode="numeric" step="0.1"
                             placeholder="+ PEN"
                             value={data.penalizacion}
                             onChange={(e) => updateTramoData(tNum, 'penalizacion', e.target.value)}
                             className="w-full h-10 sm:h-14 bg-amber-500/5 border border-amber-500/20 text-center text-lg font-bold font-mono text-amber-500 rounded-lg focus:border-amber-500/50 focus:outline-none outline-none placeholder:text-amber-900/40 transition-colors"
                           />
                        </div>
                     </div>
                   );
                  })}
               </div>
             )}

             {/* Spacer */}
             <div className="flex-1"></div>

             {/* Guardar / Actualizar */}
             <div className="sticky bottom-0 pt-2 pb-1 bg-[#09090b] z-10 w-full mt-auto">
               <button
                 type="submit"
                 disabled={!isValidToSave}
                 className={`w-full h-16 sm:h-20 ${uiMode === 'edicion' ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_-5px_rgba(217,119,6,0.5)]' : 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)]'} disabled:bg-zinc-900 disabled:border disabled:border-zinc-800 disabled:text-zinc-700 text-white font-black text-lg md:text-xl tracking-widest uppercase rounded-xl disabled:shadow-none transition-all active:scale-[0.98]`}
               >
                 {uiMode === 'edicion' ? 'Guardar Cambios' : 'Guardar Pasada'}
               </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
}
