import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardBody, Button, Input, Select, SelectItem } from '@nextui-org/react';
import { ChevronLeft, Flag, Users, Plus, Trash2, Clock, Timer } from 'lucide-react';

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

export default function RallyManager({ userId }: { userId?: string }) {
  const { rallyId } = useParams();
  const navigate = useNavigate();

  const [rally, setRally] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const [stages, setStages] = useState<number | ''>('');
  const [passes, setPasses] = useState<number | ''>('');
  const [mensajeConfig, setMensajeConfig] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [inscribedPilots, setInscribedPilots] = useState<any[]>([]);
  const [newPilotName, setNewPilotName] = useState('');
  const [newPilotDorsal, setNewPilotDorsal] = useState('');
  const [selectedCatForPilot, setSelectedCatForPilot] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSessionName, setNewSessionName] = useState('');

  const loadData = async () => {
    if (!rallyId) return;

    // Rally info
    const { data: rData } = await supabase.from('rallies').select('*').eq('id', rallyId).maybeSingle();
    if (rData) setRally(rData);

    // Sessions (Sorted)
    const { data: sData } = await supabase.from('rally_sessions').select('*').eq('rally_id', rallyId);
    if (sData) setSessions(sData.sort((a,b) => getSessionWeight(a.name) - getSessionWeight(b.name)));

    // Race Config
    const { data: configData } = await supabase.from('race_config').select('*').eq('rally_id', rallyId).maybeSingle();
    if (configData) {
      setStages(configData.num_tramos || 1);
      setPasses(configData.num_pasadas || 1);
    } else {
      setStages(''); setPasses('');
    }

    if (!userId) return;

    // Categories
    const { data: catData } = await supabase.from('categories').select('*').eq('club_id', userId).order('name');
    if (catData) setCategories(catData);

    // Inscriptions
    const { data: inscData } = await supabase
      .from('inscriptions')
      .select('id, pilot_id, pilots(name, dorsal), categories(name)')
      .eq('rally_id', rallyId);
    if (inscData) setInscribedPilots(inscData);
  };

  useEffect(() => { loadData(); }, [rallyId, userId]);

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
      const { error: insertErr } = await supabase.from('race_config').insert({ rally_id: rallyId, club_id: userId, num_tramos: Number(stages), num_pasadas: Number(passes) });
      error = insertErr;
    }

    if (error) {
      setMensajeConfig({ texto: error.message, tipo: 'error' });
    } else {
      setMensajeConfig({ texto: '¡Configuración Guardada!', tipo: 'success' });
      setTimeout(() => setMensajeConfig(null), 3000);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    await supabase.from('rally_sessions').insert({ name: newSessionName, rally_id: rallyId });
    setNewSessionName('');
    loadData();
  };

  const handleDeleteSession = async (id: string | number) => {
    if (window.confirm("¿Seguro que quieres borrar este corte y sus inscripciones?")) {
      await supabase.from('rally_sessions').delete().eq('id', id);
      loadData();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !userId) return;
    await supabase.from('categories').insert({ name: newCategory, club_id: userId });
    setNewCategory('');
    loadData();
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (window.confirm("¿Seguro que quieres borrar la categoría?")) {
      await supabase.from('categories').delete().eq('id', id);
      loadData();
    }
  };

  const handleAddPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPilotName.trim() || !selectedCatForPilot || !userId) return;
    const dorsalVal = newPilotDorsal.trim() ? parseInt(newPilotDorsal, 10) : null;
    
    let pid = '';
    const { data: existPilot } = await supabase.from('pilots').select('id').eq('name', newPilotName.trim()).eq('club_id', userId).maybeSingle();
    
    if (existPilot) {
      pid = existPilot.id;
    } else {
      const { data: newPilot, error: errPilot } = await supabase.from('pilots').insert({ name: newPilotName, dorsal: dorsalVal, club_id: userId }).select('id').single();
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
    loadData();
  };
  
  const handleDeletePilotInsc = async (id: string | number) => {
    if (window.confirm("¿Eliminar de este rally?")) {
      await supabase.from('inscriptions').delete().eq('id', id);
      loadData();
    }
  };

  if (!userId) return null;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
         <Button variant="light" color="default" className="self-start text-zinc-400 hover:text-white px-0 font-medium" startContent={<ChevronLeft size={18} />} onClick={() => navigate(-1)}>
            Volver a Campeonatos
         </Button>
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
           <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight flex items-center gap-4">
             <Flag className="text-brand-600" size={36} /> {rally?.name || 'Gestión de Prueba'}
           </h1>
           {rally?.championship_id && rallyId && (
             <Button
               className="bg-brand-600 hover:bg-brand-500 text-white font-bold tracking-wide shadow-lg shadow-brand-900/20 shrink-0"
               startContent={<Timer size={18} />}
               onClick={() => navigate(`/campeonato/${rally.championship_id}/prueba/${rallyId}/cronometrar`)}
             >
               Cronometrar
             </Button>
           )}
         </div>
         <div className="w-full h-px bg-zinc-800/80 my-2" />
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Columna 1 */}
         <div className="flex flex-col gap-6">
            
            {/* Configuración */}
            <Card className="bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm">
              <CardBody className="p-5 md:p-6">
                <h4 className="text-xl font-bold mb-4 text-white">Configuración del Rally</h4>
                {mensajeConfig && (
                   <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-semibold border ${mensajeConfig.tipo === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-brand-500/10 border-brand-500/30 text-brand-400'}`}>
                     {mensajeConfig.texto}
                   </div>
                )}
                <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                   <Input label="Nº de Tramos" type="number" min="1" variant="bordered" color="primary" value={String(stages)} onValueChange={(v) => setStages(v === '' ? '' : Number(v))} classNames={{ input: "text-zinc-100", label: "text-zinc-400 font-semibold" }} isRequired />
                   <Input label="Nº de Pasadas" type="number" min="1" variant="bordered" color="primary" value={String(passes)} onValueChange={(v) => setPasses(v === '' ? '' : Number(v))} classNames={{ input: "text-zinc-100", label: "text-zinc-400 font-semibold" }} isRequired />
                   <Button type="submit" className="sm:col-span-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold h-11 w-full shadow-none">Guardar Configuración</Button>
                </form>
              </CardBody>
            </Card>

            {/* Sesiones / Cortes */}
            <Card className="bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm">
               <CardBody className="p-5 md:p-6">
                 <h4 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><Clock size={18} /> Cortes / Sesiones</h4>
                 <form onSubmit={handleAddSession} className="flex gap-2 mb-4 items-end">
                    <Input type="text" placeholder="Ej. Sábado Mañana" variant="bordered" color="primary" value={newSessionName} onValueChange={setNewSessionName} isRequired classNames={{ input: "text-zinc-100", inputWrapper: "flex-1 border-zinc-700" }} />
                    <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold h-10 px-4 shrink-0 shadow-none">Crear Corte</Button>
                 </form>
                 <div className="flex flex-col gap-2">
                    {sessions.length === 0 ? (
                       <p className="text-zinc-500 italic py-4 text-center border border-dashed border-zinc-800 rounded-lg">No hay cortes asignados</p>
                    ) : (
                       sessions.map(session => (
                          <div key={session.id} className="flex justify-between items-center bg-[#09090b] border border-zinc-800 p-3 rounded-md hover:bg-zinc-900/50 transition-colors shadow-sm">
                             <div className="flex items-center gap-3">
                                <Clock size={16} className="text-zinc-500" />
                                <span className="font-semibold text-zinc-300">{session.name}</span>
                             </div>
                             <button type="button" className="text-zinc-600 hover:text-danger hover:bg-danger/10 p-2 rounded-lg" onClick={() => handleDeleteSession(session.id)} title="Borrar Corte"><Trash2 size={16} /></button>
                          </div>
                       ))
                    )}
                 </div>
               </CardBody>
            </Card>

         </div>
         
         {/* Columna 2 */}
         <div className="flex flex-col gap-6">
            
            {/* Pilotos Inscritos */}
            <Card className="bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm">
               <CardBody className="p-5 md:p-6">
                 <h4 className="text-lg font-bold mb-4 text-white flex items-center gap-2"><Users size={18} /> Gestión de Pilotos</h4>
                 <form onSubmit={handleAddPilot} className="flex flex-col gap-2 mb-4">
                    <div className="flex gap-2">
                       <Input type="number" placeholder="Dorsal" variant="bordered" color="primary" value={newPilotDorsal} onValueChange={setNewPilotDorsal} className="w-24" classNames={{ input: "text-zinc-100", inputWrapper: "border-zinc-700" }} />
                       <Input type="text" placeholder="Nombre completo" variant="bordered" color="primary" value={newPilotName} onValueChange={setNewPilotName} isRequired classNames={{ input: "text-zinc-100", inputWrapper: "flex-1 border-zinc-700" }} />
                    </div>
                    <div className="flex gap-2 items-end">
                       <Select placeholder="Selecciona Cat." aria-label="Selecciona Categoría" variant="bordered" color="primary" isRequired selectedKeys={selectedCatForPilot ? [selectedCatForPilot] : []} onSelectionChange={(keys) => setSelectedCatForPilot(Array.from(keys)[0] as string)} classNames={{ trigger: "border-zinc-700 w-full min-h-unit-10", value: "text-zinc-100" }}>
                          {categories.map(c => <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>)}
                       </Select>
                       <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold h-10 w-full sm:w-auto px-4 shrink-0 shadow-none">Apuntar</Button>
                    </div>
                 </form>
                 <div className="overflow-x-auto max-h-[300px] rounded-xl border border-zinc-800/60">
                    <table className="w-full text-sm font-mono relative border-collapse">
                       <thead className="text-xs text-zinc-500 uppercase bg-[#09090b] sticky top-0 z-10">
                          <tr><th className="py-3 px-3 text-left font-medium">Dorsal</th><th className="py-3 px-3 text-left font-medium">Piloto</th><th className="py-3 px-3 text-left font-medium">Cat.</th><th className="py-3 px-3 text-center">Del</th></tr>
                       </thead>
                       <tbody>
                          {inscribedPilots.map((p) => (
                             <tr key={p.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40">
                                <td className="px-3 py-3 text-zinc-400">{p.pilots?.dorsal || '-'}</td>
                                <td className="px-3 py-3 text-zinc-200">{p.pilots?.name}</td>
                                <td className="px-3 py-3 text-zinc-300">{p.categories?.name}</td>
                                <td className="px-3 py-3 text-center">
                                   <button type="button" onClick={() => handleDeletePilotInsc(p.id)} className="text-zinc-600 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </td>
                             </tr>
                          ))}
                          {inscribedPilots.length === 0 && <tr><td colSpan={4} className="text-center italic text-zinc-600 py-6">Nadie inscrito</td></tr>}
                       </tbody>
                    </table>
                 </div>
               </CardBody>
            </Card>

            {/* Categorias Globales */}
            <Card className="bg-[#09090b] border border-zinc-800 rounded-lg shadow-sm">
               <CardBody className="p-5 md:p-6">
                 <h4 className="text-lg font-bold mb-4 text-white">Categorías (Global)</h4>
                 <form onSubmit={handleAddCategory} className="flex gap-2 mb-4 items-end">
                    <Input type="text" placeholder="Nueva Categoría" variant="bordered" color="primary" value={newCategory} onValueChange={setNewCategory} isRequired classNames={{ input: "text-zinc-100", inputWrapper: "flex-1 border-zinc-700" }} />
                    <Button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-md font-semibold h-10 px-4 shrink-0 shadow-none">Añadir</Button>
                 </form>
                 <div className="overflow-x-auto max-h-48 rounded-xl border border-zinc-800/60">
                    <table className="w-full text-sm font-mono relative border-collapse">
                       <thead className="text-xs text-zinc-500 uppercase bg-[#09090b] sticky top-0 z-10">
                          <tr><th className="py-2 px-3 text-left font-medium">Nombre</th><th className="py-2 px-3 text-center">Del</th></tr>
                       </thead>
                       <tbody>
                          {categories.map((c) => (
                             <tr key={c.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/40">
                                <td className="px-3 py-2 text-zinc-200">{c.name}</td>
                                <td className="px-3 py-2 text-center">
                                   <button type="button" onClick={() => handleDeleteCategory(c.id)} className="text-zinc-600 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
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
    </div>
  );
}
