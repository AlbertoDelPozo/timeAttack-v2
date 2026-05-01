import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Flag, Trophy, Zap } from 'lucide-react';
import { Input } from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePilotData } from '../hooks/usePilotData';
import { InscripcionModal } from '../components/pilot/InscripcionModal';

// ── Status badge config ────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; cls: string }> = {
  active:   { label: 'Inscripciones abiertas', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  draft:    { label: 'Borrador',               cls: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
  finished: { label: 'Finalizada',             cls: 'bg-zinc-800 text-zinc-600 border-zinc-700' },
};

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto' as const, opacity: 1, transition: { duration: 0.2,  ease: 'easeOut' as const } },
  exit:    { height: 0,               opacity: 0, transition: { duration: 0.15, ease: 'easeIn'  as const } },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RallyRef {
  id: string;
  name: string;
  championship_id: string;
  clubId: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PilotoExplorar({
  userId,
  displayName,
}: {
  userId?: string;
  displayName?: string;
}) {
  const { clubs, myInscriptions, inscribirPiloto, loading } = usePilotData(userId);

  const [search,        setSearch]        = useState('');
  const [expandedClub,  setExpandedClub]  = useState<string | null>(null);
  const [expandedChamp, setExpandedChamp] = useState<string | null>(null);
  const [selectedRally, setSelectedRally] = useState<RallyRef | null>(null);

  if (!userId) return null;

  const isInscribed = (rallyId: string) => myInscriptions.some(i => i.rally_id === rallyId);

  const getDorsal = (rallyId: string): number | null =>
    myInscriptions.find(i => i.rally_id === rallyId)?.dorsal_num ?? null;

  const q = search.toLowerCase().trim();

  // Auto-expand first matching club + championship when searching
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!q) { setExpandedClub(null); setExpandedChamp(null); return; }
    const matchClub = clubs.find(c =>
      c.name.toLowerCase().includes(q) ||
      c.championships?.some(ch =>
        ch.name.toLowerCase().includes(q) ||
        ch.rallies?.some(r => r.name.toLowerCase().includes(q))
      )
    );
    if (!matchClub) return;
    setExpandedClub(matchClub.id);
    const matchChamp = matchClub.championships?.find(ch =>
      ch.name.toLowerCase().includes(q) ||
      ch.rallies?.some(r => r.name.toLowerCase().includes(q))
    );
    if (matchChamp) setExpandedChamp(matchChamp.id);
  }, [search, clubs]);

  const filteredClubs = clubs.filter(c =>
    !q ||
    c.name.toLowerCase().includes(q) ||
    c.championships?.some(ch =>
      ch.name.toLowerCase().includes(q) ||
      ch.rallies?.some(r => r.name.toLowerCase().includes(q))
    )
  );

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pt-4 md:py-8">

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Piloto</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Explorar Pruebas</h1>
        <p className="text-zinc-500 text-sm">Busca un club e inscríbete en sus rallies activos.</p>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar club, campeonato o prueba..."
        variant="bordered"
        startContent={<Search size={14} className="text-zinc-600 shrink-0" />}
        value={search}
        onValueChange={setSearch}
        classNames={{
          input:        "text-zinc-100",
          inputWrapper: "border-zinc-800 bg-[#09090b] focus-within:border-brand-500",
        }}
      />

      {/* Club list */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-lg" />
          ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-zinc-500 text-sm">
            {q ? `Sin resultados para "${search}".` : 'No hay clubs disponibles todavía.'}
          </p>
          {q && (
            <button onClick={() => setSearch('')} className="text-xs text-brand-500 hover:text-brand-400 transition-colors">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredClubs.map(club => {
            const activeRallyCount = club.championships?.reduce(
              (acc, ch) => acc + (ch.rallies?.filter(r => r.status === 'active').length ?? 0), 0
            ) ?? 0;

            return (
              <div key={club.id} className="bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden">

                {/* ── Club header ── */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-900/60 transition-colors"
                  onClick={() => setExpandedClub(expandedClub === club.id ? null : club.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-brand-600 rounded-md flex items-center justify-center shrink-0">
                      <span className="text-white font-black text-xs">{club.name[0].toUpperCase()}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">{club.name}</p>
                      <p className="text-zinc-600 text-xs">{club.championships?.length ?? 0} campeonatos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeRallyCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <Zap size={9} />
                        {activeRallyCount} {activeRallyCount === 1 ? 'abierta' : 'abiertas'}
                      </span>
                    )}
                    {expandedClub === club.id
                      ? <ChevronDown size={15} className="text-zinc-500 shrink-0" />
                      : <ChevronRight size={15} className="text-zinc-500 shrink-0" />}
                  </div>
                </button>

                {/* ── Championships ── */}
                <AnimatePresence>
                  {expandedClub === club.id && (
                    <motion.div variants={collapse} initial="initial" animate="animate" exit="exit"
                      className="overflow-hidden border-t border-zinc-800/60"
                    >
                      {!club.championships?.length ? (
                        <p className="text-zinc-600 text-xs italic px-6 py-4">Sin campeonatos.</p>
                      ) : club.championships.map(champ => {
                        const champActiveCount = champ.rallies?.filter(r => r.status === 'active').length ?? 0;
                        return (
                          <div key={champ.id} className="border-b border-zinc-800/40 last:border-0">

                            {/* Championship header */}
                            <button
                              className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-zinc-900/40 transition-colors"
                              onClick={() => setExpandedChamp(expandedChamp === champ.id ? null : champ.id)}
                            >
                              <div className="flex items-center gap-2">
                                <Trophy size={13} className="text-brand-500 shrink-0" />
                                <span className="text-zinc-200 text-sm font-medium">{champ.name}</span>
                                <span className="text-zinc-600 text-xs">({champ.rallies?.length ?? 0})</span>
                                {champActiveCount > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                    {champActiveCount} activa{champActiveCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {expandedChamp === champ.id
                                ? <ChevronDown size={13} className="text-zinc-600 shrink-0" />
                                : <ChevronRight size={13} className="text-zinc-600 shrink-0" />}
                            </button>

                            {/* ── Rallies ── */}
                            <AnimatePresence>
                              {expandedChamp === champ.id && (
                                <motion.div variants={collapse} initial="initial" animate="animate" exit="exit"
                                  className="overflow-hidden"
                                >
                                  {!champ.rallies?.length ? (
                                    <p className="text-zinc-600 text-xs italic px-9 py-3">Sin pruebas en este campeonato.</p>
                                  ) : champ.rallies.map(rally => {
                                    const st       = STATUS[rally.status ?? 'draft'] ?? STATUS.draft;
                                    const inscribed = isInscribed(rally.id);
                                    const dorsal    = getDorsal(rally.id);
                                    return (
                                      <div key={rally.id}
                                        className="flex items-center justify-between px-9 py-3 border-t border-zinc-800/30 hover:bg-zinc-900/30 transition-colors gap-4"
                                      >
                                        <div className="flex items-start gap-3 min-w-0">
                                          <Flag size={13} className="text-zinc-600 shrink-0 mt-0.5" />
                                          <div className="min-w-0">
                                            <p className="text-zinc-100 text-sm font-medium truncate">{rally.name}</p>
                                            <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded border mt-0.5 ${st.cls}`}>
                                              {st.label}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="shrink-0">
                                          {inscribed ? (
                                            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">
                                              Inscrito
                                              {dorsal != null && (
                                                <span className="font-mono font-black text-emerald-300">#{dorsal}</span>
                                              )}
                                            </span>
                                          ) : rally.status === 'active' ? (
                                            <button
                                              onClick={() => setSelectedRally({
                                                id: rally.id,
                                                name: rally.name,
                                                championship_id: rally.championship_id,
                                                clubId: club.id,
                                              })}
                                              className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md transition-colors"
                                            >
                                              Inscribirme
                                            </button>
                                          ) : (
                                            <span className="text-xs text-zinc-700">No disponible</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>

                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
      )}

      {/* Inscription modal */}
      <InscripcionModal
        isOpen={!!selectedRally}
        onClose={() => setSelectedRally(null)}
        rally={selectedRally}
        userId={userId}
        displayName={displayName ?? ''}
        inscribirPiloto={inscribirPiloto}
      />
    </div>
  );
}
