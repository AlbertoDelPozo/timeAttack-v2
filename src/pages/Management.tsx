import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Pencil, Check, X, Users, Trophy, Clock } from 'lucide-react';
import Cronometrador from './Cronometrador';
import { useChampionshipData } from '../hooks/useChampionshipData';
import { ChampionshipAccordion } from '../components/management/ChampionshipAccordion';
import { ManagementModals } from '../components/management/ManagementModals';

const formatMs = (ms: number) => (ms / 1000).toFixed(3);

function ChampionshipManager({ userId }: { userId: string }) {
  const cd = useChampionshipData(userId);

  // States for Inscriptions
  const [modalInscripciones, setModalInscripciones] = useState<{ open: boolean, sessionId: string | null, rallyId: string | null }>({ open: false, sessionId: null, rallyId: null });
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [pilotosGlobal, setPilotosGlobal] = useState<any[]>([]);
  const [categoriasGlobal, setCategoriasGlobal] = useState<any[]>([]);
  const [nombrePiloto, setNombrePiloto] = useState('');
  const [apellidosPiloto, setApellidosPiloto] = useState('');
  const [catSel, setCatSel] = useState('');
  const [sesionInscripcion, setSesionInscripcion] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalCronometro, setModalCronometro] = useState<{ open: boolean, sessionId: string | null, rallyId: string | null }>({ open: false, sessionId: null, rallyId: null });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const cargarInscritosFormData = async (rallyId: string) => {
    const { data: insData } = await supabase.from('inscriptions').select('*, pilots(name), categories(name), rally_sessions(name)').eq('rally_id', rallyId);
    if (insData && isMounted.current) setInscritos(insData);
    
    const rallyActual = cd.rallies.find(r => r.id === rallyId);
    if (rallyActual) {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('championship_id', rallyActual.championship_id);
        
      if (catData && isMounted.current) setCategoriasGlobal(catData);
    }
  };

  useEffect(() => {
    if (modalInscripciones.open && modalInscripciones.rallyId) {
      cargarInscritosFormData(modalInscripciones.rallyId);
    } else {
      setInscritos([]);
    }
  }, [modalInscripciones.open, modalInscripciones.rallyId]);

  const handleDeleteInscription = async (id: string, rallyId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar a este piloto de la prueba?")) return;
    const { error } = await supabase.from('inscriptions').delete().eq('id', id);
    if (!error) cargarInscritosFormData(rallyId);
  };

  const handleInscribir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombrePiloto || !apellidosPiloto || !catSel || !sesionInscripcion || !modalInscripciones.rallyId) return;

    if (editingId) {
      const { error } = await supabase.from('inscriptions').update({
        category_id: Number(catSel),
        session_id: sesionInscripcion
      }).eq('id', editingId);

      if (error) {
         alert("Error al actualizar inscripción: " + error.message);
      } else {
         setEditingId(null);
         setNombrePiloto('');
         setApellidosPiloto('');
         setCatSel('');
         setSesionInscripcion('');
         cargarInscritosFormData(modalInscripciones.rallyId);
      }
      return;
    }

    const nombreCompleto = `${nombrePiloto.trim()} ${apellidosPiloto.trim()}`;
    
    // 1. UPSERT Lógico: Buscar si ya existe el piloto exacto para evitar duplicar el piloto en la tabla global
    let finalPilotId = '';
    const { data: existPilot } = await supabase.from('pilots').select('id').eq('name', nombreCompleto).eq('club_id', userId).maybeSingle();
    
    if (existPilot) {
        finalPilotId = existPilot.id;
    } else {
        const { data: newPilot, error: errPilot } = await supabase
          .from('pilots')
          .insert([{ name: nombreCompleto, club_id: userId }])
          .select('id').single();
          
        if (errPilot) {
            alert("Error creando piloto: " + errPilot.message);
            return;
        }
        finalPilotId = newPilot.id;
    }
    
    // 2. Verificar si el piloto ya está inscrito en ESTE rally
    const { data: existe, error: errCheck } = await supabase
      .from('inscriptions')
      .select('id, rally_sessions(name)')
      .eq('rally_id', modalInscripciones.rallyId)
      .eq('pilot_id', finalPilotId)
      .maybeSingle();

    if (errCheck) {
      alert("Error al verificar la base de datos.");
      return;
    }

    // 3. Bloquear inscripción duplicada
    if (existe) {
      const nombreCorte = (existe.rally_sessions as any)?.name || "otro corte";
      alert(`⚠️ Bloqueado: Este piloto ya está inscrito en esta prueba (asignado a: ${nombreCorte}). Solo puede participar una vez por Rally.`);
      return;
    }
    
    // 4. Insertar inscripción definitiva
    const { error } = await supabase.from('inscriptions').insert({
      rally_id: modalInscripciones.rallyId,
      session_id: sesionInscripcion,
      pilot_id: finalPilotId,
      category_id: Number(catSel)
    });
    
    if (error) {
       alert("Error al inscribir: " + error.message);
    } else {
       setNombrePiloto('');
       setApellidosPiloto('');
       setCatSel('');
       setSesionInscripcion('');
       cargarInscritosFormData(modalInscripciones.rallyId);
    }
  };

  return (
    <div className="w-full max-w-7xl flex flex-col gap-6">
      <ChampionshipAccordion 
        championships={cd.championships} rallies={cd.rallies} sessions={cd.sessions}
        expandedCamp={cd.expandedCamp} setExpandedCamp={cd.setExpandedCamp}
        expandedRally={cd.expandedRally} setExpandedRally={cd.setExpandedRally}
        setModalCamp={cd.setModalCamp} setModalRally={cd.setModalRally} setModalSession={cd.setModalSession}
        setModalInscripciones={setModalInscripciones} setModalCronometro={setModalCronometro}
        deleteChampionship={cd.deleteChampionship}
        deleteRally={cd.deleteRally}
        deleteSession={cd.deleteSession}
      />
      <ManagementModals 
        modalCamp={cd.modalCamp} setModalCamp={cd.setModalCamp} formCamp={cd.formCamp} setFormCamp={cd.setFormCamp} handleCreateChampionship={cd.handleCreateChampionship}
        modalRally={cd.modalRally} setModalRally={cd.setModalRally} formRally={cd.formRally} setFormRally={cd.setFormRally} handleCreateRally={cd.handleCreateRally}
        modalSession={cd.modalSession} setModalSession={cd.setModalSession} formSession={cd.formSession} setFormSession={cd.setFormSession} handleCreateSession={cd.handleCreateSession}
      />
      
      {modalInscripciones.open && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-start z-50 p-2 md:p-6 overflow-y-auto w-full h-full">
          <div className="w-full max-w-4xl flex justify-end mb-2 mt-4">
            <button className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full p-2 transition-colors" onClick={() => setModalInscripciones({ open: false, sessionId: null, rallyId: null })}>
              <X size={24} />
            </button>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-xl shadow-black/40 overflow-hidden max-w-4xl w-full p-6 md:p-8 mb-6">
            <h3 className="text-2xl font-semibold tracking-tight text-white mb-6 flex items-center gap-2 border-b border-zinc-800/40 pb-4"><Users className="text-red-500" /> Inscripciones de la Prueba: {cd.rallies.find(r => r.id === modalInscripciones.rallyId)?.name || ''}</h3>
            
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/60 p-4 mb-6 shadow-inner">
              <h4 className="text-zinc-400 font-bold mb-3 text-xs uppercase tracking-wider block">Pilotos Inscritos ({inscritos.length})</h4>
              <div className="max-h-40 overflow-y-auto pr-2">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50 bg-zinc-950/30">
                    <tr>
                      <th className="py-2 pl-2 font-medium">Piloto</th>
                      <th className="py-2 text-center font-medium">Sesión</th>
                      <th className="py-2 text-center font-medium">Categoría</th>
                      <th className="py-2 pr-2 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscritos.map(ins => (
                      <tr key={ins.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/50 transition-colors">
                        <td className="text-zinc-200 font-medium py-2 pl-2">{ins.pilots?.name}</td>
                        <td className="text-center py-2"><span className="badge bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-sm text-xs px-3 truncate max-w-[120px]">{ins.rally_sessions?.name || '-'}</span></td>
                        <td className="text-center py-2"><span className="badge bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm text-xs px-3">{ins.categories?.name}</span></td>
                        <td className="text-right py-2 pr-2">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              type="button"
                              className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                              title="Editar"
                              onClick={() => {
                                setEditingId(ins.id);
                                const parts = ins.pilots?.name?.split(' ') || [];
                                setNombrePiloto(parts[0] || '');
                                setApellidosPiloto(parts.slice(1).join(' ') || '');
                                setCatSel(ins.category_id?.toString() || '');
                                setSesionInscripcion(ins.session_id?.toString() || '');
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              type="button"
                              className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                              title="Eliminar"
                              onClick={() => modalInscripciones.rallyId && handleDeleteInscription(ins.id, modalInscripciones.rallyId)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {inscritos.length === 0 && <tr><td colSpan={4} className="text-zinc-500 italic text-center py-4">Sin inscripciones todavía en esta prueba.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleInscribir} className="flex flex-col md:flex-row gap-4 items-end bg-zinc-950/40 p-6 rounded-xl border border-zinc-800/60 shadow-inner mb-8">
              <div className="flex-[1.5] w-full grid grid-cols-2 gap-3">
                <div>
                  <label className="label py-1"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre</span></label>
                  <input required disabled={!!editingId} type="text" placeholder="Ej. Carlos" className={`w-full ${editingId ? 'bg-zinc-900 border-zinc-800/50 text-zinc-500 cursor-not-allowed' : 'bg-zinc-950/80 border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500/50 focus:border-red-500'} text-sm rounded-lg block p-2.5 outline-none transition-all border`} value={nombrePiloto} onChange={e => setNombrePiloto(e.target.value)} />
                </div>
                <div>
                  <label className="label py-1"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Apellidos</span></label>
                  <input required disabled={!!editingId} type="text" placeholder="Ej. Sainz" className={`w-full ${editingId ? 'bg-zinc-900 border-zinc-800/50 text-zinc-500 cursor-not-allowed' : 'bg-zinc-950/80 border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500/50 focus:border-red-500'} text-sm rounded-lg block p-2.5 outline-none transition-all border`} value={apellidosPiloto} onChange={e => setApellidosPiloto(e.target.value)} />
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="label py-1"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Coche / Categoría</span></label>
                <select required className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500 appearance-none" value={catSel} onChange={e => setCatSel(e.target.value)}>
                  <option value="" disabled>Seleccionar categoría...</option>
                  {categoriasGlobal.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="label py-1"><span className="block mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Corte / Sesión de Salida</span></label>
                <select required className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm rounded-lg block p-2.5 outline-none transition-all focus:ring-2 focus:ring-red-500/50 focus:border-red-500 appearance-none" value={sesionInscripcion} onChange={e => setSesionInscripcion(e.target.value)}>
                  <option value="" disabled>Seleccionar corte...</option>
                  {cd.sessions.filter(s => s.rally_id === modalInscripciones.rallyId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {editingId ? (
                <button type="button" onClick={() => { setEditingId(null); setNombrePiloto(''); setApellidosPiloto(''); setCatSel(''); setSesionInscripcion(''); }} className="flex justify-center items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 text-sm font-medium rounded-lg transition-all border-none w-full md:w-auto h-[42px]">
                  Cancelar
                </button>
              ) : null}
              <button type="submit" className={`flex justify-center items-center px-4 py-2 text-white shadow-md shadow-red-900/20 active:scale-95 text-sm ${editingId ? 'bg-red-700 hover:bg-red-600 font-bold border border-red-500' : 'bg-red-600 hover:bg-red-500 font-medium border-none'} rounded-lg transition-all w-full md:w-auto whitespace-nowrap h-[42px]`}>
                {editingId ? 'Actualizar Inscripción' : 'Añadir Piloto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalCronometro.open && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-start z-[60] p-0 md:p-6 overflow-y-auto w-full h-full">
          <div className="w-full max-w-4xl flex justify-end mb-2 mt-4 px-4 md:px-0">
            <button className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full p-2 transition-colors shadow-lg" onClick={() => setModalCronometro({ open: false, sessionId: null, rallyId: null })}>
              <X size={24} />
            </button>
          </div>
          <div className="w-full max-w-4xl relative">
             <Cronometrador userId={userId} sessionId={modalCronometro.sessionId || undefined} rallyId={modalCronometro.rallyId || undefined} />
          </div>
        </div>
      )}

    </div>
  );
}

export default function Management({ userId }: { userId?: string }) {
  const [activeTab, setActiveTab] = useState<'evento' | 'campeonatos'>('evento');

  const [pilots, setPilots] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [lapTimes, setLapTimes] = useState<any[]>([]);

  const [newPilot, setNewPilot] = useState('');
  const [newDorsal, setNewDorsal] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [pilotToDelete, setPilotToDelete] = useState<any | null>(null);

  // Configuración de Carrera
  const [stages, setStages] = useState<number | ''>('');
  const [passes, setPasses] = useState<number | ''>('');
  const [mensajeConfig, setMensajeConfig] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  // Edición Inline de Tiempos
  const [editandoTramoId, setEditandoTramoId] = useState<string | number | null>(null);
  const [tiempoEditado, setTiempoEditado] = useState('');
  const [penalizacionEditada, setPenalizacionEditada] = useState('');
  const [mensajeTiempos, setMensajeTiempos] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadEventData = async () => {
    if (!userId) return;

    try {
      // Cargar Pilotos
      const { data: pData, error: pError } = await supabase.from('pilots').select('*').eq('club_id', userId).order('name');
      if (pError) throw pError;
      if (isMounted.current && pData) setPilots(pData);

      // Cargar Categorías
      const { data: cData, error: cError } = await supabase.from('categories').select('*').eq('club_id', userId).order('name');
      if (cError) throw cError;
      if (isMounted.current && cData) setCategories(cData);

      // Cargar últimos 10 tiempos (aislados al evento genérico)
      const { data: tData, error: tError } = await supabase
        .from('lap_times')
        .select('*, pilots(name), categories(name)')
        .eq('club_id', userId)
        .is('session_id', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (tError) throw tError;
      if (isMounted.current && tData) setLapTimes(tData);

      // Cargar Configuración de Carrera
      const { data: configData, error: configError } = await supabase.from('race_config').select('*').eq('club_id', userId).maybeSingle();
      if (configError) throw configError;
      if (isMounted.current && configData) {
        setStages(configData.num_tramos || 1);
        setPasses(configData.num_pasadas || 1);
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
    loadEventData();
  }, [userId]);

  const handleInsertPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPilot.trim() || !userId) return;

    const dorsalValue = newDorsal.trim() ? parseInt(newDorsal, 10) : null;
    await supabase.from('pilots').insert({ name: newPilot, dorsal: dorsalValue, club_id: userId });
    
    setNewPilot('');
    setNewDorsal('');
    loadEventData();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeConfig(null);
    
    if (stages === '' || passes === '' || !userId) return;

    // Verificar si existe configuración para este club
    const { data: exist } = await supabase.from('race_config').select('id').eq('club_id', userId).maybeSingle();

    let error;
    if (exist) {
      const { error: updateError } = await supabase
        .from('race_config')
        .update({ num_tramos: Number(stages), num_pasadas: Number(passes) })
        .eq('club_id', userId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('race_config')
        .insert({ num_tramos: Number(stages), num_pasadas: Number(passes), club_id: userId });
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

  const handleInsertCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !userId) return;

    await supabase.from('categories').insert({ name: newCategory, club_id: userId });
    setNewCategory('');
    loadEventData();
  };

  const confirmDeletePilot = async () => {
    if (!pilotToDelete) return;

    // Paso A: Borrar tiempos asociados
    const { error: errTiempos } = await supabase.from('lap_times').delete().eq('pilot_id', pilotToDelete.id);
    if (errTiempos) {
      console.error("Error al borrar tiempos asociados:", errTiempos);
      alert(`Error al vaciar tiempos del piloto: ${errTiempos.message}`);
      return;
    }

    // Paso B: Borrar piloto
    const { error: errPiloto } = await supabase.from('pilots').delete().eq('id', pilotToDelete.id);
    if (errPiloto) {
      console.error("Error exacto de Supabase al borrar piloto:", errPiloto);
      alert(`Error al borrar piloto: ${errPiloto.message}`);
      return;
    }

    // Paso C: Refrescar y cerrar modal
    setPilots((prev) => prev.filter(p => p.id !== pilotToDelete.id));
    setLapTimes((prev) => prev.filter(t => t.pilot_id !== pilotToDelete.id));
    setPilotToDelete(null);
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error("Error exacto de Supabase al borrar categoría:", error);
        alert(`Error al borrar categoría: ${error.message}`);
      } else {
        setCategories((prev) => prev.filter(c => c.id !== id));
      }
    }
  };

  const handleDeleteLapTime = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este tiempo?")) {
      const { error } = await supabase.from('lap_times').delete().eq('id', id);
      if (error) {
        console.error("Error exacto de Supabase al borrar tiempo:", error);
        alert(`Error al borrar tiempo: ${error.message}`);
      } else {
        setLapTimes((prev) => prev.filter(t => t.id !== id));
      }
    }
  };

  const saveLapTimeEdit = async (id: string | number) => {
    const trackMs = Math.round(parseFloat(tiempoEditado) * 1000);
    const penaltyMs = Math.round(parseFloat(penalizacionEditada) * 1000);

    if (isNaN(trackMs) || isNaN(penaltyMs)) {
      setMensajeTiempos({ texto: "Error: Por favor, introduce números válidos.", tipo: 'error' });
      setTimeout(() => setMensajeTiempos(null), 3000);
      return;
    }

    const totalMs = trackMs + penaltyMs;

    const { error } = await supabase
      .from('lap_times')
      .update({ track_time_ms: trackMs, penalty_ms: penaltyMs, total_time_ms: totalMs })
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error al actualizar:", error);
      setMensajeTiempos({ texto: `Error al guardar: ${error.message}`, tipo: 'error' });
    } else {
      setEditandoTramoId(null);
      loadEventData();
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

            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-lg font-semibold text-[#a1a1aa]">Número de Tramos</span>
                </label>
                <input 
                  type="number" 
                  min="1"
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] text-xl py-6 px-4" 
                  value={stages}
                  onChange={(e) => setStages(e.target.value === '' ? '' : Number(e.target.value))}
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
                  value={passes}
                  onChange={(e) => setPasses(e.target.value === '' ? '' : Number(e.target.value))}
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
              
              <form onSubmit={handleInsertPilot} className="flex flex-col md:flex-row gap-2 mb-6 items-center">
                <input 
                  type="number" 
                  placeholder="Dorsal" 
                  className="input w-32 rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={newDorsal}
                  onChange={(e) => setNewDorsal(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Nombre del nuevo piloto" 
                  className="input flex-1 w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={newPilot}
                  onChange={(e) => setNewPilot(e.target.value)}
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
                    {pilots.map((p) => (
                      <tr key={p.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                        <td className="text-center font-mono font-bold text-[#a1a1aa] py-2 px-2 md:py-4 md:px-4">{p.dorsal || '-'}</td>
                        <td className="font-semibold py-2 px-2 md:py-4 md:px-4 text-[#ededed]">{p.name}</td>
                        <td className="text-center py-2 px-2 md:py-4 md:px-4">
                          <button 
                            className="btn btn-ghost btn-md text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                            onClick={() => setPilotToDelete(p)}
                            title="Eliminar Piloto"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pilots.length === 0 && (
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
              
              <form onSubmit={handleInsertCategory} className="flex gap-2 mb-6 items-center">
                <input 
                  type="text" 
                  placeholder="Nombre de la nueva categoría" 
                  className="input w-full rounded-xl bg-[#121212] border border-[#333333] focus:border-[#DA0037] focus:ring-1 focus:ring-[#DA0037] focus:outline-none text-[#ededed] py-6 px-4" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
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
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-[#2a2a2a] transition-colors border-b border-[#333333]">
                        <td className="font-semibold py-2 px-2 md:py-4 md:px-4">{c.name}</td>
                        <td className="text-center py-2 px-2 md:py-4 md:px-4">
                          <button 
                            className="btn btn-ghost btn-md text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ff0000] rounded-full transition-colors"
                            onClick={() => handleDeleteCategory(c.id)}
                            title="Eliminar Categoría"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
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
                  {lapTimes.map((t) => {
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
                                onClick={() => saveLapTimeEdit(t.id)} 
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
                                onClick={() => handleDeleteLapTime(t.id)}
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
                  {lapTimes.length === 0 && (
                    <tr><td colSpan={4} className="text-center italic text-base-content/50 p-4">No hay tiempos en el historial</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>

      </div>

      {/* Modal de Confirmación para Elitear Pilotos */}
      {pilotToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 md:p-8 rounded-3xl max-w-md w-full border border-error/50 shadow-[0_0_30px_rgba(255,0,0,0.15)] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-6 ring-2 ring-error">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#ededed] mb-4">⚠️ Eliminar Piloto</h3>
            <p className="text-[#a1a1aa] mb-8 text-base leading-relaxed">
              ¿Estás seguro de que quieres eliminar a <strong className="text-error">{pilotToDelete.name}</strong>? Si lo haces, se borrarán TAMBIÉN todos los tiempos que tenga registrados en cualquier pasada de la competición. <br/><br/>Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4 w-full">
              <button 
                className="btn flex-1 bg-[#333333] hover:bg-[#444444] border-none text-[#ededed] rounded-xl h-14"
                onClick={() => setPilotToDelete(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn flex-1 bg-error hover:bg-red-700 border-none text-white rounded-xl h-14 font-bold"
                onClick={confirmDeletePilot}
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
        <ChampionshipManager userId={userId} />
      )}

    </div>
  );
}
