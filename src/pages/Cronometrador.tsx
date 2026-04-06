import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Select, SelectItem, Input, Chip } from '@nextui-org/react';

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

  useEffect(() => { fetchSessionTimes(); }, [userId, sessionId]);

  useEffect(() => {
    let isMounted = true;

    const fetchSelectData = async () => {
      if (!userId) return;

      try {
        if (sessionId) {
          const { data: insData, error: insErr } = await supabase
            .from('inscriptions')
            .select(`pilot_id, category_id, pilots ( name ), categories ( name )`)
            .eq('session_id', sessionId);

          if (insErr) throw insErr;

          if (isMounted && insData) {
            const pMap = new Map();
            insData.forEach((i: any) => {
              if (i.pilots && !pMap.has(i.pilot_id)) pMap.set(i.pilot_id, { id: i.pilot_id, name: i.pilots.name, assigned_category_id: i.category_id });
            });
            setPilotos(Array.from(pMap.values()));
            const { data: catData } = await supabase.from('categories').select('id, name').eq('club_id', userId);
            if (catData) setCategorias(catData);
          }
        } else {
          const { data: pilotsData, error: pilotsError } = await supabase.from('pilots').select('id, name').eq('club_id', userId);
          if (pilotsError) throw pilotsError;
          if (isMounted && pilotsData) setPilotos(pilotsData);

          const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('id, name').eq('club_id', userId);
          if (categoriesError) throw categoriesError;
          if (isMounted && categoriesData) setCategorias(categoriesData);
        }

        if (rallyId) {
          const { data: rallyData, error: rallyError } = await supabase.from('rallies').select('stages, passes').eq('id', rallyId).maybeSingle();
          if (rallyError) throw rallyError;
          if (isMounted && rallyData) setConfig({ num_tramos: rallyData.stages || 1, num_pasadas: rallyData.passes || 1 });
        } else {
          const { data: configData, error: configError } = await supabase.from('race_config').select('*').eq('club_id', userId).maybeSingle();
          if (configError) throw configError;
          if (isMounted && configData) setConfig({ num_tramos: configData.num_tramos || 1, num_pasadas: configData.num_pasadas || 1 });
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error?.message?.includes('Lock broken') || error?.message?.includes('Fetch is aborted')) {
          console.warn("Petición de cronómetro abortada por concurrencia (ignorando).");
          return;
        }
        console.error('Error fetching datos de cronómetro:', error);
      }
    };

    if (userId) fetchSelectData();
    return () => { isMounted = false; };
  }, [userId, rallyId]);

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

  useEffect(() => {
    if (config.num_tramos > 0) {
      const initTiempos: Record<number, string> = {};
      for (let i = 1; i <= config.num_tramos; i++) initTiempos[i] = '';
      setTiemposTramos(initTiempos);
    }
  }, [config.num_tramos]);

  const handleTiempoChange = (tramoNum: number, value: string) => {
    setTiemposTramos(prev => ({ ...prev, [tramoNum]: value }));
  };

  const guardarTiempo = async () => {
    try {
      if (!pilotoId || !categoriaId || !pasada || !userId) {
        setMensaje({ texto: 'Por favor selecciona Piloto, Categoría y Pasada.', tipo: 'error' });
        return;
      }
      setMensaje(null);

      const arrayDeTiempos: any[] = [];
      const globalPenaltyMs = Math.round(parseFloat(penalizacionPasada || '0') * 1000);
      let penaltyApplied = false;

      Object.entries(tiemposTramos).forEach(([tramoStr, pistaStr]) => {
        const tramoNum = parseInt(tramoStr, 10);
        if (pistaStr.trim() !== '') {
          const trackTimeMs = Math.round(parseFloat(pistaStr) * 1000);
          if (!isNaN(trackTimeMs)) {
            const penaltyMs = penaltyApplied ? 0 : globalPenaltyMs;
            penaltyApplied = true;
            arrayDeTiempos.push({
              pilot_id: pilotoId,
              category_id: parseInt(categoriaId, 10),
              tramo_num: tramoNum,
              pasada_num: pasada,
              track_time_ms: trackTimeMs,
              penalty_ms: penaltyMs,
              total_time_ms: trackTimeMs + penaltyMs,
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

      const tramosAInsertar = arrayDeTiempos.map(t => t.tramo_num);
      let queryExistentes = supabase
        .from('lap_times').select('tramo_num')
        .eq('club_id', userId).eq('pilot_id', pilotoId).eq('pasada_num', pasada).in('tramo_num', tramosAInsertar);
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

      const { error } = await supabase.from('lap_times').insert(payloadFinal);

      if (error) { setMensaje({ texto: `Error: ${error.message}`, tipo: 'error' }); return; }

      if (omitidos.length > 0) {
        setMensaje({ texto: `Tiempos guardados. Tramos ${omitidos.join(', ')} omitidos por duplicidad.`, tipo: 'success' });
      } else {
        setMensaje({ texto: '¡Todos los tiempos guardados con éxito! ✓', tipo: 'success' });
      }

      const clearedTiempos: Record<number, string> = {};
      for (let i = 1; i <= config.num_tramos; i++) clearedTiempos[i] = '';
      setTiemposTramos(clearedTiempos);
      setPenalizacionPasada('0');
      setTimeout(() => setMensaje(null), 4000);
      fetchSessionTimes();

    } catch (error: any) {
      console.error("Error al guardar:", error);
      setMensaje({ texto: `Error: ${error.message || 'Fallo de red'}`, tipo: 'error' });
    }
  };

  return (
    <div className="w-full flex justify-center items-start py-4 px-2">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">

        {/* Tarjeta principal */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl shadow-2xl p-5 md:p-8 backdrop-blur-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-white tracking-tight">
            Control de Tiempos
          </h2>

          {/* Mensaje feedback */}
          {mensaje && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-semibold border ${mensaje.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {mensaje.texto}
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); guardarTiempo(); }}>
            {/* Piloto */}
            <Select
              label="Piloto"
              variant="bordered"
              color="primary"
              selectedKeys={pilotoId ? [pilotoId] : []}
              onSelectionChange={(keys) => {
                const selectedPilotId = Array.from(keys)[0] as string;
                setPilotoId(selectedPilotId);
                if (sessionId) {
                  const pilotoSeleccionado = pilotos.find(p => p.id === selectedPilotId);
                  if (pilotoSeleccionado?.assigned_category_id) {
                    setCategoriaId(pilotoSeleccionado.assigned_category_id.toString());
                  }
                }
              }}
              classNames={{
                trigger: "border-zinc-700 bg-zinc-950/60",
                label: "text-zinc-400 font-semibold text-base",
                value: "text-zinc-100 text-base",
              }}
            >
              {pilotos.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </Select>

            {/* Categoría + Pasada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Categoría"
                variant="bordered"
                color="primary"
                selectedKeys={categoriaId ? [categoriaId] : []}
                onSelectionChange={(keys) => setCategoriaId(Array.from(keys)[0] as string)}
                classNames={{
                  trigger: "border-zinc-700 bg-zinc-950/60",
                  label: "text-zinc-400 font-semibold",
                  value: "text-zinc-100",
                }}
              >
                {categorias.map(c => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </Select>

              <Select
                label="Pasada"
                variant="bordered"
                color="primary"
                selectedKeys={[String(pasada)]}
                onSelectionChange={(keys) => setPasada(Number(Array.from(keys)[0]))}
                classNames={{
                  trigger: "border-zinc-700 bg-zinc-950/60",
                  label: "text-zinc-400 font-semibold",
                  value: "text-zinc-100",
                }}
              >
                {Array.from({ length: config.num_pasadas }, (_, i) => i + 1).map(num => (
                  <SelectItem key={String(num)} value={String(num)}>Pasada {num}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Divisor Tramos */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-500 font-medium text-xs tracking-wider uppercase">Tiempos de Tramos</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Inputs Tramos */}
            <div className="flex flex-col gap-3">
              {Array.from({ length: config.num_tramos }, (_, i) => i + 1).map(num => (
                <div key={`tramo-input-${num}`} className="flex flex-col md:flex-row gap-3 items-center bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/70">
                  <div className="w-full md:w-32 flex-shrink-0">
                    <span className="text-lg text-zinc-400 font-semibold">Tramo {num}</span>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Tiempo (00.000)"
                    variant="bordered"
                    color="primary"
                    value={tiemposTramos[num] || ''}
                    onValueChange={(v) => handleTiempoChange(num, v)}
                    classNames={{
                      input: "text-center text-xl font-mono font-bold text-zinc-100",
                      inputWrapper: "flex-1 border-zinc-700 bg-zinc-900/50",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Divisor Penalización */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-500 font-medium text-xs tracking-wider uppercase">Penalización (pasada completa)</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Penalización */}
            <div className="flex justify-center">
              <div className="w-full max-w-xs bg-amber-500/10 p-5 rounded-xl border border-amber-500/30">
                <label className="block text-center text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
                  Penalización Total (seg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full text-center text-4xl font-mono font-black border border-amber-500/30 bg-transparent text-amber-500 h-20 rounded-xl block outline-none transition-all focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-sm"
                  style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                  value={penalizacionPasada}
                  onChange={(e) => setPenalizacionPasada(e.target.value)}
                />
              </div>
            </div>

            {/* Botón Guardar */}
            <Button
              type="submit"
              color="primary"
              variant="shadow"
              size="lg"
              className="w-full font-bold text-lg tracking-wide h-14 mt-2"
            >
              GUARDAR TIEMPO
            </Button>
          </form>
        </div>

        {/* Historial sesión */}
        {sessionLapTimes.length > 0 && (
          <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-zinc-500 font-bold text-xs mb-4 uppercase text-center tracking-widest">Registros de Sesión</h3>
            <div className="overflow-x-auto rounded-xl border border-zinc-800/60">
              <table className="w-full text-sm text-left">
                <tbody>
                  {sessionLapTimes.map(t => (
                    <tr key={t.id} className="border-b last:border-0 border-zinc-800/40 hover:bg-zinc-800/40 transition-colors">
                      <td className="text-zinc-200 font-semibold py-3 pl-4">{t.pilots?.name}</td>
                      <td className="text-zinc-500 font-mono py-3">T{t.tramo_num} / P{t.pasada_num}</td>
                      <td className="text-right text-red-400 font-mono font-bold py-3 pr-4">{(t.total_time_ms / 1000).toFixed(3)}s</td>
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
