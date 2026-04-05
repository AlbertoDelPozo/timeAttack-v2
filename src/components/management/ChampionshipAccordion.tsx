import React from 'react';
import { Trophy, ChevronDown, ChevronRight, Flag, Clock, Users, Plus, Trash2 } from 'lucide-react';

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
      <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800/80 shadow-md mb-2">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <Trophy className="text-yellow-500" /> Mis Campeonatos
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Estructura tus pruebas, rallies y sesiones de cronometraje.</p>
        </div>
        <button className="flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium rounded-lg text-sm px-4 py-2 transition-all duration-200" onClick={() => setModalCamp(true)}>
          <Plus size={18} /> Nuevo Campeonato
        </button>
      </div>

      {!expandedCamp ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {championships.map(camp => (
            <div key={camp.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-500/50 transition-all cursor-pointer shadow-lg flex flex-col group/camp" onClick={() => setExpandedCamp(camp.id)}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-zinc-100 tracking-tight leading-tight">{camp.name}</h3>
                <button 
                  className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-md p-1.5 transition-colors opacity-0 group-hover/camp:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("¿Estás seguro? Se borrarán todos los rallies, cortes e inscripciones de este campeonato.")) {
                      deleteChampionship(camp.id);
                    }
                  }}
                  title="Borrar Campeonato"
                 >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-auto pt-4 border-t border-zinc-800/50">
                <span className="badge bg-zinc-800/50 text-zinc-300 shadow-sm border border-zinc-700 text-xs">Puntos Configurados: {camp.points_system?.length || 0}</span>
              </div>
            </div>
          ))}
          {championships.length === 0 && (
            <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-xl bg-zinc-950/30 flex flex-col items-center col-span-full">
              <Trophy size={48} className="text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-sm">No has creado ningún campeonato todavía.</p>
            </div>
          )}
        </div>
      ) : (
        championships.filter(c => c.id === expandedCamp).map(camp => (
          <div key={camp.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={() => {
                  setExpandedCamp(null);
                  setExpandedRally(null);
                }} 
                className="text-zinc-400 hover:text-red-400 flex items-center gap-2 font-medium transition-colors text-sm bg-zinc-800/30 px-3 py-1.5 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/80 w-fit"
              >
                ← Volver a Campeonatos
              </button>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm p-4 md:p-6 mb-4">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/60">
                <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">{camp.name}</h3>
                <button className="flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium rounded-lg px-4 py-2 text-sm transition-all duration-200" onClick={() => setModalRally({ open: true, campId: camp.id })}>
                  <Plus size={18} /> <span className="hidden md:inline">Añadir prueba</span><span className="md:hidden">Añadir</span>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {rallies.filter(r => r.championship_id === camp.id).length === 0 ? (
                  <p className="text-zinc-500 italic text-sm py-8 text-center bg-zinc-950/30 rounded-lg border border-dashed border-zinc-800">Aún no hay rallies en este campeonato.</p>
                ) : (
                  rallies.filter(r => r.championship_id === camp.id).map(rally => (
                    <div key={rally.id} className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm transition-colors">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 transition-colors group/rally"
                        onClick={() => setExpandedRally(expandedRally === rally.id ? null : rally.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedRally === rally.id ? <ChevronDown size={20} className="text-zinc-500" /> : <ChevronRight size={20} className="text-zinc-600" />}
                          <div className="bg-zinc-800/80 p-2 rounded-lg border border-zinc-700/50 shadow-sm"><Flag size={18} className="text-zinc-300" /></div>
                          <h4 className="text-lg font-bold text-zinc-200 ml-2 tracking-tight">{rally.name}</h4>
                        </div>
  
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-md p-2 transition-colors opacity-0 group-hover/rally:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("¿Borrar esta prueba y todos sus tiempos?")) {
                                deleteRally(rally.id);
                              }
                            }}
                            title="Borrar Rally"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
  
                      {expandedRally === rally.id && (
                        <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/80 flex flex-col gap-2">
                          {sessions.filter(s => s.rally_id === rally.id).length === 0 ? (
                            <p className="text-zinc-500 italic ml-4 py-2 md:ml-14 text-sm">Sin sesiones (cortes) asignadas.</p>
                          ) : (
                            sessions.filter(s => s.rally_id === rally.id).map(session => (
                              <div key={session.id} className="md:ml-8 md:mr-2 px-4 py-3 bg-zinc-900 border border-zinc-800/50 rounded-lg flex justify-between items-center text-sm shadow-sm hover:bg-zinc-800 transition-colors cursor-pointer group/session relative" onClick={() => setModalCronometro({ open: true, sessionId: session.id, rallyId: rally.id })}>
                                <span className="font-semibold text-zinc-300 flex items-center gap-3"><Clock size={16} className="text-zinc-500"/> {session.name}</span>
                                <div className="flex items-center gap-3">
                                  <button 
                                    className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-md p-1.5 transition-colors opacity-0 group-hover/session:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm("¿Borrar este corte e inscripciones?")) {
                                        deleteSession(session.id);
                                      }
                                    }}
                                    title="Borrar Sesión"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                          <div className="mt-4 flex flex-col md:flex-row justify-end gap-3 px-0 md:px-2 pb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalInscripciones({ open: true, sessionId: null, rallyId: rally.id });
                              }}
                              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/20 active:scale-95 font-semibold rounded-lg transition-all duration-200 w-full md:w-auto"
                            >
                              <Users size={18} />
                              <span>Inscripciones</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium rounded-lg px-5 py-2.5 transition-all duration-200 w-full md:w-auto" onClick={() => setModalSession({ open: true, rallyId: rally.id })}>
                              <Plus size={18} /> Añadir Corte extra
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
