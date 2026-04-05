import React, { useState } from 'react';
import { Trophy, Flag, Clock, Plus, X } from 'lucide-react';

interface ManagementModalsProps {
  modalCamp: boolean;
  setModalCamp: (open: boolean) => void;
  formCamp: any;
  setFormCamp: React.Dispatch<React.SetStateAction<any>>;
  handleCreateChampionship: (e: React.FormEvent, categoriasCamp: string[]) => void;

  modalRally: { open: boolean, campId: string | null };
  setModalRally: (state: { open: boolean, campId: string | null }) => void;
  formRally: { name: string, stages: number, passes: number };
  setFormRally: (state: { name: string, stages: number, passes: number }) => void;
  handleCreateRally: (e: React.FormEvent, sessionsInRally: string[]) => void;

  modalSession: { open: boolean, rallyId: string | null };
  setModalSession: (state: { open: boolean, rallyId: string | null }) => void;
  formSession: { name: string };
  setFormSession: (state: { name: string }) => void;
  handleCreateSession: (e: React.FormEvent) => void;
}

export function ManagementModals({
  modalCamp, setModalCamp, formCamp, setFormCamp, handleCreateChampionship,
  modalRally, setModalRally, formRally, setFormRally, handleCreateRally,
  modalSession, setModalSession, formSession, setFormSession, handleCreateSession
}: ManagementModalsProps) {

  // Estado para los cortes temporales del nuevo rally
  const [sessionsInRally, setSessionsInRally] = useState<string[]>(['Domingo Mañana']);
  const [newSessionName, setNewSessionName] = useState('');

  // Estado para las categorías temporales del nuevo campeonato
  const [categoriasCamp, setCategoriasCamp] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const addCategory = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !(categoriasCamp || []).includes(newCategoryName.trim())) {
      setCategoriasCamp([...(categoriasCamp || []), newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };

  const removeCategory = (cat: string) => {
    setCategoriasCamp((categoriasCamp || []).filter(c => c !== cat));
  };

  const addSession = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newSessionName.trim() && !(sessionsInRally || []).includes(newSessionName.trim())) {
      setSessionsInRally([...(sessionsInRally || []), newSessionName.trim()]);
      setNewSessionName('');
    }
  };

  const removeSession = (ses: string) => {
    setSessionsInRally((sessionsInRally || []).filter(s => s !== ses));
  };

  return (
    <>
      {/* Modal Nuevo Campeonato */}
      {modalCamp && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-xl shadow-black/40 overflow-hidden max-w-lg w-full p-6 md:p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-white mb-6 flex items-center gap-2 border-b border-zinc-800/40 pb-4"><Trophy className="text-yellow-500" /> Crear Campeonato</h3>
            <form onSubmit={(e) => { handleCreateChampionship(e, categoriasCamp); setCategoriasCamp([]); }} className="flex flex-col gap-4">
              <div>
                <label className="label"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre del Campeonato</span></label>
                <input type="text" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={formCamp.name} onChange={e => setFormCamp({...formCamp, name: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tramos (X Defecto)</span></label>
                  <input type="number" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={formCamp.tramos} onChange={e => setFormCamp({...formCamp, tramos: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="label"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pasadas (X Defecto)</span></label>
                  <input type="number" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={formCamp.pasadas} onChange={e => setFormCamp({...formCamp, pasadas: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4 p-0 mt-2">
                  <input type="checkbox" className="toggle toggle-info bg-zinc-900 hover:bg-zinc-900 border-zinc-800" checked={formCamp.multi} onChange={e => setFormCamp({...formCamp, multi: e.target.checked})} />
                  <span className="label-text text-zinc-200 font-medium">Permitir Multi-Categoría (Un piloto en varias)</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="label flex flex-col items-start gap-1 p-0 mb-2">
                  <span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sistema de Puntuación</span>
                  <span className="text-xs text-zinc-500 mb-2">Posiciones del 1º hacia abajo, separadas por comas.</span>
                </label>
                <input type="text" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500 font-mono" value={formCamp.points} onChange={e => setFormCamp({...formCamp, points: e.target.value})} />
              </div>
              <div className="mt-2">
                <label className="label"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Categorías Permitidas</span></label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Ej: Supercars, Grupo N..." className="flex-1 bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addCategory(e); } }} />
                  <button type="button" onClick={addCategory} className="flex px-4 py-2 items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium rounded-lg transition-colors border border-zinc-700"><Plus size={20} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(categoriasCamp || []).map(cat => (
                    <span key={cat} className="badge bg-zinc-800/50 border border-zinc-700 gap-1 p-3 font-medium shadow-sm text-zinc-200 rounded-md">{cat} <X size={14} className="cursor-pointer hover:text-red-500 text-zinc-400 ml-1 transition-colors" onClick={() => removeCategory(cat)} /></span>
                  ))}
                  {(!categoriasCamp || categoriasCamp.length === 0) && <span className="text-xs text-zinc-500 italic mt-1">No has añadido categorías. Los pilotos no podrán inscribirse.</span>}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-sm font-medium transition-all duration-200" onClick={() => setModalCamp(false)}>Cancelar</button>
                <button type="submit" className="flex-1 flex justify-center items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/20 active:scale-95 text-sm font-medium rounded-lg transition-all duration-200 border-none">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Rally */}
      {modalRally.open && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-xl shadow-black/40 overflow-hidden max-w-sm w-full p-6">
            <h3 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2 border-b border-zinc-800/40 pb-4 mb-6"><Flag className="text-red-500" /> Nuevo Rally / Prueba</h3>
            <form onSubmit={(e) => { handleCreateRally(e, sessionsInRally); setSessionsInRally(['Domingo Mañana']); }} className="flex flex-col gap-4">
              <div>
                <label className="label py-1 px-0"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre de la prueba</span></label>
                <input type="text" placeholder="Ej: Rally de Sierra Morena" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={formRally.name} onChange={e => setFormRally({...formRally, name: e.target.value})} />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label py-1 px-0"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tramos/Stages</span></label>
                  <input type="number" min="1" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={formRally.stages} onChange={e => setFormRally({...formRally, stages: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="label py-1 px-0"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pasadas/Passes</span></label>
                  <input type="number" min="1" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={formRally.passes} onChange={e => setFormRally({...formRally, passes: Number(e.target.value)})} />
                </div>
              </div>

              <div className="mt-2 border-t border-zinc-800/40 pt-4">
                <label className="label py-1 px-0"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Configuración de Cortes / Sesiones</span></label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Ej: Domingo Mañana" className="flex-1 bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addSession(e); } }} />
                  <button type="button" onClick={addSession} className="flex px-4 py-2 items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium rounded-lg transition-colors border border-zinc-700"><Plus size={20} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(sessionsInRally || []).map(ses => (
                    <span key={ses} className="badge bg-zinc-800/50 border border-zinc-700 gap-1 p-3 font-medium shadow-sm text-zinc-200 rounded-md">{ses} <X size={14} className="cursor-pointer hover:text-red-500 text-zinc-400 ml-1 transition-colors" onClick={() => removeSession(ses)} /></span>
                  ))}
                  {(!sessionsInRally || sessionsInRally.length === 0) && <span className="text-xs text-zinc-500 italic mt-1">Sin cortes. Deberás añadirlos después para inscribir.</span>}
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <button type="button" className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-sm font-medium transition-all duration-200" onClick={() => setModalRally({ open: false, campId: null })}>Cancelar</button>
                <button type="submit" className="flex-1 flex justify-center items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/20 active:scale-95 text-sm font-medium rounded-lg transition-all duration-200 border-none">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Sesión */}
      {modalSession.open && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-xl shadow-black/40 overflow-hidden max-w-sm w-full p-6">
            <h3 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2 border-b border-zinc-800/40 pb-4 mb-6"><Clock className="text-emerald-500" /> Añadir Corte / Sesión</h3>
            <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
              <div>
                <label className="label py-1 px-0"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre del Corte</span></label>
                <input type="text" placeholder="Nombre (Ej: Domingo - Mañana)" className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" value={formSession.name} onChange={e => setFormSession({ name: e.target.value })} />
              </div>
              <div className="flex gap-4 mt-2">
                <button type="button" className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-sm font-medium transition-all duration-200" onClick={() => setModalSession({ open: false, rallyId: null })}>Cancelar</button>
                <button type="submit" className="flex-1 flex justify-center items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 active:scale-95 text-sm font-medium rounded-lg transition-all duration-200 border-none">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
