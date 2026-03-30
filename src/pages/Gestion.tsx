import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Pencil, Check, X, ChevronDown, ChevronRight, Trophy, Flag, Clock, Users } from 'lucide-react';
import Cronometrador from './Cronometrador';

const formatMs = (ms: number) => (ms / 1000).toFixed(3);

function CampeonatosManager({ userId }: { userId: string }) {
  const [campeonatos, setCampeonatos] = useState<any[]>([]);
  const [rallies, setRallies] = useState<any[]>([]);
  const [sesiones, setSesiones] = useState<any[]>([]);
  const isMounted = React.useRef(true);

  // States for Accordions
  const [expandedCamp, setExpandedCamp] = useState<string | null>(null);
  const [expandedRally, setExpandedRally] = useState<string | null>(null);

  // States for Modals
  const [modalCamp, setModalCamp] = useState(false);
  const [formCamp, setFormCamp] = useState({ name: '', tramos: 5, pasadas: 3, multi: false, points: '25, 18, 15, 12, 10, 8, 6, 4, 2, 1' });

  const [modalRally, setModalRally] = useState<{ open: boolean, campId: string | null }>({ open: false, campId: null });
  const [formRallyName, setFormRallyName] = useState('');

  const [modalSesion, setModalSesion] = useState<{ open: boolean, rallyId: string | null }>({ open: false, rallyId: null });
  const [formSesion, setFormSesion] = useState({ name: '' });

  // States for Inscriptions
  const [modalInscripciones, setModalInscripciones] = useState<{ open: boolean, sessionId: string | null, rallyId: string | null }>({ open: false, sessionId: null, rallyId: null });
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [pilotosGlobal, setPilotosGlobal] = useState<any[]>([]);
  const [categoriasGlobal, setCategoriasGlobal] = useState<any[]>([]);
  const [pilotoSel, setPilotoSel] = useState('');
  const [catSel, setCatSel] = useState('');

  const cargarInscritosFormData = async (sessionId: string) => {
    const { data: insData } = await supabase.from('inscriptions').select('*, pilots(name), categories(name)').eq('session_id', sessionId);
    if (insData && isMounted.current) setInscritos(insData);
    
    if (pilotosGlobal.length === 0) {
      const { data: pData } = await supabase.from('pilots').select('id, name').eq('club_id', userId);
      if (pData && isMounted.current) setPilotosGlobal(pData);
      
      const { data: cData } = await supabase.from('categories').select('id, name').eq('club_id', userId);
      if (cData && isMounted.current) setCategoriasGlobal(cData);
    }
  };

  useEffect(() => {
    if (modalInscripciones.open && modalInscripciones.sessionId) {
      cargarInscritosFormData(modalInscripciones.sessionId);
    } else {
      setInscritos([]);
    }
  }, [modalInscripciones.open, modalInscripciones.sessionId]);

  const handleCreateSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSesion.name.trim() || !modalSesion.rallyId) {
      alert("Faltan datos (ID o Nombre).");
      return;
    }

    try {
      const { data: newSession, error } = await supabase.from('rally_sessions').insert([{ 
        rally_id: modalSesion.rallyId, 
        name: formSesion.name 
      }]).select().single();
      
      if (error) throw error;
      
      setFormSesion({ name: '' });
      setModalSesion({ open: false, rallyId: null });
      
      if (newSession && isMounted.current) {
        setSesiones(prev => [...prev, newSession]);
      }
      cargarJerarquia();
    } catch (error: any) {
      console.error("Error al crear corte:", error);
      alert("Error al crear el corte. Revisa la consola.");
    }
  };

  const handleInscribir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotoSel || !catSel || !modalInscripciones.sessionId) return;
    
    const exists = inscritos.find(i => i.pilot_id === pilotoSel && i.category_id === Number(catSel));
    if (exists) {
      alert("Este piloto ya está inscrito con esa categoría en este corte.");
      return;
    }
    
    const { error } = await supabase.from('inscriptions').insert({
      session_id: modalInscripciones.sessionId,
      pilot_id: pilotoSel,
      category_id: Number(catSel)
    });
    
    if (error) {
       alert("Error al inscribir: " + error.message);
    } else {
       setPilotoSel('');
       setCatSel('');
       cargarInscritosFormData(modalInscripciones.sessionId);
    }
  };

  const cargarJerarquia = async () => {
    try {
      const { data: cData, error: cErr } = await supabase
        .from('championships')
        .select('*, rallies(*, rally_sessions(*))')
        .eq('club_id', userId)
        .order('created_at', { ascending: false });
        
      if (cErr) throw cErr;
      
      if (isMounted.current) {
        const camps = cData || [];
        // Flattening arrays instantly keeps the React Native mapping incredibly robust
        const allRallies = camps.flatMap((c: any) => c.rallies || []);
        const allSessions = allRallies.flatMap((r: any) => r.rally_sessions || []);
        
        setCampeonatos(camps);
        setRallies(allRallies);
        setSesiones(allSessions);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error("Error al cargar jerarquía:", error);
    }
  };

  useEffect(() => {
    cargarJerarquia();
    return () => { isMounted.current = false; };
  }, [userId]);

  const handleCreateCampeonato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCamp.name.trim()) return;
    
    try {
      const ptsArray = formCamp.points.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p));
      
      const { data: nuevoCampeonato, error } = await supabase.from('championships').insert({
        name: formCamp.name,
        club_id: userId,
        default_stages: Number(formCamp.tramos),
        default_passes: Number(formCamp.pasadas),
        allow_multi_category: formCamp.multi,
        points_system: ptsArray
      }).select().single();

      if (error) throw error;

      setModalCamp(false);
      setFormCamp({ name: '', tramos: 5, pasadas: 3, multi: false, points: '25, 18, 15, 12, 10, 8, 6, 4, 2, 1' });
      
      if (nuevoCampeonato) {
        setCampeonatos(prev => [nuevoCampeonato, ...prev]);
      }
      cargarJerarquia();
    } catch (error: any) {
      console.error("Error al crear campeonato:", error);
      alert(`Error al guardar: ${error.message}`);
    }
  };

  const handleCreateRally = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRallyName.trim() || !modalRally.campId) return;

    try {
      const { data: newRally, error } = await supabase.from('rallies').insert({ 
        name: formRallyName, 
        championship_id: modalRally.campId, 
        status: 'draft' 
      }).select().single();
      
      if (error) throw error;

      setModalRally({ open: false, campId: null });
      setFormRallyName('');
      
      if (newRally) {
        setRallies(prev => [...prev, newRally]);
        if (!expandedCamp) setExpandedCamp(newRally.championship_id);
      }
      cargarJerarquia();
    } catch (error: any) {
      console.error("Error al crear rally:", error);
      alert("Error al crear la prueba. Revisa la consola.");
    }
  };

  const handleCreateSesionOriginal = async (e: React.FormEvent) => {
    // legacy hook cleanup handle create session function which was removed by replace chunks to avoid conflict.
  };

  return (
    <div className="w-full max-w-7xl flex flex-col gap-6">
      <div className="flex justify-between items-center bg-[#1e1e1e] p-6 rounded-3xl border border-[#333333] shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-[#ededed] flex items-center gap-3">
            <Trophy className="text-yellow-500" /> Mis Campeonatos
          </h2>
          <p className="text-[#a1a1aa] mt-1">Estructura tus pruebas, rallies y sesiones de cronometraje.</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 w-auto text-white font-medium rounded-lg px-4 py-2 hover:bg-red-700 transition-colors border-none" onClick={() => setModalCamp(true)}>
          <Plus size={18} /> Nuevo Campeonato
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {campeonatos.map(camp => (
          <div key={camp.id} className="bg-[#1e1e1e] border border-[#333333] rounded-2xl overflow-hidden shadow-md">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#262626] transition-colors"
              onClick={() => setExpandedCamp(expandedCamp === camp.id ? null : camp.id)}
            >
              <div className="flex items-center gap-4">
                {expandedCamp === camp.id ? <ChevronDown className="text-[#DA0037]" /> : <ChevronRight className="text-[#a1a1aa]" />}
                <h3 className="text-xl font-bold text-[#ededed]">{camp.name}</h3>
                <span className="badge badge-neutral shadow-sm border border-[#333333] text-xs">Puntos: {camp.points_system.length}</span>
              </div>
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
                          {sesiones.filter(s => s.rally_id === rally.id).length === 0 ? (
                            <p className="text-[#a1a1aa] italic ml-8 text-sm">Sin sesiones (cortes) asignadas.</p>
                          ) : (
                            sesiones.filter(s => s.rally_id === rally.id).map(sesion => (
                              <div key={sesion.id} className="ml-8 p-3 bg-[#1e1e1e] border border-[#333333] rounded-lg flex justify-between items-center text-sm shadow-sm cursor-pointer hover:bg-[#262626] transition-colors" onClick={() => setModalInscripciones({ open: true, sessionId: sesion.id, rallyId: rally.id })}>
                                <span className="font-semibold flex items-center gap-2"><Clock size={16} className="text-green-500"/> {sesion.name}</span>
                                <span className="text-[#a1a1aa] text-xs flex items-center gap-1"><Users size={14}/> Inscripciones</span>
                              </div>
                            ))
                          )}
                          <div className="flex justify-end mt-4 px-8">
                            <button className="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-green-600 text-white font-medium rounded-lg shadow-md px-4 py-2 hover:bg-green-700 transition-colors border-none" onClick={() => setModalSesion({ open: true, rallyId: rally.id })}>
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
        {campeonatos.length === 0 && (
          <div className="text-center py-12 border border-dashed border-[#333333] rounded-3xl bg-[#1e1e1e]/50">
            <Trophy size={48} className="mx-auto text-[#333333] mb-4" />
            <p className="text-[#a1a1aa] text-lg">No has creado ningún campeonato todavía.</p>
          </div>
        )}
      </div>

      {/* Modal Nuevo Campeonato */}
      {modalCamp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 md:p-8 rounded-3xl max-w-lg w-full border border-[#333333] shadow-2xl">
            <h3 className="text-2xl font-bold text-[#ededed] mb-6 flex items-center gap-2"><Trophy className="text-yellow-500" /> Crear Campeonato</h3>
            <form onSubmit={handleCreateCampeonato} className="flex flex-col gap-4">
              <div>
                <label className="label"><span className="label-text text-[#a1a1aa] font-bold">Nombre del Campeonato</span></label>
                <input type="text" required className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formCamp.name} onChange={e => setFormCamp({...formCamp, name: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label"><span className="label-text text-[#a1a1aa] font-bold">Tramos (X Defecto)</span></label>
                  <input type="number" required min="1" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formCamp.tramos} onChange={e => setFormCamp({...formCamp, tramos: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="label"><span className="label-text text-[#a1a1aa] font-bold">Pasadas (X Defecto)</span></label>
                  <input type="number" required min="1" className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formCamp.pasadas} onChange={e => setFormCamp({...formCamp, pasadas: Number(e.target.value)})} />
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
                <input type="text" required className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] font-mono outline-none" value={formCamp.points} onChange={e => setFormCamp({...formCamp, points: e.target.value})} />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" className="flex-1 bg-[#333333] border-none text-white hover:bg-[#444] rounded-lg px-4 py-2 transition-colors font-medium" onClick={() => setModalCamp(false)}>Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 text-white font-medium rounded-lg px-4 py-2 hover:bg-red-700 transition-colors border-none">Crear</button>
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
              <input type="text" placeholder="Ej: Rally de Sierra Morena" required className="input w-full bg-[#121212] border-[#333333] text-white focus:border-[#DA0037] outline-none" value={formRallyName} onChange={e => setFormRallyName(e.target.value)} />
              <div className="flex gap-4 mt-2">
                <button type="button" className="flex-1 bg-[#333333] border-none text-white hover:bg-[#444] rounded-lg px-4 py-2 transition-colors font-medium" onClick={() => setModalRally({ open: false, campId: null })}>Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors border-none">Añadir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Sesión */}
      {modalSesion.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 rounded-3xl max-w-sm w-full border border-[#333333] shadow-2xl">
            <h3 className="text-xl font-bold text-[#ededed] mb-4 flex items-center gap-2"><Clock className="text-green-500" /> Añadir Corte / Sesión</h3>
            <form onSubmit={handleCreateSesion} className="flex flex-col gap-4">
              <input type="text" placeholder="Nombre (Ej: Domingo - Mañana)" required className="input w-full bg-[#121212] border-[#333333] text-white focus:border-green-500 outline-none" value={formSesion.name} onChange={e => setFormSesion({ name: e.target.value })} />
              <div className="flex gap-2 mt-2">
                <button type="button" className="btn flex-1 btn-sm h-10 bg-[#333333] border-none text-white hover:bg-[#444] rounded-lg" onClick={() => setModalSesion({ open: false, rallyId: null })}>Cancelar</button>
                <button type="submit" className="flex-1 h-10 bg-green-600 text-white font-medium rounded-lg shadow-md px-4 hover:bg-green-700 transition-colors border-none flex items-center justify-center">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inscripciones y Cronometraje */}
      {modalInscripciones.open && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-start z-50 p-2 md:p-6 overflow-y-auto w-full h-full">
          <div className="w-full max-w-4xl flex justify-end mb-2 mt-4">
            <button className="btn btn-circle btn-sm bg-[#333333] border-none text-white hover:bg-error shadow-lg" onClick={() => setModalInscripciones({ open: false, sessionId: null, rallyId: null })}>
              <X size={18} />
            </button>
          </div>
          
          <div className="bg-[#1e1e1e] p-4 md:p-8 rounded-3xl max-w-4xl w-full border border-[#333333] shadow-2xl mb-6">
            <h3 className="text-2xl font-bold text-[#ededed] mb-6 flex items-center gap-2"><Users className="text-blue-500" /> Inscripciones del Corte</h3>
            
            {/* Lista Pilotos */}
            <div className="bg-[#121212] rounded-2xl border border-[#333333] p-4 mb-6 shadow-inner">
              <h4 className="text-[#a1a1aa] font-bold mb-3 text-sm uppercase">Pilotos Inscritos ({inscritos.length})</h4>
              <div className="max-h-40 overflow-y-auto pr-2">
                <table className="table w-full text-sm">
                  <tbody>
                    {inscritos.map(ins => (
                      <tr key={ins.id} className="border-b border-[#333333] hover:bg-[#1a1a1a] transition-colors rounded-lg">
                        <td className="text-white font-semibold pl-2">{ins.pilots?.name}</td>
                        <td className="text-right pr-2"><span className="badge bg-[#333333] text-white border-none shadow-sm text-xs px-3">{ins.categories?.name}</span></td>
                      </tr>
                    ))}
                    {inscritos.length === 0 && <tr><td colSpan={2} className="text-[#a1a1aa] italic text-center py-4">Sin inscripciones todavía en este corte.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bucle Inscripciones */}
            <form onSubmit={handleInscribir} className="flex flex-col md:flex-row gap-4 items-end bg-[#171717]/80 p-5 rounded-2xl border border-[#333333] shadow-inner">
              <div className="flex-1 w-full">
                <label className="label py-1"><span className="label-text text-[#ededed] font-semibold text-sm">Piloto participando</span></label>
                <select required className="select select-bordered w-full bg-[#121212] border-[#333333] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl" value={pilotoSel} onChange={e => setPilotoSel(e.target.value)}>
                  <option value="" disabled>Seleccionar piloto...</option>
                  {pilotosGlobal.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="label py-1"><span className="label-text text-[#ededed] font-semibold text-sm">Coche / Categoría</span></label>
                <select required className="select select-bordered w-full bg-[#121212] border-[#333333] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl" value={catSel} onChange={e => setCatSel(e.target.value)}>
                  <option value="" disabled>Seleccionar categoría...</option>
                  {categoriasGlobal.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="flex items-center justify-center bg-blue-600 text-white font-medium hover:bg-blue-700 border-none rounded-xl shadow-md h-12 px-8 transition-colors w-full md:w-auto cursor-pointer">
                Añadir Piloto
              </button>
            </form>
          </div>

          <div className="w-full max-w-4xl relative">
             <Cronometrador userId={userId} sessionId={modalInscripciones.sessionId || undefined} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Gestion({ userId }: { userId?: string }) {
  const [activeTab, setActiveTab] = useState<'evento' | 'campeonatos'>('evento');

  const [pilotos, setPilotos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiempos, setTiempos] = useState<any[]>([]);

  const [nuevoPiloto, setNuevoPiloto] = useState('');
  const [nuevoDorsal, setNuevoDorsal] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const [pilotoAEliminar, setPilotoAEliminar] = useState<any | null>(null);

  // Configuración de Carrera
  const [tramos, setTramos] = useState<number | ''>('');
  const [pasadas, setPasadas] = useState<number | ''>('');
  const [mensajeConfig, setMensajeConfig] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  // Edición Inline de Tiempos
  const [editandoTramoId, setEditandoTramoId] = useState<string | number | null>(null);
  const [tiempoEditado, setTiempoEditado] = useState('');
  const [penalizacionEditada, setPenalizacionEditada] = useState('');
  const [mensajeTiempos, setMensajeTiempos] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  const isMounted = React.useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const cargarDatos = async () => {
    if (!userId) return;

    try {
      // Cargar Pilotos
      const { data: pData, error: pError } = await supabase.from('pilots').select('*').eq('club_id', userId).order('name');
      if (pError) throw pError;
      if (isMounted.current && pData) setPilotos(pData);

      // Cargar Categorías
      const { data: cData, error: cError } = await supabase.from('categories').select('*').eq('club_id', userId).order('name');
      if (cError) throw cError;
      if (isMounted.current && cData) setCategorias(cData);

      // Cargar últimos 10 tiempos
      const { data: tData, error: tError } = await supabase
        .from('lap_times')
        .select('*, pilots(name), categories(name)')
        .eq('club_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (tError) throw tError;
      if (isMounted.current && tData) setTiempos(tData);

      // Cargar Configuración de Carrera
      const { data: configData, error: configError } = await supabase.from('race_config').select('*').eq('club_id', userId).maybeSingle();
      if (configError) throw configError;
      if (isMounted.current && configData) {
        setTramos(configData.num_tramos || 1);
        setPasadas(configData.num_pasadas || 1);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error?.message?.includes('Lock broken') || error?.message?.includes('Fetch is aborted')) {
        console.warn("Petición de gestión abortada por concurrencia (ignorando).");
        return;
      }
      console.error('Error fetching datos de gestión:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleInsertPiloto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPiloto.trim() || !userId) return;

    const dorsalValue = nuevoDorsal.trim() ? parseInt(nuevoDorsal, 10) : null;
    await supabase.from('pilots').insert({ name: nuevoPiloto, dorsal: dorsalValue, club_id: userId });
    
    setNuevoPiloto('');
    setNuevoDorsal('');
    cargarDatos();
  };

  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeConfig(null);
    
    if (tramos === '' || pasadas === '' || !userId) return;

    // Verificar si existe configuración para este club
    const { data: exist } = await supabase.from('race_config').select('id').eq('club_id', userId).maybeSingle();

    let error;
    if (exist) {
      const { error: updateError } = await supabase
        .from('race_config')
        .update({ num_tramos: Number(tramos), num_pasadas: Number(pasadas) })
        .eq('club_id', userId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('race_config')
        .insert({ num_tramos: Number(tramos), num_pasadas: Number(pasadas), club_id: userId });
      error = insertError;
    }
      
    if (error) {
      console.error("Error al actualizar la configuración:", error);
      setMensajeConfig({ texto: `Error al guardar: ${error.message}`, tipo: 'error' });
    } else {
      setMensajeConfig({ texto: "Rally configurado con éxito", tipo: 'success' });
      setTimeout(() => setMensajeConfig(null), 3000);
    }
  };

  const handleInsertCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim() || !userId) return;

    await supabase.from('categories').insert({ name: nuevaCategoria, club_id: userId });
    setNuevaCategoria('');
    cargarDatos();
  };

  const confirmarBorradoPiloto = async () => {
    if (!pilotoAEliminar) return;

    // Paso A: Borrar tiempos asociados
    const { error: errTiempos } = await supabase.from('lap_times').delete().eq('pilot_id', pilotoAEliminar.id);
    if (errTiempos) {
      console.error("Error al borrar tiempos asociados:", errTiempos);
      alert(`Error al vaciar tiempos del piloto: ${errTiempos.message}`);
      return;
    }

    // Paso B: Borrar piloto
    const { error: errPiloto } = await supabase.from('pilots').delete().eq('id', pilotoAEliminar.id);
    if (errPiloto) {
      console.error("Error exacto de Supabase al borrar piloto:", errPiloto);
      alert(`Error al borrar piloto: ${errPiloto.message}`);
      return;
    }

    // Paso C: Refrescar y cerrar modal
    setPilotos((prev) => prev.filter(p => p.id !== pilotoAEliminar.id));
    setTiempos((prev) => prev.filter(t => t.pilot_id !== pilotoAEliminar.id));
    setPilotoAEliminar(null);
  };

  const handleDeleteCategoria = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error("Error exacto de Supabase al borrar categoría:", error);
        alert(`Error al borrar categoría: ${error.message}`);
      } else {
        setCategorias((prev) => prev.filter(c => c.id !== id));
      }
    }
  };

  const handleDeleteTiempo = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este tiempo?")) {
      const { error } = await supabase.from('lap_times').delete().eq('id', id);
      if (error) {
        console.error("Error exacto de Supabase al borrar tiempo:", error);
        alert(`Error al borrar tiempo: ${error.message}`);
      } else {
        setTiempos((prev) => prev.filter(t => t.id !== id));
      }
    }
  };

  const guardarEdicionTiempo = async (id: string | number) => {
    const trackMs = Math.round(parseFloat(tiempoEditado) * 1000);
    const penaltyMs = Math.round(parseFloat(penalizacionEditada) * 1000);

    if (isNaN(trackMs) || isNaN(penaltyMs)) {
      setMensajeTiempos({ texto: "Error: Por favor, introduce números válidos.", tipo: 'error' });
      setTimeout(() => setMensajeTiempos(null), 3000);
      return;
    }

    const totalMs = trackMs + penaltyMs;

    console.log("Intentando guardar -> ID:", id, "| Pista (ms):", trackMs, "| Penalty (ms):", penaltyMs);

    const { data, error } = await supabase
      .from('lap_times')
      .update({ track_time_ms: trackMs, penalty_ms: penaltyMs, total_time_ms: totalMs })
      .eq('id', id)
      .select();

    console.log("Respuesta BD:", data, "Error BD:", error);

    if (error) {
      console.error("Error al actualizar:", error);
      setMensajeTiempos({ texto: `Error al guardar: ${error.message}`, tipo: 'error' });
    } else {
      setEditandoTramoId(null);
      cargarDatos();
      setMensajeTiempos({ texto: "Tiempo actualizado con éxito", tipo: 'success' });
      setTimeout(() => setMensajeTiempos(null), 3000);
    }
  };

  return (
    <div className="bg-[#171717] min-h-screen p-2 md:p-8 flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-extrabold text-[#ededed] mb-4 md:mb-8 drop-shadow-sm text-center">Panel de Gestión</h1>

      {/* Tabs Menu */}
      <div className="tabs tabs-boxed bg-[#1e1e1e] p-2 rounded-2xl border border-[#333333] mb-8 w-full max-w-md mx-auto grid grid-cols-2 shadow-2xl">
        <button 
          className={`tab h-12 text-base font-bold rounded-xl transition-all ${activeTab === 'evento' ? 'bg-[#DA0037] text-white shadow-lg' : 'text-[#a1a1aa] hover:text-[#ededed]'}`}
          onClick={() => setActiveTab('evento')}
        >
          🏁 Prueba Actual
        </button>
        <button 
          className={`tab h-12 text-base font-bold rounded-xl transition-all ${activeTab === 'campeonatos' ? 'bg-[#DA0037] text-white shadow-lg' : 'text-[#a1a1aa] hover:text-[#ededed]'}`}
          onClick={() => setActiveTab('campeonatos')}
        >
          🏆 Campeonatos
        </button>
      </div>

      {activeTab === 'evento' && (
        <>
      {/* Configuración de Carrera (WRC Mode) */}
      <div className="w-full max-w-7xl mb-4 md:mb-8">
        <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] mb-4 md:mb-0 rounded-2xl md:rounded-3xl w-full">
          <div className="card-body p-4 md:p-8">
            <h2 className="card-title text-2xl font-bold mb-4 text-[#ededed]">Configuración del Rally</h2>
            
            {mensajeConfig && (
              <div className={`alert ${mensajeConfig.tipo === 'success' ? 'alert-success' : 'alert-error'} mb-4 shadow-sm text-white font-bold rounded-xl border-none`}>
                <span>{mensajeConfig.texto}</span>
              </div>
            )}

            <form onSubmit={handleGuardarConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-lg font-semibold text-[#a1a1aa]">Número de Tramos</span>
                </label>
                <input 
                  type="number" 
                  min="1"
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] text-xl py-6 px-4" 
                  value={tramos}
                  onChange={(e) => setTramos(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-lg font-semibold text-[#a1a1aa]">Número de Pasadas</span>
                </label>
                <input 
                  type="number" 
                  min="1"
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] text-xl py-6 px-4" 
                  value={pasadas}
                  onChange={(e) => setPasadas(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-control w-full">
                <button type="submit" className="btn btn-lg w-full h-[3.8rem] rounded-xl bg-gradient-to-r from-[#DA0037] to-[#b9002f] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(218,0,55,0.4)] border-none text-[#ededed] transition-all">
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-start">
        
        {/* Columna Izquierda: Pilotos y Categorías */}
        <div className="flex flex-col gap-4 md:gap-8">
          
          {/* Panel Pilotos */}
          <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-2xl md:rounded-3xl mb-4 md:mb-8">
            <div className="card-body p-4 md:p-8">
              <h2 className="card-title text-2xl font-bold mb-4">Gestión de Pilotos</h2>
              
              <form onSubmit={handleInsertPiloto} className="flex flex-col md:flex-row gap-2 mb-6 items-center">
                <input 
                  type="number" 
                  placeholder="Dorsal" 
                  className="input w-32 rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={nuevoDorsal}
                  onChange={(e) => setNuevoDorsal(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Nombre del nuevo piloto" 
                  className="input flex-1 w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={nuevoPiloto}
                  onChange={(e) => setNuevoPiloto(e.target.value)}
                  required
                />
                <button type="submit" className="btn rounded-full bg-[#DA0037] hover:bg-[#b9002f] border-none text-[#ededed] shadow-lg shadow-[#DA0037]/20 h-[3rem] px-6 flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <Plus size={20} />
                  <span>Añadir</span>
                </button>
              </form>

              <div className="overflow-x-auto max-h-64 border border-[#333333] rounded-2xl">
                <table className="table w-full text-base">
                  <thead className="bg-base-300 sticky top-0 z-10">
                    <tr>
                      <th className="w-20 text-center">Dorsal</th>
                      <th>Nombre</th>
                      <th className="w-16 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pilotos.map((p) => (
                      <tr key={p.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                        <td className="text-center font-mono font-bold text-[#a1a1aa] py-2 px-2 md:py-4 md:px-4">{p.dorsal || '-'}</td>
                        <td className="font-semibold py-2 px-2 md:py-4 md:px-4 text-[#ededed]">{p.name}</td>
                        <td className="text-center py-2 px-2 md:py-4 md:px-4">
                          <button 
                            className="btn btn-ghost btn-md text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                            onClick={() => setPilotoAEliminar(p)}
                            title="Eliminar Piloto"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pilotos.length === 0 && (
                      <tr><td colSpan={3} className="text-center italic text-base-content/50">No hay pilotos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Panel Categorías */}
          <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-2xl md:rounded-3xl">
            <div className="card-body p-4 md:p-8">
              <h2 className="card-title text-2xl font-bold mb-4">Gestión de Categorías</h2>
              
              <form onSubmit={handleInsertCategoria} className="flex gap-2 mb-6 items-center">
                <input 
                  type="text" 
                  placeholder="Nombre de la nueva categoría" 
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  required
                />
                <button type="submit" className="btn rounded-full bg-[#DA0037] hover:bg-[#b9002f] border-none text-[#ededed] shadow-lg shadow-[#DA0037]/20 h-full min-h-[3rem] px-6 flex items-center gap-2">
                  <Plus size={20} />
                  <span>Añadir</span>
                </button>
              </form>

              <div className="overflow-x-auto max-h-48 border border-[#333333] rounded-2xl">
                <table className="table w-full text-base">
                  <thead className="bg-base-300 sticky top-0 z-10">
                    <tr>
                      <th>Categoría</th>
                      <th className="w-16 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((c) => (
                      <tr key={c.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                        <td className="font-semibold py-2 px-2 md:py-4 md:px-4">{c.name}</td>
                        <td className="text-center py-2 px-2 md:py-4 md:px-4">
                          <button 
                            className="btn btn-ghost btn-md text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                            onClick={() => handleDeleteCategoria(c.id)}
                            title="Eliminar Categoría"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categorias.length === 0 && (
                      <tr><td colSpan={2} className="text-center italic text-base-content/50">No hay categorías</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Historial de Tiempos */}
        <div className="card bg-[#1e1e1e] shadow-2xl border border-[#333333] rounded-2xl md:rounded-3xl h-full">
          <div className="card-body p-4 md:p-8">
            <h2 className="card-title text-2xl font-bold mb-4 text-[#ededed]">Últimos 10 Tiempos Registrados</h2>
            <p className="text-sm text-[#a1a1aa] mb-4">Puedes editar ✏️ o borrar 🗑️ los registros en caso de error.</p>

            {mensajeTiempos && (
              <div className={`alert ${mensajeTiempos.tipo === 'success' ? 'alert-success' : 'alert-error'} mb-4 shadow-sm text-white font-bold rounded-xl border-none`}>
                <span>{mensajeTiempos.texto}</span>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-[#333333] flex-1">
              <table className="table w-full text-sm shrink-0">
                <thead className="bg-base-300">
                  <tr>
                    <th>Piloto</th>
                    <th>Cat.</th>
                    <th className="text-right">T. Pista + Pen.</th>
                    <th className="w-20 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tiempos.map((t) => {
                    const isEditing = t.id === editandoTramoId;
                    return (
                      <tr key={t.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                        <td className="font-semibold py-2 px-2 md:py-4 md:px-4 align-middle">{t.pilots?.name}</td>
                        <td className="py-2 px-2 md:py-4 md:px-4 align-middle"><span className="badge badge-sm badge-neutral rounded-full px-2">{t.categories?.name}</span></td>
                        
                        <td className="text-right font-mono py-2 px-2 md:py-4 md:px-4 align-middle">
                          {isEditing ? (
                            <div className="flex flex-col gap-1 items-end">
                              <input
                                type="number"
                                step="0.001"
                                className="input input-xs md:input-sm w-20 md:w-24 bg-[#121212] border border-[#333333] text-[#ededed] text-right font-mono rounded"
                                value={tiempoEditado}
                                onChange={(e) => setTiempoEditado(e.target.value)}
                                title="Tiempo Pista (seg)"
                              />
                              <input
                                type="number"
                                step="0.1"
                                className="input input-xs md:input-sm w-20 md:w-24 bg-error/10 border border-error/50 text-error text-right font-mono mt-1 rounded"
                                value={penalizacionEditada}
                                onChange={(e) => setPenalizacionEditada(e.target.value)}
                                title="Penalización (seg)"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-[#ededed]">{formatMs(t.track_time_ms)}</span>
                              {t.penalty_ms > 0 && <span className="text-error text-xs font-bold mt-1">(+{(t.penalty_ms / 1000).toFixed(1)}s)</span>}
                            </div>
                          )}
                        </td>
                        
                        <td className="text-center py-2 px-2 md:py-4 md:px-4 align-middle">
                          {isEditing ? (
                            <div className="flex justify-center gap-1">
                              <button 
                                className="btn btn-ghost btn-xs text-green-500 hover:bg-green-500/20 rounded" 
                                onClick={() => guardarEdicionTiempo(t.id)} 
                                title="Guardar cambios"
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                className="btn btn-ghost btn-xs text-[#a1a1aa] hover:bg-[#333333] rounded" 
                                onClick={() => setEditandoTramoId(null)} 
                                title="Cancelar"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1 md:gap-2">
                              <button 
                                className="btn btn-ghost btn-xs md:btn-sm text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded-full transition-colors"
                                onClick={() => {
                                  setEditandoTramoId(t.id);
                                  setTiempoEditado((t.track_time_ms / 1000).toFixed(3));
                                  setPenalizacionEditada((t.penalty_ms / 1000).toFixed(1));
                                }}
                                title="Editar Tiempo"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                className="btn btn-ghost btn-xs md:btn-sm text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                                onClick={() => handleDeleteTiempo(t.id)}
                                title="Borrar Tiempo Erróneo"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {tiempos.length === 0 && (
                    <tr><td colSpan={4} className="text-center italic text-base-content/50 p-4">No hay tiempos en el historial</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>

      </div>

      {/* Modal de Confirmación para Elitear Pilotos */}
      {pilotoAEliminar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 md:p-8 rounded-3xl max-w-md w-full border border-error/50 shadow-[0_0_30px_rgba(255,0,0,0.15)] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-6 ring-2 ring-error">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#ededed] mb-4">⚠️ Eliminar Piloto</h3>
            <p className="text-[#a1a1aa] mb-8 text-base leading-relaxed">
              ¿Estás seguro de que quieres eliminar a <strong className="text-error">{pilotoAEliminar.name}</strong>? Si lo haces, se borrarán TAMBIÉN todos los tiempos que tenga registrados en cualquier pasada de la competición. <br/><br/>Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4 w-full">
              <button 
                className="btn flex-1 bg-[#333333] hover:bg-[#444444] border-none text-[#ededed] rounded-xl h-14"
                onClick={() => setPilotoAEliminar(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn flex-1 bg-error hover:bg-red-700 border-none text-white rounded-xl h-14 font-bold"
                onClick={confirmarBorradoPiloto}
              >
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}
      
        </>
      )}

      {activeTab === 'campeonatos' && userId && (
        <CampeonatosManager userId={userId} />
      )}

    </div>
  );
}
