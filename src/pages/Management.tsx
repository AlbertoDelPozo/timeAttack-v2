import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Pencil, Check, X, Users, Trophy, Clock } from 'lucide-react';
import {
  Button, Input, Select, SelectItem, Card, CardBody,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Chip
} from '@nextui-org/react';

const formatMs = (ms: number) => (ms / 1000).toFixed(3);

// ─────────────────────────────────────────────
// Management (componente principal exportado)
// ─────────────────────────────────────────────
export default function Management({ userId }: { userId?: string }) {

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
  const [filterCat, setFilterCat] = useState('');

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


          {/* Configuración Rally */}
          <div className="w-full max-w-7xl mb-6">
            <Card isBlurred className="bg-zinc-900/70 border border-zinc-800/80 shadow-2xl">
              <CardBody className="p-5 md:p-8">
                <h2 className="text-2xl font-bold mb-5 text-white">Configuración del Rally</h2>

                {mensajeConfig && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold border ${mensajeConfig.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-brand-500/10 border-brand-500/30 text-brand-400'}`}>
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
                <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock size={20} className="text-zinc-400" /> Últimos 10 Tiempos
                  </h2>
                  <select
                    value={filterCat}
                    onChange={e => setFilterCat(e.target.value)}
                    className="h-9 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 rounded-lg focus:border-brand-500 outline-none transition-colors"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <p className="text-sm text-zinc-500 mb-5">Edita ✏️ o borra 🗑️ los registros en caso de error.</p>

                {mensajeTiempos && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold border ${mensajeTiempos.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-brand-500/10 border-brand-500/30 text-brand-400'}`}>
                    {mensajeTiempos.texto}
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-zinc-800/60">
                  <table className="w-full text-sm border-collapse">
                    <thead className="text-xs text-zinc-500 uppercase tracking-wider bg-zinc-950/60">
                      <tr>
                        <th className="sticky left-0 bg-zinc-950 py-3 pl-3 pr-4 font-medium text-left whitespace-nowrap z-10">Piloto</th>
                        <th className="py-3 px-3 font-medium text-left">Cat.</th>
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap">T. Pista + Pen.</th>
                        <th className="py-3 pr-3 text-center font-medium w-20">Acc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lapTimes.filter(t => !filterCat || t.categories?.name === filterCat).map((t) => {
                        const isEditing = t.id === editandoTramoId;
                        return (
                          <tr key={t.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40 transition-colors">
                            <td className="sticky left-0 bg-zinc-950 font-semibold py-3 pl-3 pr-4 text-zinc-200 align-middle whitespace-nowrap z-10">{t.pilots?.name}</td>
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
                                    className="w-24 bg-brand-500/10 border border-brand-500/30 text-brand-400 text-right font-mono text-sm mt-1 rounded-lg px-2 py-1 outline-none focus:border-brand-500"
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
              base: "bg-zinc-900 border border-danger/30 shadow-[0_0_30px_rgba(194,14,77,0.15)]",
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
    </div>
  );
}
