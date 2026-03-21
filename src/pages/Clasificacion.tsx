import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Helper to format ms to sec.ms
const formatMs = (ms: number) => {
  return (ms / 1000).toFixed(3);
};

export default function Clasificacion() {
  const [filtroCategoria, setFiltroCategoria] = useState('Todas las categorías');
  const [pasadaSeleccionada, setPasadaSeleccionada] = useState(1);
  const [config, setConfig] = useState({ num_tramos: 1, num_pasadas: 1 });
  const [tiemposReales, setTiemposReales] = useState<any[]>([]);

  useEffect(() => {
    const fetchTiempos = async () => {
      // 1. Fetch config setup
      const { data: configData } = await supabase.from('race_config').select('*').eq('id', 1).single();
      if (configData) {
        setConfig({ num_tramos: configData.num_tramos, num_pasadas: configData.num_pasadas });
      }

      const { data, error } = await supabase
        .from('lap_times')
        .select('*, pilots(name, dorsal), categories(name)');

      if (error) {
        console.error('Error fetching tiempos:', error);
      } else {
        setTiemposReales(data || []);
      }
    };

    fetchTiempos();

    // 2. Suscribirse a cambios en tiempo real
    const canal = supabase
      .channel('tiempos-en-directo')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lap_times' },
        (payload) => {
          // Volver a cargar los tiempos de la DB cuando detecte un cambio
          console.log('Cambio detectado en lap_times. Recargando...', payload);
          fetchTiempos();
        }
      )
      .subscribe();

    // Cleanup function: quitar suscripción al desmontar/cambiar de página
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // Filtrar y mapear los datos listos para renderizar
  const procesarClasificacion = () => {
    // 1. Agrupar por piloto
    const agrupados = new Map();

    tiemposReales.forEach((row) => {
      const pilotId = row.pilot_id;
      if (!agrupados.has(pilotId)) {
        agrupados.set(pilotId, {
          id: pilotId,
          piloto: row.pilots?.name || 'Desconocido',
          dorsal: row.pilots?.dorsal || null, // from updated select
          categoria: row.categories?.name || 'Desconocida',
          tiempos: []
        });
      }
      agrupados.get(pilotId).tiempos.push(row);
    });

    // 2. Calcular acumulados y totales
    const clasificacion = Array.from(agrupados.values()).map((p) => {
      // Acumulado de pasadas anteriores
      const acumuladoAnterior = p.tiempos
        .filter((t: any) => t.pasada_num < pasadaSeleccionada)
        .reduce((sum: number, t: any) => sum + t.total_time_ms, 0);

      // Tiempos de la pasada actual
      const tiemposPasadaActual = p.tiempos.filter((t: any) => t.pasada_num === pasadaSeleccionada);
      
      let totalPasadaActual = 0;
      const tramosActuales: Record<number, any> = {};

      tiemposPasadaActual.forEach((t: any) => {
        tramosActuales[t.tramo_num] = t;
        totalPasadaActual += t.total_time_ms;
      });

      const totalGeneral = acumuladoAnterior + totalPasadaActual;
      const tieneTiempos = tiemposPasadaActual.length > 0;

      return {
        ...p,
        acumuladoAnterior,
        totalPasadaActual,
        totalGeneral,
        tramosActuales,
        tieneTiempos
      };
    });

    // 3. Filtrar por categoría y si tienen tiempos, luego ordenar
    const filtradosYOrdenados = clasificacion
      .filter((p) => {
        if (filtroCategoria !== 'Todas las categorías' && p.categoria !== filtroCategoria) return false;
        return p.tieneTiempos;
      })
      .sort((a, b) => a.totalGeneral - b.totalGeneral);

    // 4. Calcular diferencias y posiciones
    return filtradosYOrdenados.map((row, index, arr) => {
      const bestTimeMs = arr[0].totalGeneral;
      const diffMs = row.totalGeneral - bestTimeMs;

      return {
        ...row,
        posicion: index + 1,
        diferencia: diffMs === 0 ? '-' : `+${formatMs(diffMs)}`,
      };
    });
  };

  const datosFiltrados = procesarClasificacion();

  return (
    <div className="bg-[#171717] min-h-screen p-2 md:p-8 w-full flex flex-col items-center">
      
      {/* Título Principal */}
      <h1 className="text-3xl md:text-5xl font-extrabold text-center text-base-content mb-4 tracking-tight drop-shadow-sm">
        Clasificación General
      </h1>

      {/* Selectores de Filtros */}
      <div className="w-full max-w-2xl mb-8 flex flex-col md:flex-row items-center gap-6 justify-center bg-[#1e1e1e] p-4 rounded-2xl border border-[#333333] shadow-lg">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="text-lg font-semibold whitespace-nowrap text-[#a1a1aa]">Pasada:</label>
          <select 
            className="select select-bordered select-md flex-1 text-base shadow-sm rounded-xl focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none bg-[#121212] border-[#333333] text-[#ededed]"
            value={pasadaSeleccionada}
            onChange={(e) => setPasadaSeleccionada(Number(e.target.value))}
          >
            {Array.from({ length: config.num_pasadas }, (_, i) => i + 1).map(num => (
              <option key={`opt-p-${num}`} value={num}>Pasada {num}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="text-lg font-semibold whitespace-nowrap text-[#a1a1aa]">Categoría:</label>
          <select 
            className="select select-bordered select-md flex-1 text-base shadow-sm rounded-xl focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none bg-[#121212] border-[#333333] text-[#ededed]"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="Todas las categorías">Todas las categorías</option>
            <option value="WRC">WRC</option>
            <option value="Super N">Super N</option>
            <option value="Clásicos">Clásicos</option>
          </select>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="w-full overflow-x-auto rounded-2xl md:rounded-3xl shadow-2xl bg-[#1e1e1e] border border-[#333333]">
        <table className="table table-sm w-full whitespace-nowrap text-xs md:text-sm">
          {/* Header */}
          <thead className="bg-[#1e1e1e] text-[#a1a1aa] text-xs md:text-sm border-b border-[#333333] tracking-tight">
            <tr>
              <th className="text-center w-20">Posición</th>
              <th className="text-center w-16">Dorsal</th>
              <th>Piloto</th>
              <th>Categoría</th>
              {pasadaSeleccionada > 1 && <th className="text-right">Acum. Ant.</th>}
              {Array.from({ length: config.num_tramos }, (_, i) => i + 1).map(num => (
                <th key={`th-tramo-${num}`} className="text-right text-[#a1a1aa]">T{num}</th>
              ))}
              <th className="text-right">Total Pasada</th>
              <th className="text-right text-[#ededed]">Total General</th>
              <th className="text-right">Diferencia</th>
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="text-sm">
            {datosFiltrados.map((row) => {
              // Categoría -> Color de Badge dinámico
              let badgeClass = "badge-neutral";
              if (row.categoria.toUpperCase().includes('WRC')) badgeClass = "badge-error"; // Rojo
              else if (row.categoria.toUpperCase().includes('CLÁSICOS') || row.categoria.toUpperCase().includes('CLASICOS')) badgeClass = "badge-info"; // Azul
              else if (row.categoria.toUpperCase().includes('INFANTIL')) badgeClass = "badge-success"; // Verde
              else if (row.categoria.toUpperCase().includes('SUPER N')) badgeClass = "badge-secondary";

              return (
              <tr key={row.id} className="hover:bg-[#2a2a2a] transition-colors border-none even:bg-[#262626]/40 odd:bg-transparent">
                
                {/* 1. Posición */}
                <td className="text-center font-bold px-2 py-1 md:px-4 md:py-2 h-full align-middle">
                  {row.posicion === 1 ? (
                    <div className="mx-auto w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                      <span className="text-2xl drop-shadow-md" title="Oro">🥇</span>
                    </div>
                  ) : row.posicion === 2 ? (
                    <div className="mx-auto w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg shadow-gray-400/20">
                      <span className="text-xl drop-shadow-md" title="Plata">🥈</span>
                    </div>
                  ) : row.posicion === 3 ? (
                    <div className="mx-auto w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-lg shadow-amber-700/20">
                      <span className="text-xl drop-shadow-md" title="Bronce">🥉</span>
                    </div>
                  ) : (
                    <span className="text-lg text-[#a1a1aa]">{row.posicion}</span>
                  )}
                </td>

                {/* 2. Dorsal Premium */}
                <td className="text-center px-2 py-1 md:px-4 md:py-2 align-middle">
                  <div className="mx-auto w-8 h-8 bg-gradient-to-br from-[#DA0037] to-[#8b0022] rounded-full flex items-center justify-center shadow-md shadow-[#DA0037]/20 border border-[#DA0037]/50">
                    <span className="text-[#ededed] font-mono font-bold text-sm">{row.dorsal || '-'}</span>
                  </div>
                </td>

                {/* 3. Piloto */}
                <td className={`font-bold px-2 py-1 md:px-4 md:py-2 align-middle ${row.posicion === 1 ? 'text-2xl text-[#DA0037] drop-shadow-sm tracking-tight' : 'text-lg text-[#ededed]'}`}>
                  {row.piloto}
                </td>

                {/* 4. Categoría */}
                <td className="px-2 py-1 md:px-4 md:py-2 align-middle">
                  <span className={`badge ${badgeClass} badge-sm font-bold border-none rounded-full px-2`}>{row.categoria}</span>
                </td>

                {/* 5. Acumulado Anterior (Condicional) */}
                {pasadaSeleccionada > 1 && (
                  <td className="text-right font-mono text-sm text-[#a1a1aa] px-2 py-1 md:px-4 md:py-2 align-middle opacity-80">
                    {row.acumuladoAnterior > 0 ? formatMs(row.acumuladoAnterior) : '-'}
                  </td>
                )}

                {/* 6. Tramos Dinámicos */}
                {Array.from({ length: config.num_tramos }, (_, i) => i + 1).map(num => {
                  const tramoData = row.tramosActuales[num];
                  return (
                    <td key={`tramo-data-${num}`} className="text-right font-mono text-[#ededed] text-sm px-2 py-1 md:px-4 md:py-2 align-middle">
                      {tramoData ? (
                        <div className="flex flex-col items-end">
                          <span>{formatMs(tramoData.track_time_ms)}</span>
                          {tramoData.penalty_ms > 0 && (
                            <span className="text-error text-xs font-bold leading-none mt-1">
                              (+{(tramoData.penalty_ms / 1000).toFixed(1)}s)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#444444]">-</span>
                      )}
                    </td>
                  );
                })}

                {/* 7. Total Pasada Actual */}
                <td className="text-right font-mono text-lg text-[#ededed] px-2 py-1 md:px-4 md:py-2 align-middle font-semibold">
                  {row.totalPasadaActual > 0 ? formatMs(row.totalPasadaActual) : '-'}
                </td>

                {/* 8. Total General (Estilo LED) */}
                <td className="text-right px-2 py-1 md:px-4 md:py-2 align-middle">
                  <span className={`inline-block px-3 py-1 bg-[#0a0a0a] rounded-lg border border-[#333333] font-mono font-black ${row.posicion === 1 ? 'text-2xl text-[#ededed] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-xl text-[#DA0037] drop-shadow-[0_0_5px_rgba(218,0,55,0.4)]'}`}>
                    {formatMs(row.totalGeneral)}
                  </span>
                </td>

                {/* 9. Diferencia */}
                <td className="text-right font-mono text-lg text-amber-500 px-2 py-1 md:px-4 md:py-2 font-bold align-middle">
                  {row.diferencia}
                </td>
              </tr>
              );
            })}
            
            {/* Mensaje si no hay resultados */}
            {datosFiltrados.length === 0 && (
              <tr>
                <td colSpan={config.num_tramos + (pasadaSeleccionada > 1 ? 1 : 0) + 7} className="text-center py-8 text-base-content/50 italic">
                  No hay resultados para esta categoría y pasada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
