import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Flag, Clock, Layers } from 'lucide-react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { motion, AnimatePresence } from 'framer-motion';

const formatMsToTime = (ms: number) => {
  if (!ms || ms === 0) return "00:00.000";
  const numMs = Math.abs(ms);
  const isNeg = ms < 0 ? "-" : "";
  const minutes = Math.floor(numMs / 60000);
  const seconds = Math.floor((numMs % 60000) / 1000);
  const milliseconds = numMs % 1000;
  return `${isNeg}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

interface PilotData {
  pilot_id: string;
  name: string;
  category: string;
  tiempo_pasada_actual: number;
  acumulado_anterior: number;
  penalizacion_total: number;
  total_general: number;
  tramos: Record<number, number>;
  diferencia?: number;
  is_scratch?: boolean;
}

type ScratchData = { tc: Record<number, number>; total: number };

function computeGlobalScratch(pilots: PilotData[]): ScratchData {
  const tc: Record<number, number> = {};
  let total = Infinity;
  pilots.forEach(p => {
    Object.entries(p.tramos).forEach(([k, ms]) => {
      const n = Number(k);
      if (ms > 0 && (!tc[n] || ms < tc[n])) tc[n] = ms;
    });
    if (p.total_general > 0 && p.total_general < total) total = p.total_general;
  });
  return { tc, total: total === Infinity ? 0 : total };
}

function computeCategoryScratch(pilots: PilotData[]): Record<string, ScratchData> {
  const map: Record<string, ScratchData> = {};
  pilots.forEach(p => {
    if (!map[p.category]) map[p.category] = { tc: {}, total: Infinity };
    Object.entries(p.tramos).forEach(([k, ms]) => {
      const n = Number(k);
      if (ms > 0 && (!map[p.category].tc[n] || ms < map[p.category].tc[n]))
        map[p.category].tc[n] = ms;
    });
    if (p.total_general > 0 && p.total_general < map[p.category].total)
      map[p.category].total = p.total_general;
  });
  Object.values(map).forEach(s => { if (s.total === Infinity) s.total = 0; });
  return map;
}

const CAT_COLORS = [
  'text-blue-400', 'text-green-400', 'text-amber-400', 'text-cyan-400',
  'text-rose-400', 'text-orange-400', 'text-teal-400', 'text-indigo-400'
];

function getCategoryColor(category: string, orderedCats: string[]): string {
  const idx = orderedCats.indexOf(category);
  return idx >= 0 ? CAT_COLORS[idx % CAT_COLORS.length] : 'text-zinc-300';
}

export default function Clasificacion() {
  const [championships, setChampionships] = useState<any[]>([]);
  const [allRallies, setAllRallies] = useState<any[]>([]);

  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [selectedRally, setSelectedRally] = useState<string>('');
  const [selectedPasada, setSelectedPasada] = useState<string>('1');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [maxPasadas, setMaxPasadas] = useState<number>(1);
  const [maxTramos, setMaxTramos] = useState<number>(1);

  const [allLapTimes, setAllLapTimes] = useState<any[]>([]);
  const [processedClasi, setProcessedClasi] = useState<PilotData[]>([]);

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.from('championships').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (isMounted && data) setChampionships(data); });
    supabase.from('rallies').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (isMounted && data) setAllRallies(data); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    setSelectedRally('');
  }, [selectedCamp]);

  // Reset category filter when rally changes
  useEffect(() => {
    setSelectedCategory('');
  }, [selectedRally]);

  const filteredRallies = allRallies.filter(r => r.championship_id === selectedCamp);

  const fetchRallyData = async () => {
    if (!selectedRally) {
      setAllLapTimes([]);
      setMaxPasadas(1);
      return;
    }
    try {
      const { data: config } = await supabase.from('rallies').select('passes, stages').eq('id', selectedRally).maybeSingle();
      let maxP = config?.passes || 1;
      let maxT = config?.stages || 1;

      const { data: sesiones } = await supabase.from('rally_sessions').select('id').eq('rally_id', selectedRally);
      const sessionIds = sesiones?.map(s => s.id) || [];

      let query = supabase.from('lap_times').select('*, pilots(name), categories(name)');
      if (sessionIds.length > 0) {
        query = query.or(`rally_id.eq.${selectedRally},session_id.in.(${sessionIds.join(',')})`);
      } else {
        query = query.eq('rally_id', selectedRally);
      }

      const { data: tiempos, error: errTiempos } = await query;

      console.log("Supabase Tiempos Error:", errTiempos);
      console.log("Supabase Tiempos Data:", tiempos);

      const dynamicMax = tiempos && tiempos.length > 0 ? Math.max(...tiempos.map(t => t.pasada_num || 1), maxP) : maxP;
      setMaxPasadas(dynamicMax);

      const dynamicMaxT = tiempos && tiempos.length > 0 ? Math.max(...tiempos.map(t => t.tramo_num || 1), maxT) : maxT;
      setMaxTramos(dynamicMaxT);

      setAllLapTimes(tiempos || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchRallyData();

    const canal = supabase
      .channel(`tiempos-en-directo-cls-${selectedRally}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lap_times' }, () => {
        fetchRallyData();
        setIsUpdating(true);
        setTimeout(() => { if (isMounted) setIsUpdating(false); }, 1500);
      }).subscribe();

    return () => { isMounted = false; supabase.removeChannel(canal); };
  }, [selectedRally]);

  useEffect(() => {
    if (!allLapTimes.length) {
      setProcessedClasi([]);
      return;
    }

    const pasadaInt = parseInt(selectedPasada, 10);
    const pilotMap = new Map<string, PilotData>();

    allLapTimes.forEach(t => {
      if (t.pasada_num <= pasadaInt) {
        const pid = t.pilot_id;
        if (!pilotMap.has(pid)) {
          pilotMap.set(pid, {
            pilot_id: pid,
            name: t.pilots?.name || 'Piloto',
            category: t.categories?.name || 'N/A',
            tiempo_pasada_actual: 0,
            acumulado_anterior: 0,
            penalizacion_total: 0,
            total_general: 0,
            tramos: {}
          });
        }
        const pData = pilotMap.get(pid)!;

        pData.penalizacion_total += t.penalty_ms || 0;
        pData.total_general += t.total_time_ms || 0;

        if (t.pasada_num === pasadaInt) {
          pData.tiempo_pasada_actual += t.total_time_ms || 0;
          if (t.tramo_num) {
            pData.tramos[t.tramo_num] = (pData.tramos[t.tramo_num] || 0) + (t.track_time_ms || t.total_time_ms || 0);
          }
        } else if (t.pasada_num < pasadaInt) {
          pData.acumulado_anterior += t.total_time_ms || 0;
        }
      }
    });

    let resultados = Array.from(pilotMap.values()).filter(p => p.total_general > 0);

    let bestPasadaMs = Infinity;
    resultados.forEach(p => {
      if (p.tiempo_pasada_actual > 0 && p.tiempo_pasada_actual < bestPasadaMs) {
        bestPasadaMs = p.tiempo_pasada_actual;
      }
    });

    resultados.sort((a, b) => a.total_general - b.total_general);
    const leaderTotal = resultados[0]?.total_general || 0;

    resultados = resultados.map(p => ({
      ...p,
      diferencia: p.total_general - leaderTotal,
      is_scratch: p.tiempo_pasada_actual === bestPasadaMs
    }));

    setProcessedClasi(resultados);
  }, [allLapTimes, selectedPasada]);

  // Derived scratch data — computed from ALL pilots, not the filtered view
  const globalScratch   = computeGlobalScratch(processedClasi);
  const categoryScratch = computeCategoryScratch(processedClasi);
  const orderedCats     = [...new Set(processedClasi.map(p => p.category))].sort();

  const pInt = parseInt(selectedPasada, 10);

  const filteredTableData = (selectedCategory
    ? processedClasi.filter(p => p.category === selectedCategory)
    : processedClasi
  ).map((row, idx) => ({ ...row, id: row.pilot_id, index: idx }));

  const tramosCols = Array.from({ length: maxTramos }, (_, i) => ({
    key: `tc${i + 1}`,
    label: `TC${i + 1}`,
    align: "end" as const
  }));

  const columns = [
    { key: "pos",   label: "POS",            align: "center" as const },
    { key: "pilot", label: "PILOTO",          align: "start"  as const },
    ...tramosCols,
    { key: "pen",   label: "PENALIZACIÓN",    align: "end"    as const },
    ...(pInt > 1 ? [{ key: "prev", label: "ACUM. ANTERIOR", align: "end" as const }] : []),
    { key: "tot",   label: "TOTAL GENERAL",   align: "end"    as const }
  ];

  const renderCell = (lap: any, columnKey: React.Key) => {
    switch (columnKey) {
      case "pos":
        return (
          <div className="flex justify-center w-full">
            <motion.div layout id={`pos-${lap.id}`}>
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${lap.index === 0 ? 'bg-brand-500/20 text-brand-500 border border-brand-500/50 shadow-sm shadow-brand-900/20' : 'bg-zinc-800 text-zinc-400'}`}>
                {lap.index + 1}
              </span>
            </motion.div>
          </div>
        );

      case "pilot":
        return (
          <motion.div layout id={`info-${lap.id}`} className="flex flex-col">
            <span className="font-bold text-base font-sans leading-none">{lap.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-[2px] bg-zinc-900 rounded-md text-[10px] uppercase font-bold border border-zinc-800 text-zinc-500">{lap.category}</span>
              {lap.index > 0 && lap.diferencia && lap.diferencia > 0 ? (
                <span className="text-[11px] font-mono font-bold text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">+{formatMsToTime(lap.diferencia)}</span>
              ) : null}
            </div>
          </motion.div>
        );

      case "prev":
        return (
          <div className="text-right w-full">
            <motion.div layout id={`prev-${lap.id}`} className="text-zinc-500">{formatMsToTime(lap.acumulado_anterior)}</motion.div>
          </div>
        );

      case "pen":
        return (
          <div className="text-right w-full">
            <motion.div layout id={`pen-${lap.id}`} className="text-amber-500 font-bold">
              {lap.penalizacion_total > 0 ? `+${formatMsToTime(lap.penalizacion_total)}` : '-'}
            </motion.div>
          </div>
        );

      case "tot": {
        const is_total_global = lap.total_general > 0 && lap.total_general === globalScratch.total;
        const is_total_cat    = !is_total_global && lap.total_general > 0 && lap.total_general === categoryScratch[lap.category]?.total;
        const totalColor = is_total_global
          ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]'
          : is_total_cat
            ? getCategoryColor(lap.category, orderedCats)
            : lap.index === 0
              ? 'text-brand-500 drop-shadow-[0_0_5px_rgba(194,14,77,0.4)]'
              : 'text-white';
        return (
          <div className="flex justify-end w-full bg-zinc-950 p-[10px] -my-3 -mr-3 rounded-r-lg border-l border-zinc-800/50">
            <motion.div layout id={`tot-${lap.id}`} className="flex flex-col items-end">
              <span className={`text-xl tracking-tight font-black ${totalColor}`}>
                {formatMsToTime(lap.total_general)}
              </span>
            </motion.div>
          </div>
        );
      }

      default:
        if (typeof columnKey === 'string' && columnKey.startsWith('tc')) {
          const tramoNum = parseInt(columnKey.replace('tc', ''), 10);
          const tMs = lap.tramos[tramoNum];

          const is_global = tMs > 0 && tMs === globalScratch.tc[tramoNum];
          const is_cat    = !is_global && tMs > 0 && tMs === categoryScratch[lap.category]?.tc[tramoNum];
          const tcColor   = is_global
            ? 'text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]'
            : is_cat
              ? `${getCategoryColor(lap.category, orderedCats)} font-bold`
              : 'text-zinc-300';

          return (
            <div className="text-right w-full">
              <motion.div layout id={`${columnKey}-${lap.id}`} className={tcColor}>
                {tMs && tMs > 0 ? formatMsToTime(tMs) : '-'}
              </motion.div>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen w-full flex flex-col p-4 md:p-8 items-center">
      <div className="w-full max-w-7xl flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-100 tracking-tight mb-8">
          Monitor de <span className="text-brand-600">Clasificación</span>
        </h1>

        {/* Top Bar / Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 p-5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-lg w-full max-w-5xl items-end justify-center">
          <div className="flex-1 w-full md:w-auto">
            <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider mb-2"><Trophy size={14} /> Campeonato</label>
            <select
              className="w-full h-[44px] bg-[#09090b] border border-zinc-800 text-zinc-100 px-3 rounded-lg focus:border-brand-500 focus:ring-0 focus:outline-none outline-none transition-all shadow-sm"
              value={selectedCamp}
              onChange={(e) => setSelectedCamp(e.target.value)}
            >
              <option value="">Seleccionar Campeonato...</option>
              {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider mb-2"><Flag size={14} /> Rally</label>
            <select
              className="w-full h-[44px] bg-[#09090b] border border-zinc-800 text-zinc-100 px-3 rounded-lg focus:border-brand-500 focus:ring-0 focus:outline-none outline-none transition-all shadow-sm disabled:opacity-50"
              value={selectedRally}
              onChange={(e) => setSelectedRally(e.target.value)}
              disabled={!selectedCamp}
            >
              <option value="">Seleccionar Prueba...</option>
              {filteredRallies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="w-full md:w-48 lg:w-64">
            <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider mb-2"><Layers size={14} /> Pasada</label>
            <select
              className="w-full h-[44px] bg-[#09090b] border border-zinc-800 text-zinc-100 px-3 rounded-lg focus:border-brand-500 focus:ring-0 focus:outline-none outline-none transition-all shadow-sm disabled:opacity-50"
              value={selectedPasada}
              onChange={(e) => setSelectedPasada(e.target.value)}
              disabled={!selectedRally || maxPasadas === 0}
            >
              {Array.from({ length: maxPasadas }, (_, i) => i + 1).map(num => (
                <option key={String(num)} value={String(num)}>
                  Pasada {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category filter — only shown when multiple categories exist */}
        {orderedCats.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4 w-full max-w-5xl">
            {(['', ...orderedCats] as string[]).map(cat => (
              <button
                key={cat || '__all'}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow shadow-brand-900/40'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {cat || 'General'}
              </button>
            ))}
          </div>
        )}

        {/* Data Table */}
        <div className={`w-full overflow-x-auto pb-4 rounded-xl shadow-2xl transition-all duration-300 mb-20 ${isUpdating ? 'shadow-[0_0_20px_rgba(194,14,77,0.2)]' : ''}`}>
          <Table
            aria-label="Clasificación General"
            selectionMode="single"
            classNames={{
              wrapper: "bg-[#09090b] border border-zinc-800 p-0 overflow-x-auto rounded-xl",
              th: "bg-zinc-950 text-brand-500 font-bold uppercase tracking-wider py-4 border-b border-zinc-800",
              td: "text-zinc-300 font-mono py-3 font-semibold",
              emptyWrapper: "text-zinc-500 italic py-12 h-[200px]"
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  align={column.align}
                  className={
                    column.key === "pos"   ? "w-16 text-center" :
                    column.key === "pilot" ? "sticky left-0 z-20 bg-zinc-950 border-r border-zinc-800 min-w-[180px]" :
                    column.key === "tot"   ? "bg-zinc-950 text-brand-600 font-black" :
                    ""
                  }
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={filteredTableData} emptyContent={selectedRally ? "Generando Telemetría... Aún no hay tiempos." : "Selecciona Campeonato y Prueba."}>
              {(item) => (
                <TableRow key={item.id} className="hover:bg-zinc-800/30 transition-all duration-300 border-b border-zinc-800/50 last:border-none">
                  {(columnKey) => (
                    <TableCell
                      className={`p-3${String(columnKey) === 'pilot' ? ' sticky left-0 z-10 bg-[#09090b] border-r border-zinc-800/60 whitespace-nowrap' : ''}`}
                    >
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
