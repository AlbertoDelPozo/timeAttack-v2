import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronDown, ChevronRight, Flag, Clock, Users, Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, Button, Chip, Input, Select, SelectItem } from '@nextui-org/react';
import { supabase } from '../../lib/supabase';

const getSessionWeight = (sessionName: string) => {
  const name = sessionName.toLowerCase();
  let weight = 0;
  if (name.includes('viernes')) weight += 100;
  else if (name.includes('sábado') || name.includes('sabado')) weight += 200;
  else if (name.includes('domingo')) weight += 300;
  if (name.includes('mañana') || name.includes('manana')) weight += 10;
  else if (name.includes('tarde')) weight += 20;
  else if (name.includes('noche')) weight += 30;
  return weight === 0 ? 999 : weight;
};

function RallyManagementPanel({ rallyId, clubId }: { rallyId: string, clubId: string }) {
  const [stages, setStages] = useState<number | ''>('');
  const [passes, setPasses] = useState<number | ''>('');
  const [mensajeConfig, setMensajeConfig] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [inscribedPilots, setInscribedPilots] = useState<any[]>([]);
  const [newPilotName, setNewPilotName] = useState('');
  const [newPilotDorsal, setNewPilotDorsal] = useState('');
  const [selectedCatForPilot, setSelectedCatForPilot] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const loadRallyData = async () => {
    const { data: configData } = await supabase.from('race_config').select('*').eq('rally_id', rallyId).maybeSingle();
    if (configData) {
      setStages(configData.num_tramos || 1);
      setPasses(configData.num_pasadas || 1);
    } else {
      setStages(''); setPasses('');
    }

    const { data: catData } = await supabase.from('categories').select('*').eq('club_id', clubId).order('name');
    if (catData) setCategories(catData);

    const { data: inscData } = await supabase
      .from('inscriptions')
      .select('id, pilot_id, pilots(name, dorsal), categories(name)')
      .eq('rally_id', rallyId);
    if (inscData) setInscribedPilots(inscData);
  };

  useEffect(() => { loadRallyData(); }, [rallyId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stages === '' || passes === '') return;

    // Select first to avoid upsert id conflicts
    const { data: existingConfig } = await supabase.from('race_config').select('id').eq('rally_id', rallyId).maybeSingle();
    let error;

    if (existingConfig) {
      const { error: updateErr } = await supabase.from('race_config').update({ num_tramos: Number(stages), num_pasadas: Number(passes) }).eq('id', existingConfig.id);
      error = updateErr;
    } else {
      const { error: insertErr } = await supabase.from('race_config').insert({ rally_id: rallyId, club_id: clubId, num_tramos: Number(stages), num_pasadas: Number(passes) });
      error = insertErr;
    }

    if (error) {
      setMensajeConfig({ texto: error.message, tipo: 'error' });
    } else {
      setMensajeConfig({ texto: '¡Configuración Guardada!', tipo: 'success' });
      setTimeout(() => setMensajeConfig(null), 3000);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await supabase.from('categories').insert({ name: newCategory, club_id: clubId });
    setNewCategory('');
    loadRallyData();
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (window.confirm("¿Seguro que quieres borrar la categoría?")) {
      await supabase.from('categories').delete().eq('id', id);
      loadRallyData();
    }
  };

  const handleAddPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPilotName.trim() || !selectedCatForPilot) return;
    const dorsalVal = newPilotDorsal.trim() ? parseInt(newPilotDorsal, 10) : null;

    let pid = '';
    const { data: existPilot } = await supabase.from('pilots').select('id').eq('name', newPilotName.trim()).eq('club_id', clubId).maybeSingle();

    if (existPilot) {
      pid = existPilot.id;
    } else {
      const { data: newPilot, error: errPilot } = await supabase.from('pilots').insert({ name: newPilotName, dorsal: dorsalVal, club_id: clubId }).select('id').single();
      if (errPilot) { alert(errPilot.message); return; }
      pid = newPilot.id;
    }

    const { error: errInsc } = await supabase.from('inscriptions').insert({
      rally_id: rallyId,
      pilot_id: pid,
      category_id: Number(selectedCatForPilot)
    });

    if (errInsc) { alert(errInsc.message); return; }

    setNewPilotName(''); setNewPilotDorsal(''); setSelectedCatForPilot('');
    loadRallyData();
  };

  const handleDeletePilotInsc = async (id: string | number) => {
    if (window.confirm("¿Eliminar de este rally?")) {
      await supabase.from('inscriptions').delete().eq('id', id);
      loadRallyData();
    }
  };

  return (
    <div className="flex flex-col gap-5 mt-6 border-t border-zinc-800/60 pt-5">
      <div className="w-full">
        <Card isBlurred className="bg-zinc-900/40 border border-zinc-800 shadow-xl">
          <CardBody className="p-5 md:p-6">
            <h4 className="text-xl font-bold mb-4 text-white">Configuración del Rally</h4>
            {mensajeConfig && (
              <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-semibold border ${mensajeConfig.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {mensajeConfig.texto}
              </div>
            )}
            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Input label="Nº de Tramos" type="number" min="1" variant="bordered" color="primary" value={String(stages)} onValueChange={(v) => setStages(v === '' ? '' : Number(v))} classNames={{ input: "text-zinc-100", label: "text-zinc-400 font-semibold" }} isRequired />
              <Input label="Nº de Pasadas" type="number" min="1" variant="bordered" color="primary" value={String(passes)} onValueChange={(v) => setPasses(v === '' ? '' : Number(v))} classNames={{ input: "text-zinc-100", label: "text-zinc-400 font-semibold" }} isRequired />
              <Button type="submit" color="primary" variant="shadow" className="w-full font-bold h-14">Guardar Configuración</Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <Card isBlurred className="bg-zinc-900/40 border border-zinc-800 shadow-xl">
          <CardBody className="p-5 md:p-6">
            <h4 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><Users size={18} /> Gestión de Pilotos</h4>
            <form onSubmit={handleAddPilot} className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
                <Input type="number" placeholder="Dorsal" variant="bordered" color="primary" value={newPilotDorsal} onValueChange={setNewPilotDorsal} className="w-24" classNames={{ input: "text-zinc-100", inputWrapper: "border-zinc-700" }} />
                <Input type="text" placeholder="Nombre completo" variant="bordered" color="primary" value={newPilotName} onValueChange={setNewPilotName} isRequired classNames={{ input: "text-zinc-100", inputWrapper: "flex-1 border-zinc-700" }} />
              </div>
              <div className="flex gap-2 items-end">
                <Select placeholder="Selecciona Cat." aria-label="Selecciona Categoría" variant="bordered" color="primary" isRequired selectedKeys={selectedCatForPilot ? [selectedCatForPilot] : []} onSelectionChange={(keys) => setSelectedCatForPilot(Array.from(keys)[0] as string)} classNames={{ trigger: "border-zinc-700 w-full min-h-unit-10", value: "text-zinc-100" }}>
                  {categories.map((c: any) => <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>)}
                </Select>
                <Button type="submit" color="primary" variant="shadow" startContent={<Plus size={16} />} className="font-semibold h-10 w-full sm:w-auto px-2 shrink-0">Apuntar</Button>
              </div>
            </form>
            <div className="overflow-x-auto max-h-64 rounded-xl border border-zinc-800/60">
              <table className="w-full text-sm font-mono">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/60 sticky top-0 z-10">
                  <tr><th className="py-2 px-3 text-left font-medium">Dorsal</th><th className="py-2 px-3 text-left font-medium">Piloto</th><th className="py-2 px-3 text-left font-medium">Cat.</th><th className="py-2 px-3 text-center">x</th></tr>
                </thead>
                <tbody>
                  {inscribedPilots.map((p: any) => (
                    <tr key={p.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40">
                      <td className="px-3 py-2 text-zinc-400">{p.pilots?.dorsal || '-'}</td>
                      <td className="px-3 py-2 text-zinc-200">{p.pilots?.name}</td>
                      <td className="px-3 py-2 text-zinc-300">{p.categories?.name}</td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => handleDeletePilotInsc(p.id)} className="text-zinc-600 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {inscribedPilots.length === 0 && <tr><td colSpan={4} className="text-center italic text-zinc-600 py-4">Nadie inscrito</td></tr>}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card isBlurred className="bg-zinc-900/40 border border-zinc-800 shadow-xl">
          <CardBody className="p-5 md:p-6">
            <h4 className="text-lg font-bold mb-4 text-white">Categorías (Global)</h4>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4 items-end">
              <Input type="text" placeholder="Nueva Categoría" variant="bordered" color="primary" value={newCategory} onValueChange={setNewCategory} isRequired classNames={{ input: "text-zinc-100", inputWrapper: "flex-1 border-zinc-700" }} />
              <Button type="submit" color="primary" variant="shadow" startContent={<Plus size={16} />} className="font-semibold h-10 px-3 shrink-0">Añadir</Button>
            </form>
            <div className="overflow-x-auto max-h-48 rounded-xl border border-zinc-800/60">
              <table className="w-full text-sm font-mono">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/60 sticky top-0 z-10">
                  <tr><th className="py-2 px-3 text-left font-medium">Nombre</th><th className="py-2 px-3 text-center">x</th></tr>
                </thead>
                <tbody>
                  {categories.map((c: any) => (
                    <tr key={c.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40">
                      <td className="px-3 py-2 text-zinc-200">{c.name}</td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => handleDeleteCategory(c.id)} className="text-zinc-600 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && <tr><td colSpan={2} className="text-center italic text-zinc-600 py-4">No hay categorías</td></tr>}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

interface ChampionshipAccordionProps {
  userId?: string;
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
  userId,
  championships, rallies, sessions,
  expandedCamp, setExpandedCamp,
  expandedRally, setExpandedRally,
  setModalCamp, setModalRally, setModalSession, setModalInscripciones, setModalCronometro,
  deleteChampionship, deleteRally, deleteSession
}: ChampionshipAccordionProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Header ─── */}
      <Card
        className="bg-[#09090b] border border-zinc-800 shadow-sm"
      >
        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <Trophy className="text-yellow-500" size={20} /> Mis Campeonatos
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Estructura tus pruebas, rallies y sesiones.</p>
          </div>
          <Button
            startContent={<Plus size={16} />}
            onPress={() => setModalCamp(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium w-full sm:w-auto rounded-md text-sm px-4 py-2"
          >
            Nuevo Campeonato
          </Button>
        </CardBody>
      </Card>

      {/* ─── Lista de campeonatos ─── */}
      {!expandedCamp ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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
            <div className="col-span-full flex flex-col items-center py-16 border border-dashed border-zinc-800/60 rounded-xl bg-zinc-950/30">
              <Trophy size={48} className="text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-sm">No has creado ningún campeonato todavía.</p>
              <Button
                className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md"
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
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => {
                  setExpandedCamp(null);
                  setExpandedRally(null);
                }}
                className="text-zinc-400 hover:text-red-400 flex items-center gap-2 font-medium transition-colors text-sm bg-zinc-800/30 px-3 py-1.5 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/80 w-fit"
              >
                ← Volver a Campeonatos
              </Button>
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
                        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/40 transition-colors group/rally"
                        onClick={() => setExpandedRally(expandedRally === rally.id ? null : rally.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedRally === rally.id ? <ChevronDown size={20} className="text-zinc-500" /> : <ChevronRight size={20} className="text-zinc-600" />}
                          <div className="bg-zinc-800/80 p-2 rounded-lg border border-zinc-700/50 shadow-sm"><Flag size={18} className="text-zinc-300" /></div>
                          <h4 className="text-lg font-bold text-zinc-200 ml-2 tracking-tight">{rally.name}</h4>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* El botón de MAIN inyectado en nuestro diseño */}
                          <button
                            className="flex-1 sm:flex-none text-center font-medium text-sm px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors border border-red-700 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que se despliegue el acordeón al pulsar el botón
                              navigate(`/gestion-rally/${rally.id}`);
                            }}
                          >
                            Configurar Rally
                          </button>
                          
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
                                <span className="font-semibold text-zinc-300 flex items-center gap-3"><Clock size={16} className="text-zinc-500" /> {session.name}</span>
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
                        </div>
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
