import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useChampionshipData(userId: string | undefined) {
  const [championships, setChampionships] = useState<any[]>([]);
  const [rallies, setRallies] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [expandedCamp, setExpandedCamp] = useState<string | null>(null);
  const [expandedRally, setExpandedRally] = useState<string | null>(null);

  const [modalCamp, setModalCamp] = useState(false);
  const [formCamp, setFormCamp] = useState({ name: '', tramos: 5, pasadas: 3, multi: false, points: '25, 18, 15, 12, 10, 8, 6, 4, 2, 1' });

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

  const handleCreateChampionship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCamp.name.trim()) {
      alert("⚠️ Por favor, ponle un nombre al campeonato.");
      return;
    }
    if (formCamp.tramos < 1 || formCamp.pasadas < 1) {
      alert("⚠️ El número de tramos y pasadas debe ser al menos 1.");
      return;
    }
    try {
      const ptsArray = formCamp.points.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p));
      const { error } = await supabase.from('championships').insert([{
        name: formCamp.name,
        club_id: userId,
        default_stages: Number(formCamp.tramos),
        default_passes: Number(formCamp.pasadas),
        allow_multi_category: formCamp.multi,
        points_system: ptsArray
      }]);

      if (error) throw error;

      setModalCamp(false);
      setFormCamp({ name: '', tramos: 5, pasadas: 3, multi: false, points: '25, 18, 15, 12, 10, 8, 6, 4, 2, 1' });
      
      loadHierarchy();
    } catch (error: any) {
      console.error("Error al crear campeonato:", error);
      alert(`Error al guardar: ${error.message}`);
    }
  };

  const handleCreateRally = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRally.name.trim()) { alert("Ponle un nombre a la prueba."); return; }
    if (!modalRally.campId) return;

    try {
      const { error } = await supabase.from('rallies').insert([{ 
        name: formRally.name, 
        championship_id: modalRally.campId,
        stages: Number(formRally.stages),
        passes: Number(formRally.passes),
        status: 'draft' 
      }]);
      
      if (error) throw error;

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

  return {
    championships, rallies, sessions,
    expandedCamp, setExpandedCamp,
    expandedRally, setExpandedRally,
    modalCamp, setModalCamp, formCamp, setFormCamp,
    modalRally, setModalRally, formRally, setFormRally,
    modalSession, setModalSession, formSession, setFormSession,
    handleCreateChampionship, handleCreateRally, handleCreateSession, loadHierarchy,
    deleteChampionship
  };
}
