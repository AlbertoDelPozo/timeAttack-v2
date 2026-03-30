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
  deleteChampionship: (id: string) => void;
}

export function ChampionshipAccordion({
  championships, rallies, sessions,
  expandedCamp, setExpandedCamp,
  expandedRally, setExpandedRally,
  setModalCamp, setModalRally, setModalSession, setModalInscripciones,
  deleteChampionship
}: ChampionshipAccordionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-[#1e1e1e] p-6 rounded-3xl border border-[#333333] shadow-lg mb-2">
        <div>
          <h2 className="text-2xl font-bold text-[#ededed] flex items-center gap-3">
            <Trophy className="text-yellow-500" /> Mis Campeonatos
          </h2>
          <p className="text-[#a1a1aa] mt-1">Estructura tus pruebas, rallies y sesiones de cronometraje.</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 text-white font-medium rounded-lg shadow-md px-4 py-2 hover:bg-red-700 transition-colors border-none" onClick={() => setModalCamp(true)}>
          <Plus size={18} /> Nuevo Campeonato
        </button>
      </div>

      {championships.map(camp => (
        <div key={camp.id} className="bg-[#1e1e1e] border border-[#333333] rounded-2xl overflow-hidden shadow-md">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#262626] transition-colors"
            onClick={() => setExpandedCamp(expandedCamp === camp.id ? null : camp.id)}
          >
            <div className="flex items-center gap-4">
              {expandedCamp === camp.id ? <ChevronDown className="text-[#DA0037]" /> : <ChevronRight className="text-[#a1a1aa]" />}
              <h3 className="text-xl font-bold text-[#ededed]">{camp.name}</h3>
              <span className="badge badge-neutral shadow-sm border border-[#333333] text-xs">Puntos: {camp.points_system?.length || 0}</span>
            </div>
            
            <button 
              className="text-[#a1a1aa] hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("¿Estás seguro? Se borrarán todos los rallies, cortes e inscripciones de este campeonato.")) {
                  deleteChampionship(camp.id);
                }
              }}
              title="Borrar Campeonato"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {expandedCamp === camp.id && (
            <div className="p-4 border-t border-[#333333] bg-[#121212]/50 flex flex-col gap-4">
              {/* Rallies */}
              {rallies.filter(r => r.championship_id === camp.id).length === 0 ? (
                <p className="text-[#a1a1aa] italic ml-8 py-2 text-sm">Aún no hay rallies en este campeonato.</p>
              ) : (
                rallies.filter(r => r.championship_id === camp.id).map(rally => (
                  <div key={rally.id} className="ml-8 bg-[#1e1e1e] border border-[#333333] rounded-xl overflow-hidden shadow-sm">
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#262626] transition-colors"
                      onClick={() => setExpandedRally(expandedRally === rally.id ? null : rally.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedRally === rally.id ? <ChevronDown size={18} className="text-blue-500" /> : <ChevronRight size={18} className="text-[#a1a1aa]" />}
                        <Flag size={18} className="text-blue-500" />
                        <h4 className="text-lg font-semibold text-[#ededed]">{rally.name}</h4>
                      </div>
                    </div>

                    {expandedRally === rally.id && (
                      <div className="p-3 border-t border-[#333333] bg-[#171717]/80 flex flex-col gap-3">
                        {sessions.filter(s => s.rally_id === rally.id).length === 0 ? (
                          <p className="text-[#a1a1aa] italic ml-8 text-sm">Sin sesiones (cortes) asignadas.</p>
                        ) : (
                          sessions.filter(s => s.rally_id === rally.id).map(session => (
                            <div key={session.id} className="ml-8 p-3 bg-[#1e1e1e] border border-[#333333] rounded-lg flex justify-between items-center text-sm shadow-sm cursor-pointer hover:bg-[#262626] transition-colors" onClick={() => setModalInscripciones({ open: true, sessionId: session.id, rallyId: rally.id })}>
                              <span className="font-semibold flex items-center gap-2"><Clock size={16} className="text-green-500"/> {session.name}</span>
                              <span className="text-[#a1a1aa] text-xs flex items-center gap-1"><Users size={14}/> Inscripciones</span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-end mt-4 px-8">
                          <button className="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md px-4 py-2 transition-colors border-none" onClick={() => setModalSession({ open: true, rallyId: rally.id })}>
                            <Plus size={16} /> Añadir Corte / Sesión
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              <div className="flex justify-end mt-4 pr-1">
                <button className="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium tracking-wider rounded-lg shadow-md px-4 py-2 transition-colors border-none" onClick={() => setModalRally({ open: true, campId: camp.id })}>
                  <Plus size={16} /> Añadir prueba a este campeonato
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {championships.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[#333333] rounded-3xl bg-[#1e1e1e]/50 text-center flex flex-col items-center">
          <Trophy size={48} className="text-[#333333] mb-4" />
          <p className="text-[#a1a1aa] text-lg">No has creado ningún campeonato todavía.</p>
        </div>
      )}
    </div>
  );
}
