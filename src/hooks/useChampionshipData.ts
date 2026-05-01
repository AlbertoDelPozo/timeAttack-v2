import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Championship {
  id: string;
  name: string;
  club_id: string;
  created_at: string;
  default_stages?: number;
  default_passes?: number;
  allow_multi_category?: boolean;
  points_system?: number[];
}

interface Rally {
  id: string;
  name: string;
  championship_id: string;
  stages?: number;
  passes?: number;
  status?: string;
  created_at?: string;
}

interface Session {
  id: string;
  name: string;
  rally_id: string;
  created_at?: string;
}

export function useChampionshipData(userId: string | undefined) {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [rallies, setRallies] = useState<Rally[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [expandedCamp, setExpandedCamp] = useState<string | null>(null);
  const [expandedRally, setExpandedRally] = useState<string | null>(null);

  const [modalCamp, setModalCamp] = useState(false);
  const [formCamp, setFormCamp] = useState({ name: '', stages: 5, passes: 3, allowMultiCategory: false, points: '25, 18, 15, 12, 10, 8, 6, 4, 2, 1' });

  const [modalRally, setModalRally] = useState<{ open: boolean, campId: string | null }>({ open: false, campId: null });
  const [formRally, setFormRally] = useState({ name: '', stages: 5, passes: 3 });

  const [modalSession, setModalSession] = useState<{ open: boolean, rallyId: string | null }>({ open: false, rallyId: null });
  const [formSession, setFormSession] = useState({ name: '' });

  const loadHierarchy = async () => {
    if (!userId) return;
    try {
      const [campsRes, ralliesRes, sessionsRes] = await Promise.all([
        supabase.from('championships').select('*').eq('club_id', userId).order('created_at', { ascending: false }),
        supabase.from('rallies').select('*'),
        supabase.from('rally_sessions').select('*').order('created_at', { ascending: true })
      ]);
      if (isMounted.current) {
        setChampionships(campsRes.data || []);
        setRallies(ralliesRes.data || []);
        setSessions(sessionsRes.data || []);
      }
    } catch (error: any) { 
      if (error.name !== 'AbortError') console.error("Fetch error:", error); 
    }
  };

  useEffect(() => {
    if (userId) {
      loadHierarchy();
    }
  }, [userId]);

  const handleCreateChampionship = async (e: React.FormEvent, categoriasArray: string[]) => {
    e.preventDefault();
    if (!userId) {
      alert('Error de autenticación. Por favor, recarga la página.');
      return;
    }
    if (!formCamp.name.trim()) {
      alert("⚠️ Por favor, ponle un nombre al campeonato.");
      return;
    }
    if (formCamp.stages < 1 || formCamp.passes < 1) {
      alert("⚠️ El número de tramos y pasadas debe ser al menos 1.");
      return;
    }
    try {
      // 1. Obtener nombre del club desde profiles
      const { data: profileData } = await supabase
        .from('profiles').select('display_name').eq('id', userId).maybeSingle();

      // 2. Garantizar fila en clubs con nombre válido (escudo para cuentas sin clubs record)
      const { error: clubUpsertError } = await supabase
        .from('clubs')
        .upsert(
          { id: userId, name: profileData?.display_name || 'Mi Club' },
          { onConflict: 'id', ignoreDuplicates: true }
        );

      if (clubUpsertError) throw new Error(`No se pudo crear el registro de club: ${clubUpsertError.message}`);

      const ptsArray = formCamp.points.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p));
      const { data: newCamp, error } = await supabase.from('championships').insert([{
        name: formCamp.name,
        club_id: userId,
        default_stages: Number(formCamp.stages),
        default_passes: Number(formCamp.passes),
        allow_multi_category: formCamp.allowMultiCategory,
        points_system: ptsArray
      }]).select().single();

      if (error || !newCamp) throw error || new Error("Campeonato no devuelto tras inserción.");

      // 2. Insertar Categorías vinculadas a este campeonato
      if (categoriasArray.length > 0) {
        const categoriasToInsert = categoriasArray.map(cat => ({
          name: cat,
          championship_id: newCamp.id,
          club_id: userId
        }));
        
        const { error: errCat } = await supabase.from('categories').insert(categoriasToInsert);
        if (errCat) console.error("Error guardando categorías:", errCat);
      }

      setModalCamp(false);
      setFormCamp({ name: '', stages: 5, passes: 3, allowMultiCategory: false, points: '25, 18, 15, 12, 10, 8, 6, 4, 2, 1' });
      
      loadHierarchy();
    } catch (error: any) {
      console.error("Error al crear campeonato:", error);
      alert(`Error al guardar: ${error.message}`);
    }
  };

  const handleCreateRally = async (e: React.FormEvent, sessionsArray: string[]) => {
    e.preventDefault();
    if (!formRally.name.trim()) { alert("Ponle un nombre a la prueba."); return; }
    if (!modalRally.campId) return;

    try {
      const { data: newRally, error: errRally } = await supabase.from('rallies').insert([{ 
        name: formRally.name, 
        championship_id: modalRally.campId,
        stages: Number(formRally.stages),
        passes: Number(formRally.passes),
        status: 'draft' 
      }]).select().single();
      
      if (errRally || !newRally) throw errRally;

      if (sessionsArray.length > 0) {
        const sessionsToInsert = sessionsArray.map(sName => ({
          rally_id: newRally.id,
          name: sName
        }));
        
        const { error: errSess } = await supabase.from('rally_sessions').insert(sessionsToInsert);
        if (errSess) console.error("Error al crear cortes iniciales:", errSess);
      }

      setModalRally({ open: false, campId: null });
      setFormRally({ name: '', stages: 5, passes: 3 });
      
      loadHierarchy();
    } catch (error: any) {
      console.error("Error al crear rally:", error);
      alert("Error al crear la prueba. Revisa la consola.");
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSession.name.trim() || !modalSession.rallyId) {
      alert("⚠️ Faltan datos (ID o Nombre del corte).");
      return;
    }

    try {
      const { error } = await supabase.from('rally_sessions').insert([{ 
        rally_id: modalSession.rallyId, 
        name: formSession.name 
      }]);
      
      if (error) throw error;
      
      setFormSession({ name: '' });
      setModalSession({ open: false, rallyId: null });
      
      loadHierarchy();
    } catch (error: any) {
      console.error("Error al crear corte:", error);
      alert(`Error interno al guardar: ${error.message}`);
    }
  };

  const deleteChampionship = async (id: string) => {
    try {
      const { error } = await supabase.from('championships').delete().eq('id', id);
      if (error) throw error;
      loadHierarchy();
    } catch (error: any) {
      console.error("Error al borrar campeonato:", error);
      alert(`Error al borrar: ${error.message}`);
    }
  };

  const deleteRally = async (id: string) => {
    try {
      const { error } = await supabase.from('rallies').delete().eq('id', id);
      if (error) throw error;
      loadHierarchy();
    } catch (error: any) {
      console.error("Error al borrar rally:", error);
      alert(`Error al borrar: ${error.message}`);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase.from('rally_sessions').delete().eq('id', id);
      if (error) throw error;
      loadHierarchy();
    } catch (error: any) {
      console.error("Error al borrar sesión:", error);
      alert(`Error al borrar: ${error.message}`);
    }
  };

  return {
    championships, rallies, sessions,
    expandedCamp, setExpandedCamp,
    expandedRally, setExpandedRally,
    modalCamp, setModalCamp, formCamp, setFormCamp,
    modalRally, setModalRally, formRally, setFormRally,
    modalSession, setModalSession, formSession, setFormSession,
    handleCreateChampionship, handleCreateRally, handleCreateSession, loadHierarchy,
    deleteChampionship, deleteRally, deleteSession
  };
}
