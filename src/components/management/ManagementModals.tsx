import React from 'react';
import { Trophy, Flag, Clock } from 'lucide-react';

interface ManagementModalsProps {
  modalCamp: boolean;
  setModalCamp: (open: boolean) => void;
  formCamp: any;
  setFormCamp: React.Dispatch<React.SetStateAction<any>>;
  handleCreateChampionship: (e: React.FormEvent) => void;

  modalRally: { open: boolean, campId: string | null };
  setModalRally: (state: { open: boolean, campId: string | null }) => void;
  formRally: { name: string, stages: number, passes: number };
  setFormRally: (state: { name: string, stages: number, passes: number }) => void;
  handleCreateRally: (e: React.FormEvent) => void;

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
  return (
    <>
      {/* Modal Nuevo Campeonato */}
      {modalCamp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 md:p-8 rounded-3xl max-w-lg w-full border border-[#333333] shadow-2xl">
            <h3 className="text-2xl font-bold text-[#ededed] mb-6 flex items-center gap-2"><Trophy className="text-yellow-500" /> Crear Campeonato</h3>
            <form onSubmit={handleCreateChampionship} className="flex flex-col gap-4">
              <div>
                <label className="label"><span className="label-text text-[#a1a1aa] font-bold">Nombre del Campeonato</span></label>
                <input type="text" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formCamp.name} onChange={e => setFormCamp({...formCamp, name: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label"><span className="label-text text-[#a1a1aa] font-bold">Tramos (X Defecto)</span></label>
                  <input type="number" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formCamp.tramos} onChange={e => setFormCamp({...formCamp, tramos: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="label"><span className="label-text text-[#a1a1aa] font-bold">Pasadas (X Defecto)</span></label>
                  <input type="number" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formCamp.pasadas} onChange={e => setFormCamp({...formCamp, pasadas: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4 p-0 mt-2">
                  <input type="checkbox" className="toggle toggle-error bg-[#121212] hover:bg-[#121212]" checked={formCamp.multi} onChange={e => setFormCamp({...formCamp, multi: e.target.checked})} />
                  <span className="label-text text-[#ededed] font-semibold">Permitir Multi-Categoría (Un piloto en varias)</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="label flex flex-col items-start gap-1 p-0 mb-2">
                  <span className="label-text text-[#a1a1aa] font-bold">Sistema de Puntuación</span>
                  <span className="text-xs text-[#666666]">Posiciones del 1º hacia abajo, separadas por comas.</span>
                </label>
                <input type="text" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] font-mono outline-none" value={formCamp.points} onChange={e => setFormCamp({...formCamp, points: e.target.value})} />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" className="btn flex-1 bg-[#333333] border-none text-white hover:bg-[#444] rounded-xl" onClick={() => setModalCamp(false)}>Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 text-white font-medium rounded-lg shadow-md px-4 py-2 hover:bg-red-700 transition-colors border-none">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Rally */}
      {modalRally.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 rounded-3xl max-w-sm w-full border border-[#333333] shadow-2xl">
            <h3 className="text-xl font-bold text-[#ededed] mb-4 flex items-center gap-2"><Flag className="text-blue-500" /> Nuevo Rally / Prueba</h3>
            <form onSubmit={handleCreateRally} className="flex flex-col gap-4">
              <div>
                <label className="label py-1 px-0"><span className="label-text text-[#ededed] font-semibold text-sm">Nombre de la prueba</span></label>
                <input type="text" placeholder="Ej: Rally de Sierra Morena" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formRally.name} onChange={e => setFormRally({...formRally, name: e.target.value})} />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label py-1 px-0"><span className="label-text text-[#ededed] font-semibold text-sm">Tramos/Stages</span></label>
                  <input type="number" min="1" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formRally.stages} onChange={e => setFormRally({...formRally, stages: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="label py-1 px-0"><span className="label-text text-[#ededed] font-semibold text-sm">Pasadas/Passes</span></label>
                  <input type="number" min="1" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formRally.passes} onChange={e => setFormRally({...formRally, passes: Number(e.target.value)})} />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" className="btn flex-1 btn-sm h-10 bg-[#333333] border-none text-white hover:bg-[#444] rounded-lg" onClick={() => setModalRally({ open: false, campId: null })}>Cancelar</button>
                <button type="submit" className="flex-1 h-10 bg-red-600 text-white font-medium rounded-lg shadow-md px-4 hover:bg-red-700 transition-colors border-none flex items-center justify-center">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Sesión */}
      {modalSession.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 rounded-3xl max-w-sm w-full border border-[#333333] shadow-2xl">
            <h3 className="text-xl font-bold text-[#ededed] mb-4 flex items-center gap-2"><Clock className="text-green-500" /> Añadir Corte / Sesión</h3>
            <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
              <input type="text" placeholder="Nombre (Ej: Domingo - Mañana)" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-green-500 outline-none" value={formSession.name} onChange={e => setFormSession({ name: e.target.value })} />
              <div className="flex gap-2 mt-2">
                <button type="button" className="btn flex-1 btn-sm h-10 bg-[#333333] border-none text-white hover:bg-[#444] rounded-lg" onClick={() => setModalSession({ open: false, rallyId: null })}>Cancelar</button>
                <button type="submit" className="flex-1 h-10 bg-green-600 text-white font-medium rounded-lg shadow-md px-4 hover:bg-green-700 transition-colors border-none flex items-center justify-center">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
