import React from 'react';
import { Link } from 'react-router-dom';
import { Flag, Compass, Hash, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePilotData } from '../hooks/usePilotData';

const cardAnim = (i: number) => ({
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay: i * 0.05, ease: 'easeOut' as const },
});

export default function PilotoDashboard({ userId, displayName }: { userId?: string; displayName?: string }) {
  const { myInscriptions, clubs, loading } = usePilotData(userId);

  const recent       = myInscriptions.slice(0, 4);
  const hasData      = myInscriptions.length > 0;
  const activeRallies = clubs.reduce(
    (acc, c) => acc + (c.championships?.reduce(
      (a2, ch) => a2 + (ch.rallies?.filter(r => r.status === 'active').length ?? 0), 0
    ) ?? 0), 0
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pt-4 md:py-8">

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Panel del Piloto</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Hola, <span className="text-brand-500">{displayName || 'Piloto'}</span>
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Pruebas inscritas */}
        <motion.div {...cardAnim(0)}
          className="bg-[#09090b] border border-zinc-800 rounded-lg p-5 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-zinc-500">
            <Flag size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pruebas inscritas</span>
          </div>
          {loading
            ? <div className="h-10 animate-pulse bg-zinc-800 rounded-md" />
            : <span className="text-5xl font-black font-mono text-white">{myInscriptions.length}</span>}
          <Link to="/piloto/mis-pruebas" className="text-xs text-brand-500 hover:text-brand-400 transition-colors mt-auto font-semibold">
            Ver historial →
          </Link>
        </motion.div>

        {/* Pruebas disponibles */}
        <motion.div {...cardAnim(1)}
          className="bg-[#09090b] border border-zinc-800 rounded-lg p-5 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-zinc-500">
            <Compass size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Abiertas ahora</span>
          </div>
          {loading
            ? <div className="h-10 animate-pulse bg-zinc-800 rounded-md" />
            : (
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black font-mono text-white">{activeRallies}</span>
                {activeRallies > 0 && (
                  <span className="text-emerald-400 text-xs font-bold mb-1.5 uppercase tracking-widest">pruebas</span>
                )}
              </div>
            )}
          <Link
            to="/piloto/explorar"
            className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md transition-colors w-fit"
          >
            Explorar <ArrowRight size={13} />
          </Link>
        </motion.div>

        {/* Últimas inscripciones */}
        <motion.div {...cardAnim(2)}
          className="bg-[#09090b] border border-zinc-800 rounded-lg p-5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 text-zinc-500">
            <Hash size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Últimas inscripciones</span>
          </div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[0, 1, 2].map(i => <div key={i} className="h-5 bg-zinc-800 rounded" />)}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-zinc-600 text-sm italic">Sin inscripciones todavía.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-800/60">
              {recent.map(ins => {
                const rallyName = (ins.rallies as any)?.name ?? '—';
                const clubName  = (ins.rallies as any)?.championships?.clubs?.name ?? '';
                return (
                  <li key={ins.id} className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-zinc-200 truncate leading-tight">{rallyName}</p>
                      {clubName && <p className="text-zinc-600 text-xs truncate">{clubName}</p>}
                    </div>
                    {ins.dorsal_num != null && (
                      <span className="font-mono font-black text-brand-400 text-sm shrink-0">
                        #{ins.dorsal_num}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Empty-state CTA — only when no inscriptions and not loading */}
      {!loading && !hasData && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2, ease: 'easeOut' as const }}
          className="border border-dashed border-zinc-800 rounded-lg px-8 py-10 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-10 h-10 bg-brand-600/10 border border-brand-600/20 rounded-lg flex items-center justify-center">
            <Flag size={18} className="text-brand-500" />
          </div>
          <div>
            <p className="text-white font-semibold">Todavía no estás inscrito en ninguna prueba</p>
            <p className="text-zinc-500 text-sm mt-1">Explora los clubs y encuentra tu próximo rally.</p>
          </div>
          <Link
            to="/piloto/explorar"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-md transition-colors"
          >
            <Compass size={14} />
            Explorar pruebas disponibles
          </Link>
        </motion.div>
      )}

    </div>
  );
}
