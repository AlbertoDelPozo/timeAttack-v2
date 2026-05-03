import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Pencil, Trash2 } from 'lucide-react';
import { useChampionshipData } from '../hooks/useChampionshipData';
import { ChampionshipAccordion } from '../components/management/ChampionshipAccordion';
import { ManagementModals } from '../components/management/ManagementModals';
import {
  Button, Input, Select, SelectItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Chip
} from '@nextui-org/react';

export default function Championships({ userId }: { userId?: string }) {
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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  if (!userId) return null;

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
    let pilotWasCreated = false;
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
      pilotWasCreated = true;
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
      if (pilotWasCreated) {
        await supabase.from('pilots').delete().eq('id', finalPilotId);
      }
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
    <div className="w-full max-w-7xl flex flex-col gap-6 mx-auto pt-4 md:py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6 drop-shadow-sm text-center tracking-tight">
        Gestión de Campeonatos
      </h1>
      
      <ChampionshipAccordion
        userId={userId}
        championships={cd.championships} rallies={cd.rallies} sessions={cd.sessions}
        expandedCamp={cd.expandedCamp} setExpandedCamp={cd.setExpandedCamp}
        expandedRally={cd.expandedRally} setExpandedRally={cd.setExpandedRally}
        setModalCamp={cd.setModalCamp} setModalRally={cd.setModalRally} setModalSession={cd.setModalSession}
        setModalInscripciones={setModalInscripciones}
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

    </div>
  );
}
