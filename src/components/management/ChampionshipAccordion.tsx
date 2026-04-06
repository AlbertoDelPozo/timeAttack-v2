import React from 'react';
import { Trophy, ChevronDown, ChevronRight, Flag, Clock, Users, Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, Button, Chip } from '@nextui-org/react';

interface ChampionshipAccordionProps {
  championships: any[];
  rallies: any[];
  sessions: any[];
  expandedCamp: string | null;
  setExpandedCamp: (id: string | null) => void;
  expandedRally: string | null;
  setExpandedRally: (id: string | null) => void;
  setModalCamp: (open: boolean) => void;
  setModalRally: (state: { open: boolean, campId: string | null }) => void;
  setModalSession: (state: { open: boolean, rallyId: string | null }) => void;
  setModalInscripciones: (state: { open: boolean, sessionId: string | null, rallyId: string | null }) => void;
  setModalCronometro: (state: { open: boolean, sessionId: string | null, rallyId: string | null }) => void;
  deleteChampionship: (id: string) => void;
  deleteRally: (id: string) => void;
  deleteSession: (id: string) => void;
}

export function ChampionshipAccordion({
  championships, rallies, sessions,
  expandedCamp, setExpandedCamp,
  expandedRally, setExpandedRally,
  setModalCamp, setModalRally, setModalSession, setModalInscripciones, setModalCronometro,
  deleteChampionship, deleteRally, deleteSession
}: ChampionshipAccordionProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* ─── Header ─── */}
      <Card
        isBlurred
        className="bg-zinc-900/70 border border-zinc-800/80 shadow-xl"
      >
        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <Trophy className="text-yellow-500" size={20} /> Mis Campeonatos
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Estructura tus pruebas, rallies y sesiones.</p>
          </div>
          <Button
            variant="bordered"
            startContent={<Plus size={16} />}
            onPress={() => setModalCamp(true)}
            className="border-zinc-700 text-zinc-300 hover:border-zinc-500 font-medium w-full sm:w-auto"
          >
            Nuevo Campeonato
          </Button>
        </CardBody>
      </Card>

      {/* ─── Lista de campeonatos ─── */}
      {!expandedCamp ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {championships.map(camp => (
            <Card
              key={camp.id}
              isBlurred
              isPressable
              onPress={() => setExpandedCamp(camp.id)}
              className="bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-all shadow-lg group/camp cursor-pointer"
            >
              <CardBody className="p-5 flex flex-col gap-3 h-full">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 tracking-tight leading-tight">{camp.name}</h3>
                  <button
                    className="text-zinc-700 hover:text-danger hover:bg-danger/10 rounded-md p-1.5 transition-colors opacity-0 group-hover/camp:opacity-100 ml-2 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("¿Estás seguro? Se borrarán todos los rallies, cortes e inscripciones de este campeonato.")) {
                        deleteChampionship(camp.id);
                      }
                    }}
                    title="Borrar Campeonato"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto pt-3 border-t border-zinc-800/50">
                  <Chip size="sm" variant="flat" className="bg-zinc-800/60 text-zinc-300 border border-zinc-700 text-xs">
                    Puntos: {camp.points_system?.length || 0} posiciones
                  </Chip>
                </div>
              </CardBody>
            </Card>
          ))}
          {championships.length === 0 && (
            <div className="col-span-full flex flex-col items-center py-16 border border-dashed border-zinc-800/60 rounded-xl bg-zinc-950/30">
              <Trophy size={48} className="text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-sm">No has creado ningún campeonato todavía.</p>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="mt-4"
                startContent={<Plus size={14} />}
                onPress={() => setModalCamp(true)}
              >
                Crear el primero
              </Button>
            </div>
          )}
        </div>
      ) : (
        championships.filter(c => c.id === expandedCamp).map(camp => (
          <div key={camp.id} className="flex flex-col gap-4">
            {/* Back button */}
            <div className="flex items-center gap-3">
              <Button
                variant="flat"
                size="sm"
                onPress={() => { setExpandedCamp(null); setExpandedRally(null); }}
                className="text-zinc-400 hover:text-primary bg-zinc-800/30 border border-zinc-800/50 hover:bg-zinc-800/80"
              >
                ← Volver a Campeonatos
              </Button>
            </div>

            {/* Championship card */}
            <Card isBlurred className="bg-zinc-900/70 border border-zinc-800/80 shadow-xl">
              <CardBody className="p-5 md:p-7">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/60">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">{camp.name}</h3>
                  <Button
                    variant="bordered"
                    size="sm"
                    startContent={<Plus size={16} />}
                    onPress={() => setModalRally({ open: true, campId: camp.id })}
                    className="border-zinc-700 text-zinc-300 hover:border-zinc-500 font-medium"
                  >
                    <span className="hidden md:inline">Añadir prueba</span>
                    <span className="md:hidden">Añadir</span>
                  </Button>
                </div>

                {/* Rallies */}
                <div className="flex flex-col gap-3">
                  {rallies.filter(r => r.championship_id === camp.id).length === 0 ? (
                    <p className="text-zinc-500 italic text-sm py-8 text-center bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800">
                      Aún no hay pruebas en este campeonato.
                    </p>
                  ) : (
                    rallies.filter(r => r.championship_id === camp.id).map(rally => (
                      <div key={rally.id} className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl overflow-hidden transition-colors">
                        {/* Rally header row */}
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 transition-colors group/rally"
                          onClick={() => setExpandedRally(expandedRally === rally.id ? null : rally.id)}
                        >
                          <div className="flex items-center gap-3">
                            {expandedRally === rally.id
                              ? <ChevronDown size={20} className="text-zinc-400" />
                              : <ChevronRight size={20} className="text-zinc-600" />
                            }
                            <div className="bg-zinc-800/80 p-2 rounded-lg border border-zinc-700/50 shadow-sm">
                              <Flag size={16} className="text-zinc-300" />
                            </div>
                            <h4 className="text-base font-bold text-zinc-200 ml-1 tracking-tight">{rally.name}</h4>
                          </div>
                          <button
                            className="text-zinc-600 hover:text-danger hover:bg-danger/10 rounded-md p-2 transition-colors opacity-0 group-hover/rally:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("¿Borrar esta prueba y todos sus tiempos?")) deleteRally(rally.id);
                            }}
                            title="Borrar Rally"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Rally sessions */}
                        {expandedRally === rally.id && (
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-800/60 bg-zinc-950/80 flex flex-col gap-2">
                            {sessions.filter(s => s.rally_id === rally.id).length === 0 ? (
                              <p className="text-zinc-500 italic ml-4 py-2 md:ml-14 text-sm">Sin sesiones (cortes) asignadas.</p>
                            ) : (
                              sessions.filter(s => s.rally_id === rally.id).map(session => (
                                <div
                                  key={session.id}
                                  className="md:ml-8 md:mr-2 px-4 py-3 bg-zinc-900 border border-zinc-800/50 rounded-lg flex justify-between items-center text-sm shadow-sm hover:bg-zinc-800 transition-colors cursor-pointer group/session relative"
                                  onClick={() => setModalCronometro({ open: true, sessionId: session.id, rallyId: rally.id })}
                                >
                                  <span className="font-semibold text-zinc-300 flex items-center gap-3">
                                    <Clock size={14} className="text-zinc-500" /> {session.name}
                                  </span>
                                  <button
                                    className="text-zinc-600 hover:text-danger hover:bg-danger/10 rounded-md p-1.5 transition-colors opacity-0 group-hover/session:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm("¿Borrar este corte e inscripciones?")) deleteSession(session.id);
                                    }}
                                    title="Borrar Sesión"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))
                            )}
                            {/* Action buttons - mobile-first stacking */}
                            <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                              <Button
                                color="primary"
                                variant="shadow"
                                startContent={<Users size={16} />}
                                className="font-semibold w-full sm:w-auto"
                                onPress={() => setModalInscripciones({ open: true, sessionId: null, rallyId: rally.id })}
                              >
                                Inscripciones
                              </Button>
                              <Button
                                variant="bordered"
                                startContent={<Plus size={16} />}
                                className="border-zinc-700 text-zinc-300 hover:border-zinc-500 font-medium w-full sm:w-auto"
                                onPress={() => setModalSession({ open: true, rallyId: rally.id })}
                              >
                                Añadir Corte
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
