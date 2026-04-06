import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Pencil, Check, X, Users, Trophy, Clock } from 'lucide-react';
import Cronometrador from './Cronometrador';
import { useChampionshipData } from '../hooks/useChampionshipData';
import { ChampionshipAccordion } from '../components/management/ChampionshipAccordion';
import { ManagementModals } from '../components/management/ManagementModals';
import {
  Button, Input, Select, SelectItem, Card, CardBody,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Tabs, Tab, Chip
} from '@nextui-org/react';

const formatMs = (ms: number) => (ms / 1000).toFixed(3);

// ─────────────────────────────────────────────
// Championship Manager (sub-componente interno)
// ─────────────────────────────────────────────
function ChampionshipManager({ userId }: { userId: string }) {
  const cd = useChampionshipData(userId);

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

    let finalPilotId = '';
    const { data: existPilot } = await supabase.from('pilots').select('id').eq('name', nombreCompleto).eq('club_id', userId).maybeSingle();

    if (existPilot) {
      finalPilotId = existPilot.id;
    } else {
      const { data: newPilot, error: errPilot } = await supabase
        .from('pilots')
        .insert([{ name: nombreCompleto, club_id: userId }])
        .select('id').single();
      if (errPilot) { alert("Error creando piloto: " + errPilot.message); return; }
      finalPilotId = newPilot.id;
    }

    const { data: existe, error: errCheck } = await supabase
      .from('inscriptions')
      .select('id, rally_sessions(name)')
      .eq('rally_id', modalInscripciones.rallyId)
      .eq('pilot_id', finalPilotId)
      .maybeSingle();

    if (errCheck) { alert("Error al verificar la base de datos."); return; }

    if (existe) {
      const nombreCorte = (existe.rally_sessions as any)?.name || "otro corte";
      alert(`⚠️ Bloqueado: Este piloto ya está inscrito en esta prueba (asignado a: ${nombreCorte}). Solo puede participar una vez por Rally.`);
      return;
    }

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

      {/* ─── Modal Inscripciones ─── */}
      <Modal
        isOpen={modalInscripciones.open}
        onOpenChange={(open) => { if (!open) setModalInscripciones({ open: false, sessionId: null, rallyId: null }); }}
        backdrop="blur"
        size="4xl"
        placement="bottom-center"
        scrollBehavior="inside"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800/80 sm:rounded-2xl",
          header: "border-b border-zinc-800/60",
          footer: "border-t border-zinc-800/60",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Users className="text-primary" size={20} />
                <span className="text-white">Inscripciones: {cd.rallies.find(r => r.id === modalInscripciones.rallyId)?.name || ''}</span>
              </ModalHeader>
              <ModalBody className="py-5 gap-5">
                {/* Tabla de inscritos */}
                <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/60 p-4 shadow-inner">
                  <h4 className="text-zinc-400 font-bold mb-3 text-xs uppercase tracking-wider">
                    Pilotos Inscritos ({inscritos.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm text-left">
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
                            <td className="text-center py-2">
                              <Chip size="sm" variant="flat" className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs">
                                {ins.rally_sessions?.name || '-'}
                              </Chip>
                            </td>
                            <td className="text-center py-2">
                              <Chip size="sm" variant="flat" className="bg-zinc-800 text-zinc-100 border border-zinc-700 text-xs">
                                {ins.categories?.name}
                              </Chip>
                            </td>
                            <td className="text-right py-2 pr-2">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  className="text-zinc-400 hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors"
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
                                  className="text-zinc-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors"
                                  title="Eliminar"
                                  onClick={() => modalInscripciones.rallyId && handleDeleteInscription(ins.id, modalInscripciones.rallyId)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {inscritos.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-zinc-500 italic text-center py-6">
                              Sin inscripciones todavía en esta prueba.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formulario inscripción */}
                <form onSubmit={handleInscribir} id="form-inscribir" className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Nombre"
                      placeholder="Ej. Carlos"
                      variant="bordered"
                      color="primary"
                      isDisabled={!!editingId}
                      isRequired
                      value={nombrePiloto}
                      onValueChange={setNombrePiloto}
                      classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                    />
                    <Input
                      label="Apellidos"
                      placeholder="Ej. Sainz"
                      variant="bordered"
                      color="primary"
                      isDisabled={!!editingId}
                      isRequired
                      value={apellidosPiloto}
                      onValueChange={setApellidosPiloto}
                      classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Coche / Categoría"
                      variant="bordered"
                      color="primary"
                      isRequired
                      selectedKeys={catSel ? [catSel] : []}
                      onSelectionChange={(keys) => setCatSel(Array.from(keys)[0] as string)}
                      classNames={{ trigger: "border-zinc-700", label: "text-zinc-400", value: "text-zinc-100" }}
                    >
                      {categoriasGlobal.map(c => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Corte / Sesión de Salida"
                      variant="bordered"
                      color="primary"
                      isRequired
                      selectedKeys={sesionInscripcion ? [sesionInscripcion] : []}
                      onSelectionChange={(keys) => setSesionInscripcion(Array.from(keys)[0] as string)}
                      classNames={{ trigger: "border-zinc-700", label: "text-zinc-400", value: "text-zinc-100" }}
                    >
                      {cd.sessions.filter(s => s.rally_id === modalInscripciones.rallyId).map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                {editingId ? (
                  <Button
                    variant="flat"
                    color="default"
                    onPress={() => { setEditingId(null); setNombrePiloto(''); setApellidosPiloto(''); setCatSel(''); setSesionInscripcion(''); }}
                    className="text-zinc-300"
                  >
                    Cancelar Edición
                  </Button>
                ) : (
                  <Button variant="flat" color="default" onPress={onClose} className="text-zinc-300">
                    Cerrar
                  </Button>
                )}
                <Button
                  type="submit"
                  form="form-inscribir"
                  color="primary"
                  variant="shadow"
                  className="font-semibold"
                >
                  {editingId ? 'Actualizar Inscripción' : 'Añadir Piloto'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ─── Modal Cronómetro ─── */}
      <Modal
        isOpen={modalCronometro.open}
        onOpenChange={(open) => { if (!open) setModalCronometro({ open: false, sessionId: null, rallyId: null }); }}
        backdrop="blur"
        size="4xl"
        placement="bottom-center"
        scrollBehavior="inside"
        classNames={{
          base: "bg-zinc-950 border border-zinc-800/60 sm:rounded-2xl max-h-[95vh]",
          closeButton: "text-zinc-400 hover:text-white hover:bg-zinc-800",
        }}
      >
        <ModalContent>
          {() => (
            <ModalBody className="p-0">
              <Cronometrador userId={userId} sessionId={modalCronometro.sessionId || undefined} rallyId={modalCronometro.rallyId || undefined} />
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Management (componente principal exportado)
// ─────────────────────────────────────────────
export default function Management({ userId }: { userId?: string }) {
  const [activeTab, setActiveTab] = useState<'evento' | 'campeonatos'>('evento');

  const [pilots, setPilots] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [lapTimes, setLapTimes] = useState<any[]>([]);

  const [newPilot, setNewPilot] = useState('');
  const [newDorsal, setNewDorsal] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [pilotToDelete, setPilotToDelete] = useState<any | null>(null);

  const [stages, setStages] = useState<number | ''>('');
  const [passes, setPasses] = useState<number | ''>('');
  const [mensajeConfig, setMensajeConfig] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

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
      const { data: pData, error: pError } = await supabase.from('pilots').select('*').eq('club_id', userId).order('name');
      if (pError) throw pError;
      if (isMounted.current && pData) setPilots(pData);

      const { data: cData, error: cError } = await supabase.from('categories').select('*').eq('club_id', userId).order('name');
      if (cError) throw cError;
      if (isMounted.current && cData) setCategories(cData);

      const { data: tData, error: tError } = await supabase
        .from('lap_times')
        .select('*, pilots(name), categories(name)')
        .eq('club_id', userId)
        .is('session_id', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (tError) throw tError;
      if (isMounted.current && tData) setLapTimes(tData);

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

  useEffect(() => { loadEventData(); }, [userId]);

  const handleInsertPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPilot.trim() || !userId) return;
    const dorsalValue = newDorsal.trim() ? parseInt(newDorsal, 10) : null;
    await supabase.from('pilots').insert({ name: newPilot, dorsal: dorsalValue, club_id: userId });
    setNewPilot(''); setNewDorsal('');
    loadEventData();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeConfig(null);
    if (stages === '' || passes === '' || !userId) return;

    const { data: exist } = await supabase.from('race_config').select('id').eq('club_id', userId).maybeSingle();
    let error;
    if (exist) {
      const { error: updateError } = await supabase.from('race_config').update({ num_tramos: Number(stages), num_pasadas: Number(passes) }).eq('club_id', userId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('race_config').insert({ num_tramos: Number(stages), num_pasadas: Number(passes), club_id: userId });
      error = insertError;
    }

    if (error) {
      setMensajeConfig({ texto: `Error al guardar: ${error.message}`, tipo: 'error' });
    } else {
      setMensajeConfig({ texto: "Rally configurado con éxito ✓", tipo: 'success' });
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
    const { error: errTiempos } = await supabase.from('lap_times').delete().eq('pilot_id', pilotToDelete.id);
    if (errTiempos) { alert(`Error al vaciar tiempos del piloto: ${errTiempos.message}`); return; }
    const { error: errPiloto } = await supabase.from('pilots').delete().eq('id', pilotToDelete.id);
    if (errPiloto) { alert(`Error al borrar piloto: ${errPiloto.message}`); return; }
    setPilots((prev) => prev.filter(p => p.id !== pilotToDelete.id));
    setLapTimes((prev) => prev.filter(t => t.pilot_id !== pilotToDelete.id));
    setPilotToDelete(null);
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) { alert(`Error al borrar categoría: ${error.message}`); }
      else { setCategories((prev) => prev.filter(c => c.id !== id)); }
    }
  };

  const handleDeleteLapTime = async (id: string | number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este tiempo?")) {
      const { error } = await supabase.from('lap_times').delete().eq('id', id);
      if (error) { alert(`Error al borrar tiempo: ${error.message}`); }
      else { setLapTimes((prev) => prev.filter(t => t.id !== id)); }
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
    const { error } = await supabase.from('lap_times').update({ track_time_ms: trackMs, penalty_ms: penaltyMs, total_time_ms: totalMs }).eq('id', id).select();
    if (error) {
      setMensajeTiempos({ texto: `Error al guardar: ${error.message}`, tipo: 'error' });
    } else {
      setEditandoTramoId(null);
      loadEventData();
      setMensajeTiempos({ texto: "Tiempo actualizado con éxito ✓", tipo: 'success' });
      setTimeout(() => setMensajeTiempos(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center py-4">
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6 md:mb-8 drop-shadow-sm text-center tracking-tight">
        Panel de Gestión
      </h1>

      {/* ─── Tabs ─── */}
      <div className="w-full max-w-md mx-auto mb-8">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as 'evento' | 'campeonatos')}
          color="primary"
          variant="solid"
          fullWidth
          classNames={{
            tabList: "bg-zinc-900 border border-zinc-800 rounded-2xl p-1 shadow-2xl",
            tab: "h-11 text-sm font-bold rounded-xl",
            cursor: "bg-primary shadow-lg shadow-primary/20",
            tabContent: "group-data-[selected=true]:text-white text-zinc-400",
          }}
        >
          <Tab key="evento" title="🏁 Prueba Actual" />
          <Tab key="campeonatos" title="🏆 Campeonatos" />
        </Tabs>
      </div>

      {/* ─── TAB: Prueba Actual ─── */}
      {activeTab === 'evento' && (
        <>
          {/* Configuración Rally */}
          <div className="w-full max-w-7xl mb-6">
            <Card isBlurred className="bg-zinc-900/70 border border-zinc-800/80 shadow-2xl">
              <CardBody className="p-5 md:p-8">
                <h2 className="text-2xl font-bold mb-5 text-white">Configuración del Rally</h2>

                {mensajeConfig && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold border ${mensajeConfig.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {mensajeConfig.texto}
                  </div>
                )}

                <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <Input
                    label="Número de Tramos"
                    type="number"
                    min="1"
                    variant="bordered"
                    color="primary"
                    value={String(stages)}
                    onValueChange={(v) => setStages(v === '' ? '' : Number(v))}
                    classNames={{ input: "text-zinc-100 text-lg", label: "text-zinc-400 font-semibold" }}
                    isRequired
                  />
                  <Input
                    label="Número de Pasadas"
                    type="number"
                    min="1"
                    variant="bordered"
                    color="primary"
                    value={String(passes)}
                    onValueChange={(v) => setPasses(v === '' ? '' : Number(v))}
                    classNames={{ input: "text-zinc-100 text-lg", label: "text-zinc-400 font-semibold" }}
                    isRequired
                  />
                  <Button
                    type="submit"
                    color="primary"
                    variant="shadow"
                    size="lg"
                    className="w-full font-bold tracking-wide"
                  >
                    Guardar Configuración
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Grid: Pilotos + Categorías | Tiempos */}
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

            {/* Columna Izquierda */}
            <div className="flex flex-col gap-5">
              {/* Panel Pilotos */}
              <Card isBlurred className="bg-zinc-900/70 border border-zinc-800/80 shadow-xl">
                <CardBody className="p-5 md:p-7">
                  <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
                    <Users size={20} className="text-zinc-400" /> Gestión de Pilotos
                  </h2>
                  <form onSubmit={handleInsertPilot} className="flex flex-col sm:flex-row gap-2 mb-4 items-end">
                    <Input
                      type="number"
                      placeholder="Dorsal"
                      variant="bordered"
                      color="primary"
                      value={newDorsal}
                      onValueChange={setNewDorsal}
                      className="w-full sm:w-28"
                      classNames={{ input: "text-zinc-100", inputWrapper: "border-zinc-700" }}
                    />
                    <Input
                      type="text"
                      placeholder="Nombre del nuevo piloto"
                      variant="bordered"
                      color="primary"
                      value={newPilot}
                      onValueChange={setNewPilot}
                      isRequired
                      classNames={{ input: "text-zinc-100", inputWrapper: "flex-1 border-zinc-700" }}
                    />
                    <Button
                      type="submit"
                      color="primary"
                      variant="shadow"
                      startContent={<Plus size={18} />}
                      className="w-full sm:w-auto font-semibold"
                    >
                      Añadir
                    </Button>
                  </form>

                  <div className="overflow-x-auto max-h-64 rounded-xl border border-zinc-800/60">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-zinc-500 uppercase tracking-wider bg-zinc-950/60 sticky top-0 z-10">
                        <tr>
                          <th className="py-3 pl-3 font-medium text-center w-20">Dorsal</th>
                          <th className="py-3 font-medium">Nombre</th>
                          <th className="py-3 pr-3 font-medium text-center w-16">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pilots.map((p) => (
                          <tr key={p.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40 transition-colors">
                            <td className="text-center font-mono font-bold text-zinc-500 py-3 pl-3">{p.dorsal || '-'}</td>
                            <td className="font-semibold py-3 text-zinc-200">{p.name}</td>
                            <td className="text-center py-3 pr-3">
                              <button
                                className="text-zinc-600 hover:text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors"
                                onClick={() => setPilotToDelete(p)}
                                title="Eliminar Piloto"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {pilots.length === 0 && (
                          <tr><td colSpan={3} className="text-center italic text-zinc-600 py-6">No hay pilotos</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>

              {/* Panel Categorías */}
              <Card isBlurred className="bg-zinc-900/70 border border-zinc-800/80 shadow-xl">
                <CardBody className="p-5 md:p-7">
                  <h2 className="text-xl font-bold mb-5 text-white">Gestión de Categorías</h2>
                  <form onSubmit={handleInsertCategory} className="flex gap-2 mb-5 items-end">
                    <Input
                      type="text"
                      placeholder="Nombre de la nueva categoría"
                      variant="bordered"
                      color="primary"
                      value={newCategory}
                      onValueChange={setNewCategory}
                      isRequired
                      classNames={{ input: "text-zinc-100", inputWrapper: "flex-1 border-zinc-700" }}
                    />
                    <Button
                      type="submit"
                      color="primary"
                      variant="shadow"
                      startContent={<Plus size={18} />}
                      className="font-semibold"
                    >
                      Añadir
                    </Button>
                  </form>
                  <div className="overflow-x-auto max-h-48 rounded-xl border border-zinc-800/60">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-zinc-500 uppercase tracking-wider bg-zinc-950/60 sticky top-0 z-10">
                        <tr>
                          <th className="py-3 pl-3 font-medium">Categoría</th>
                          <th className="py-3 pr-3 font-medium text-center w-16">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c) => (
                          <tr key={c.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40 transition-colors">
                            <td className="font-semibold py-3 pl-3 text-zinc-200">{c.name}</td>
                            <td className="text-center py-3 pr-3">
                              <button
                                className="text-zinc-600 hover:text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors"
                                onClick={() => handleDeleteCategory(c.id)}
                                title="Eliminar Categoría"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {categories.length === 0 && (
                          <tr><td colSpan={2} className="text-center italic text-zinc-600 py-6">No hay categorías</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Columna Derecha: Historial */}
            <Card isBlurred className="bg-zinc-900/70 border border-zinc-800/80 shadow-xl h-full">
              <CardBody className="p-5 md:p-7">
                <h2 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
                  <Clock size={20} className="text-zinc-400" /> Últimos 10 Tiempos
                </h2>
                <p className="text-sm text-zinc-500 mb-5">Edita ✏️ o borra 🗑️ los registros en caso de error.</p>

                {mensajeTiempos && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold border ${mensajeTiempos.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {mensajeTiempos.texto}
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-zinc-800/60">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-zinc-500 uppercase tracking-wider bg-zinc-950/60">
                      <tr>
                        <th className="py-3 pl-3 font-medium">Piloto</th>
                        <th className="py-3 font-medium">Cat.</th>
                        <th className="py-3 text-right font-medium">T. Pista + Pen.</th>
                        <th className="py-3 pr-3 text-center font-medium w-20">Acc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lapTimes.map((t) => {
                        const isEditing = t.id === editandoTramoId;
                        return (
                          <tr key={t.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40 transition-colors">
                            <td className="font-semibold py-3 pl-3 text-zinc-200 align-middle">{t.pilots?.name}</td>
                            <td className="py-3 align-middle">
                              <Chip size="sm" variant="flat" className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs">
                                {t.categories?.name}
                              </Chip>
                            </td>
                            <td className="text-right font-mono py-3 align-middle">
                              {isEditing ? (
                                <div className="flex flex-col gap-1 items-end">
                                  <input
                                    type="number" step="0.001"
                                    className="w-24 bg-zinc-800 border border-zinc-700 text-zinc-100 text-right font-mono text-sm rounded-lg px-2 py-1 outline-none focus:border-primary"
                                    value={tiempoEditado}
                                    onChange={(e) => setTiempoEditado(e.target.value)}
                                    title="Tiempo Pista (seg)"
                                  />
                                  <input
                                    type="number" step="0.1"
                                    className="w-24 bg-red-500/10 border border-red-500/30 text-red-400 text-right font-mono text-sm mt-1 rounded-lg px-2 py-1 outline-none focus:border-red-500"
                                    value={penalizacionEditada}
                                    onChange={(e) => setPenalizacionEditada(e.target.value)}
                                    title="Penalización (seg)"
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-zinc-200">{formatMs(t.track_time_ms)}</span>
                                  {t.penalty_ms > 0 && <span className="text-warning text-xs font-bold mt-1">(+{(t.penalty_ms / 1000).toFixed(1)}s)</span>}
                                </div>
                              )}
                            </td>
                            <td className="text-center py-3 pr-3 align-middle">
                              {isEditing ? (
                                <div className="flex justify-center gap-1">
                                  <button className="text-green-500 hover:bg-green-500/20 p-1.5 rounded-lg transition-colors" onClick={() => saveLapTimeEdit(t.id)} title="Guardar">
                                    <Check size={16} />
                                  </button>
                                  <button className="text-zinc-400 hover:bg-zinc-700 p-1.5 rounded-lg transition-colors" onClick={() => setEditandoTramoId(null)} title="Cancelar">
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-1">
                                  <button
                                    className="text-blue-400 hover:bg-blue-400/10 p-1.5 rounded-lg transition-colors"
                                    onClick={() => { setEditandoTramoId(t.id); setTiempoEditado((t.track_time_ms / 1000).toFixed(3)); setPenalizacionEditada((t.penalty_ms / 1000).toFixed(1)); }}
                                    title="Editar"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    className="text-zinc-500 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors"
                                    onClick={() => handleDeleteLapTime(t.id)}
                                    title="Borrar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {lapTimes.length === 0 && (
                        <tr><td colSpan={4} className="text-center italic text-zinc-600 py-8">No hay tiempos en el historial</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ─── Modal Eliminar Piloto ─── */}
          <Modal
            isOpen={!!pilotToDelete}
            onOpenChange={(open) => { if (!open) setPilotToDelete(null); }}
            backdrop="blur"
            size="sm"
            classNames={{
              base: "bg-zinc-900 border border-danger/30 shadow-[0_0_30px_rgba(220,38,38,0.15)]",
              header: "border-b border-zinc-800/60",
              footer: "border-t border-zinc-800/60",
            }}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-3 pt-7">
                    <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center text-danger ring-2 ring-danger">
                      <Trash2 size={26} />
                    </div>
                    <span className="text-xl font-bold text-white">Eliminar Piloto</span>
                  </ModalHeader>
                  <ModalBody className="text-center pb-2">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      ¿Estás seguro de que quieres eliminar a{' '}
                      <strong className="text-danger">{pilotToDelete?.name}</strong>?
                      Se borrarán TAMBIÉN todos sus tiempos registrados.
                      <br /><br />Esta acción no se puede deshacer.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="flat" color="default" onPress={onClose} className="flex-1 text-zinc-300">
                      Cancelar
                    </Button>
                    <Button color="danger" variant="shadow" onPress={() => { confirmDeletePilot(); onClose(); }} className="flex-1 font-bold">
                      Eliminar Todo
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      )}

      {/* ─── TAB: Campeonatos ─── */}
      {activeTab === 'campeonatos' && userId && (
        <ChampionshipManager userId={userId} />
      )}
    </div>
  );
}
