import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Flag, Clock } from 'lucide-react';

const formatMs = (ms: number) => (ms / 1000).toFixed(3);

export default function Clasificacion() {
  const [championships, setChampionships] = useState<any[]>([]);
  const [rallies, setRallies] = useState<any[]>([]);
  
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [selectedRally, setSelectedRally] = useState<string>('');
  
  const [lapTimes, setLapTimes] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch initial championships
  useEffect(() => {
    let isMounted = true;
    const loadCamps = async () => {
      const { data } = await supabase.from('championships').select('*').order('created_at', { ascending: false });
      if (isMounted && data) setChampionships(data);
    };
    loadCamps();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch rallies when championship changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedCamp) {
       setRallies([]);
       setSelectedRally('');
       return;
    }
    const loadRallies = async () => {
      const { data } = await supabase.from('rallies').select('*').eq('championship_id', selectedCamp).order('created_at', { ascending: false });
      if (isMounted && data) setRallies(data);
    };
    loadRallies();
    return () => { isMounted = false; };
  }, [selectedCamp]);

  // 3. Fetch lap times when rally changes
  const fetchTiempos = async () => {
      if (!selectedRally) {
          setLapTimes([]);
          return;
      }
      try {
        const { data: sesiones } = await supabase.from('rally_sessions').select('id').eq('rally_id', selectedRally);
        const sessionIds = sesiones?.map(s => s.id) || [];
        
        if (sessionIds.length > 0) {
            const { data: tiempos } = await supabase.from('lap_times')
               .select('*, pilots(name), categories(name), rally_sessions(name)')
               .in('session_id', sessionIds);
               
            // Sort perfectly by total_time_ms client side to ensure penalties are calculated in position
            const sorted = tiempos ? tiempos.sort((a,b) => a.total_time_ms - b.total_time_ms) : [];
            setLapTimes(sorted);
        } else {
            setLapTimes([]);
        }
      } catch (err) {
         console.error(err);
      }
  };

  useEffect(() => {
     let isMounted = true;
     fetchTiempos();

     const canal = supabase
      .channel('tiempos-en-directo')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lap_times' },
        (payload) => {
          fetchTiempos();
          setIsUpdating(true);
          setTimeout(() => { if (isMounted) setIsUpdating(false); }, 1500);
        }
      )
      .subscribe();

     return () => {
         isMounted = false;
         supabase.removeChannel(canal);
     };
  }, [selectedRally]);

  return (
    <div className="bg-zinc-950 min-h-screen w-full flex flex-col p-4 md:p-8 items-center">
      <div className="w-full max-w-7xl flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-100 tracking-tight mb-8">
          Monitor de <span className="text-red-600">Clasificación</span>
        </h1>

        {/* Top Bar / Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg w-full max-w-4xl">
           <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2"><Trophy size={16}/> Campeonato</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all shadow-inner"
                value={selectedCamp}
                onChange={(e) => setSelectedCamp(e.target.value)}
              >
                <option value="">Seleccionar Campeonato...</option>
                {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>

           <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2"><Flag size={16}/> Prueba / Rally</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all shadow-inner disabled:opacity-50"
                value={selectedRally}
                onChange={(e) => setSelectedRally(e.target.value)}
                disabled={!selectedCamp}
              >
                <option value="">Seleccionar Prueba...</option>
                {rallies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
           </div>
        </div>

        {/* Data Table */}
        <div className={`overflow-x-auto rounded-xl shadow-2xl bg-zinc-900 border ${isUpdating ? 'border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'border-zinc-800/80'} transition-all duration-300 w-full`}>
           <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                 <tr>
                    <th className="px-6 py-4 text-center">Posición</th>
                    <th className="px-6 py-4">Piloto</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Corte (Sesión)</th>
                    <th className="px-6 py-4 text-right">Penalización</th>
                    <th className="px-6 py-4 text-right">Tiempo Total</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                 {lapTimes.map((lap, index) => (
                    <tr key={lap.id} className="hover:bg-zinc-800/20 transition-colors text-zinc-100">
                       <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-sm shadow-red-900/20' : 'bg-zinc-800 text-zinc-400'}`}>
                             {index + 1}
                          </span>
                       </td>
                       <td className="px-6 py-4 font-bold text-base">{lap.pilots?.name || '-'}</td>
                       <td className="px-6 py-4"><span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium border border-zinc-700 text-zinc-300">{lap.categories?.name || '-'}</span></td>
                       <td className="px-6 py-4 text-zinc-400"><Clock size={14} className="inline mr-2 text-zinc-500"/>{lap.rally_sessions?.name || '-'}</td>
                       <td className="px-6 py-4 text-right font-mono text-amber-500 font-medium">
                         {lap.penalty_ms > 0 ? `+${formatMs(lap.penalty_ms)}s` : '-'}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <span className={`font-mono text-lg tracking-tight font-bold ${index === 0 ? 'text-red-400 drop-shadow-sm' : 'text-zinc-200'}`}>
                           {formatMs(lap.total_time_ms)}
                         </span>
                       </td>
                    </tr>
                 ))}
                 {lapTimes.length === 0 && (
                    <tr>
                       <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                          {selectedRally ? "Aún no hay tiempos registrados en esta prueba." : "Selecciona un Campeonato y una Prueba para filtrar los tiempos en directo."}
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
