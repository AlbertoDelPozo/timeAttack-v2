import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '@nextui-org/react';
import { ChevronLeft, Flag, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

type TramoData = { tiempo: string; penalizacion: string };
type ToastMsg = { id: number; text: string; type: 'error' | 'warn' | 'success' };

export default function RaceDashboard({ userId }: { userId?: string }) {
  const { id_prueba } = useParams<{ id_campeonato: string; id_prueba: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const pilotoId = searchParams.get('pilotoId') ?? '';
  const pasada = Number(searchParams.get('pasada') ?? '1');

  const setPilotoId = (id: string) => {
    setSearchParams(prev => {
      const sp = new URLSearchParams(prev);
      sp.set('pilotoId', id);
      return sp;
    }, { replace: true });
  };

  const setPasada = (n: number) => {
    setSearchParams(prev => {
      const sp = new URLSearchParams(prev);
      sp.set('pasada', String(n));
      sp.delete('pilotoId');
      return sp;
    }, { replace: true });
  };

  const [rally, setRally] = useState<{ name: string; stages: number; passes: number } | null>(null);
  const [pilotosInscritos, setPilotosInscritos] = useState<any[]>([]);
  const [pilotosPendientes, setPilotosPendientes] = useState<any[]>([]);
  const [pilotosCompletados, setPilotosCompletados] = useState<any[]>([]);
  const [numTramos, setNumTramos] = useState(1);
  const [numPasadas, setNumPasadas] = useState(1);
  const [uiMode, setUiMode] = useState<'pendientes' | 'edicion'>('pendientes');
  const [tramosData, setTramosData] = useState<Record<number, TramoData>>({});
  const [errorTramos, setErrorTramos] = useState<number[]>([]);
  const [warnedOnce, setWarnedOnce] = useState(false);
  const [lapTimes, setLapTimes] = useState<any[]>([]);
  const [allCats, setAllCats] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const addToast = useCallback((text: string, type: ToastMsg['type'] = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // Rally config
  useEffect(() => {
    if (!id_prueba) return;
    supabase.from('rallies').select('name, stages, passes').eq('id', id_prueba).single()
      .then(({ data }) => {
        if (data) {
          setRally(data);
          setNumTramos(data.stages || 1);
          setNumPasadas(data.passes || 1);
        }
      });
  }, [id_prueba]);

  // Inscriptions
  useEffect(() => {
    if (!id_prueba) return;
    setLoading(true);
    supabase.from('inscriptions')
      .select('pilot_id, category_id, pilots(*), categories(name)')
      .eq('rally_id', id_prueba)
      .then(({ data }) => {
        if (data) {
          const parsed = (data as any[]).map(i => ({
            id: i.pilot_id as string,
            name: (i.pilots?.name as string) || 'Desconocido',
            category: (i.categories?.name as string) || '',
            category_id: i.category_id as number,
            number: (i.pilots?.dorsal as number | null) ?? null,
          })).sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
          setPilotosInscritos(parsed);
        }
        setLoading(false);
      });
  }, [id_prueba]);

  // Lap times (table + exclusion source)
  const fetchLapTimes = useCallback(async () => {
    if (!id_prueba) return;
    const { data } = await supabase.from('lap_times')
      .select('*, pilots(name, dorsal), categories(name)')
      .eq('rally_id', id_prueba)
      .order('created_at', { ascending: false });
    if (data) {
      setLapTimes(data);
      const cats = Array.from(new Set((data as any[]).map(t => t.categories?.name).filter(Boolean))) as string[];
      setAllCats(cats);
    }
  }, [id_prueba]);

  useEffect(() => { fetchLapTimes(); }, [fetchLapTimes]);

  // Pendientes / Completados
  useEffect(() => {
    if (pilotosInscritos.length === 0) return;
    const counts = new Map<string, number>();
    lapTimes.filter(t => t.pasada_num === pasada).forEach(t => {
      counts.set(t.pilot_id, (counts.get(t.pilot_id) || 0) + 1);
    });
    setPilotosPendientes(pilotosInscritos.filter(p => (counts.get(p.id) || 0) < numTramos));
    setPilotosCompletados(pilotosInscritos.filter(p => (counts.get(p.id) || 0) > 0));
  }, [pilotosInscritos, lapTimes, pasada, numTramos]);

  // Auto-fill on pilot select
  useEffect(() => {
    setErrorTramos([]);
    setWarnedOnce(false);
    if (!pilotoId || !id_prueba) { setTramosData({}); return; }
    supabase.from('lap_times').select('*')
      .eq('rally_id', id_prueba).eq('pilot_id', pilotoId).eq('pasada_num', pasada)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const filled: Record<number, TramoData> = {};
          (data as any[]).forEach(lap => {
            filled[lap.tramo_num] = {
              tiempo: lap.track_time_ms > 0 ? (lap.track_time_ms / 1000).toFixed(3) : '',
              penalizacion: lap.penalty_ms ? String(lap.penalty_ms / 1000) : '',
            };
          });
          setTramosData(filled);
        } else {
          setTramosData({});
        }
      });
  }, [pilotoId, id_prueba, pasada]);

  const updateTramo = (tNum: number, key: keyof TramoData, val: string) => {
    setTramosData(prev => ({ ...prev, [tNum]: { ...(prev[tNum] || { tiempo: '', penalizacion: '' }), [key]: val } }));
    setErrorTramos(prev => prev.filter(n => n !== tNum));
  };

  const guardarTiempo = async () => {
    if (!pilotoId || !id_prueba) return;

    // Sanity check: find empty / zero TC fields
    const emptyFields: number[] = [];
    for (let i = 1; i <= numTramos; i++) {
      const t = tramosData[i];
      const ms = Math.round(parseFloat(t?.tiempo || '0') * 1000);
      if (!t?.tiempo || ms === 0) emptyFields.push(i);
    }

    if (emptyFields.length > 0 && !warnedOnce) {
      setErrorTramos(emptyFields);
      setWarnedOnce(true);
      addToast(
        `TC ${emptyFields.join(', ')} vacío o en cero. ¿Abandono oficial? Pulsa de nuevo para guardar igualmente.`,
        'warn'
      );
      return;
    }

    setErrorTramos([]);
    setWarnedOnce(false);

    const selectedPilot = pilotosInscritos.find(p => p.id === pilotoId);
    const catId = (selectedPilot?.category_id as number | null) ?? null;

    try {
      await Promise.all(
        Array.from({ length: numTramos }, (_, i) => i + 1).map(async tNum => {
          const t = tramosData[tNum];
          const trackMs = Math.round(parseFloat(t?.tiempo || '0') * 1000);
          const penMs = Math.round(parseFloat(t?.penalizacion || '0') * 1000);
          const payload = {
            pilot_id: pilotoId,
            category_id: catId,
            tramo_num: tNum,
            pasada_num: pasada,
            track_time_ms: trackMs,
            penalty_ms: penMs,
            total_time_ms: trackMs + penMs,
            club_id: userId,
            rally_id: id_prueba,
          };

          const { data: existing } = await supabase.from('lap_times').select('id')
            .eq('pilot_id', pilotoId).eq('rally_id', id_prueba)
            .eq('tramo_num', tNum).eq('pasada_num', pasada).maybeSingle();

          if (existing) {
            await supabase.from('lap_times').update(payload).eq('id', existing.id);
          } else {
            await supabase.from('lap_times').insert(payload);
          }
        })
      );

      addToast('¡Tiempos registrados con éxito!', 'success');
      setSearchParams(prev => {
        const sp = new URLSearchParams(prev);
        sp.delete('pilotoId');
        return sp;
      }, { replace: true });
      fetchLapTimes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      addToast(`Error: ${msg}`, 'error');
    }
  };

  const filteredLapTimes = filterCat ? lapTimes.filter(t => t.categories?.name === filterCat) : lapTimes;
  const displayPilots = uiMode === 'pendientes' ? pilotosPendientes : pilotosCompletados;
  const selectedPilotName = pilotosInscritos.find(p => p.id === pilotoId)?.name ?? '';

  return (
    <div className="w-full flex flex-col gap-4 max-w-6xl mx-auto pb-16">

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-semibold shadow-xl backdrop-blur ${
            t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
            t.type === 'warn'    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                                   'bg-brand-500/10 border-brand-500/40 text-brand-400'
          }`}>
            {t.type === 'warn'    && <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
            {t.type === 'success' && <CheckCircle2  size={16} className="mt-0.5 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1 text-zinc-500 hover:text-zinc-200 text-sm transition-colors mb-1"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
          <Flag size={24} className="text-brand-600 shrink-0" />
          <span><span className="text-brand-500">Race</span> Dashboard</span>
          {rally && <span className="text-zinc-400 font-medium text-lg">— {rally.name}</span>}
        </h1>
      </div>

      {/* Pasada selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Layers size={14} /> Pasada:
        </span>
        {Array.from({ length: numPasadas }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => setPasada(n)}
            className={`h-9 w-9 rounded-lg font-black text-sm transition-all ${
              n === pasada
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}>
            {n}
          </button>
        ))}
      </div>

      {/* Main 2-col */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* LEFT — pilot grid */}
        <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-lg">
              <button onClick={() => setUiMode('pendientes')}
                className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${uiMode === 'pendientes' ? 'bg-brand-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Pendientes
              </button>
              <button onClick={() => setUiMode('edicion')}
                className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${uiMode === 'edicion' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Edición
              </button>
            </div>
            {loading && <Spinner size="sm" color="danger" />}
          </div>

          {/* Scrollable on mobile, free on desktop */}
          <div className="max-h-56 lg:max-h-none overflow-y-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {displayPilots.map(p => {
                const isSelected = p.id === pilotoId;
                return (
                  <button key={p.id} type="button" onClick={() => setPilotoId(p.id)}
                    className={`h-20 sm:h-24 flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 p-1 ${
                      isSelected
                        ? 'bg-brand-600/10 border-brand-600 shadow-[0_0_15px_-3px_rgba(194,14,77,0.3)]'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                    }`}>
                    <span className={`text-3xl sm:text-4xl font-black font-mono leading-none mb-1 ${isSelected ? 'text-brand-500' : 'text-zinc-300'}`}>
                      {p.number ?? '-'}
                    </span>
                    <span className="text-[10px] text-center font-semibold text-zinc-500 line-clamp-2 leading-tight px-1">
                      {p.name}
                    </span>
                  </button>
                );
              })}
              {!loading && displayPilots.length === 0 && uiMode === 'pendientes' && pilotosInscritos.length > 0 && (
                <div className="col-span-full py-8 flex flex-col items-center gap-2 border-2 border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
                  <Flag className="text-emerald-500" size={24} />
                  <span className="text-emerald-400 font-bold text-sm">Manga Completada</span>
                </div>
              )}
              {!loading && pilotosInscritos.length === 0 && (
                <div className="col-span-full py-8 text-center text-zinc-500 text-sm italic">
                  Sin pilotos inscritos en esta prueba.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — timing form */}
        <div className="w-full lg:w-[460px] shrink-0 bg-[#09090b] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="text-center">
            <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
              {uiMode === 'edicion' ? 'Modo Corrección' : 'Entrada de Telemetría'}
            </div>
            {selectedPilotName && (
              <div className="text-brand-400 font-bold mt-1 text-sm">{selectedPilotName}</div>
            )}
            <div className="text-zinc-700 text-[10px] mt-0.5">FORMATO: SEGUNDOS.MILÉSIMAS</div>
          </div>

          {!pilotoId ? (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-600 text-sm italic">
              Selecciona un piloto
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); guardarTiempo(); }} className="flex flex-col gap-4">
              {Array.from({ length: numTramos }, (_, i) => i + 1).map(tNum => {
                const d = tramosData[tNum] || { tiempo: '', penalizacion: '' };
                const hasError = errorTramos.includes(tNum);
                return (
                  <div key={tNum} className="flex flex-col gap-1 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl relative">
                    <div className="absolute -top-3 left-4 bg-brand-600 text-white font-black px-3 py-0.5 rounded-full text-[10px] italic tracking-tighter">
                      TC {tNum}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number" inputMode="decimal" step="0.001" placeholder="0.000"
                        value={d.tiempo}
                        onChange={e => updateTramo(tNum, 'tiempo', e.target.value)}
                        className={`flex-1 h-14 bg-zinc-950 rounded-xl text-center text-3xl font-black font-mono text-white outline-none transition-all placeholder:text-zinc-900 border ${
                          hasError
                            ? 'border-red-500 ring-1 ring-red-500/50'
                            : 'border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                        }`}
                      />
                      <input
                        type="number" inputMode="numeric" step="0.1" placeholder="+PEN"
                        value={d.penalizacion}
                        onChange={e => updateTramo(tNum, 'penalizacion', e.target.value)}
                        className="w-20 h-14 bg-amber-500/5 border border-amber-500/20 text-center text-lg font-bold font-mono text-amber-500 rounded-xl focus:border-amber-500 outline-none placeholder:text-amber-900/30"
                      />
                    </div>
                    {hasError && (
                      <p className="text-red-400 text-[11px] font-semibold flex items-center gap-1">
                        <AlertTriangle size={11} /> TC {tNum} vacío o en cero
                      </p>
                    )}
                  </div>
                );
              })}

              <button type="submit"
                className={`w-full h-16 font-black text-lg tracking-widest uppercase rounded-2xl transition-all active:scale-[0.98] shadow-lg ${
                  uiMode === 'edicion'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-brand-600 hover:bg-brand-500 text-white'
                }`}>
                {uiMode === 'edicion' ? 'Actualizar Registro' : 'Registrar Pasada'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Lap times table */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Tiempos Registrados</h3>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="h-9 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 rounded-lg focus:border-brand-500 outline-none transition-colors"
          >
            <option value="">Todas las categorías</option>
            {allCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800/60">
          <table className="w-full text-sm border-collapse">
            <thead className="text-xs text-zinc-500 uppercase tracking-wider bg-zinc-950">
              <tr>
                <th className="sticky left-0 bg-zinc-950 py-3 pl-3 pr-4 text-left font-medium whitespace-nowrap z-10 border-b border-zinc-800/60">
                  Piloto
                </th>
                <th className="py-3 px-3 text-left font-medium whitespace-nowrap border-b border-zinc-800/60">Cat.</th>
                <th className="py-3 px-3 text-center font-medium whitespace-nowrap border-b border-zinc-800/60">Pas.</th>
                <th className="py-3 px-3 text-center font-medium whitespace-nowrap border-b border-zinc-800/60">TC</th>
                <th className="py-3 px-3 text-right font-medium whitespace-nowrap border-b border-zinc-800/60">Pista (s)</th>
                <th className="py-3 px-3 text-right font-medium whitespace-nowrap border-b border-zinc-800/60">Pen.</th>
                <th className="py-3 px-3 text-right font-medium whitespace-nowrap border-b border-zinc-800/60">Total (s)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLapTimes.map(t => (
                <tr key={t.id} className="border-t border-zinc-800/40 hover:bg-zinc-900/50 transition-colors">
                  <td className="sticky left-0 bg-zinc-950 py-3 pl-3 pr-4 font-semibold text-zinc-200 whitespace-nowrap z-10">
                    <span className="text-zinc-500 font-mono text-xs mr-2">{t.pilots?.dorsal || '-'}</span>
                    {t.pilots?.name}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 text-xs whitespace-nowrap">{t.categories?.name}</td>
                  <td className="py-3 px-3 text-center text-zinc-500 font-mono text-xs">P{t.pasada_num}</td>
                  <td className="py-3 px-3 text-center text-zinc-500 font-mono text-xs">TC{t.tramo_num}</td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-200">
                    {t.track_time_ms ? (t.track_time_ms / 1000).toFixed(3) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-500 text-xs">
                    {t.penalty_ms > 0 ? `+${(t.penalty_ms / 1000).toFixed(1)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-zinc-100">
                    {t.total_time_ms ? (t.total_time_ms / 1000).toFixed(3) : '—'}
                  </td>
                </tr>
              ))}
              {filteredLapTimes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-600 italic text-sm">
                    Sin tiempos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
