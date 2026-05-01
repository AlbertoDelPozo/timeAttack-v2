import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Rally {
  id: string;
  name: string;
  status: string | null;
  created_at: string;
  championship_id: string;
  passes?: number;
  stages?: number;
}

interface Championship {
  id: string;
  name: string;
  rallies: Rally[];
}

export interface ClubWithChampionships {
  id: string;
  name: string;
  championships: Championship[];
}

export interface MyInscription {
  id: string;
  rally_id: string;
  session_id: string;
  pilot_id: string;
  category_id: number;
  car: string | null;
  team: string | null;
  dorsal_num: number | null;
  rallies: { name: string; championship_id: string; championships: { name: string; clubs: { name: string } } } | null;
  categories: { name: string } | null;
  rally_sessions: { name: string } | null;
}

export interface PilotRecord {
  id: string;
  name: string;
  club_id: string;
  profile_id: string;
}

export interface InscribirParams {
  rallyId: string;
  championshipId: string;
  sessionId: string;
  categoryId: number;
  clubId: string;
  car?: string;
  team?: string;
  displayName: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePilotData(userId: string | undefined) {
  const [pilotRecords, setPilotRecords] = useState<PilotRecord[]>([]);
  const [clubs, setClubs] = useState<ClubWithChampionships[]>([]);
  const [myInscriptions, setMyInscriptions] = useState<MyInscription[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const [pilotRes, clubRes] = await Promise.all([
      supabase.from('pilots').select('id, name, club_id, profile_id').eq('profile_id', userId),
      supabase.from('clubs').select(`
        id, name,
        championships(
          id, name,
          rallies(id, name, status, created_at, championship_id, passes, stages)
        )
      `)
    ]);

    const pilots: PilotRecord[] = pilotRes.data || [];
    setPilotRecords(pilots);
    setClubs(clubRes.data || []);

    if (pilots.length > 0) {
      const pilotIds = pilots.map(p => p.id);
      const { data: insData } = await supabase
        .from('inscriptions')
        .select(`
          id, rally_id, session_id, pilot_id, category_id, car, team, dorsal_num,
          rallies(name, championship_id, championships(name, clubs(name))),
          categories(name),
          rally_sessions(name)
        `)
        .in('pilot_id', pilotIds)
        .order('created_at', { ascending: false });
      setMyInscriptions((insData as unknown as MyInscription[]) || []);
    } else {
      setMyInscriptions([]);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  // ── Dorsal: championship standings → position, or sequential if first rally ──

  const calculateDorsal = useCallback(async (
    rallyId: string,
    championshipId: string,
    pilotId: string
  ): Promise<number> => {
    // Get other rallies in this championship
    const { data: prevRallies } = await supabase
      .from('rallies')
      .select('id')
      .eq('championship_id', championshipId)
      .neq('id', rallyId);

    if (prevRallies && prevRallies.length > 0) {
      const { data: prevSessions } = await supabase
        .from('rally_sessions')
        .select('id')
        .in('rally_id', prevRallies.map(r => r.id));

      const sessionIds = (prevSessions || []).map(s => s.id);

      if (sessionIds.length > 0) {
        const { data: lapTimes } = await supabase
          .from('lap_times')
          .select('pilot_id, total_time_ms')
          .in('session_id', sessionIds)
          .not('total_time_ms', 'is', null);

        if (lapTimes && lapTimes.length > 0) {
          // Sum total_time_ms per pilot → sort ASC → position = dorsal
          const standings: Record<string, number> = {};
          for (const lt of lapTimes) {
            if (lt.pilot_id) {
              standings[lt.pilot_id] = (standings[lt.pilot_id] || 0) + (lt.total_time_ms || 0);
            }
          }
          const sorted = Object.keys(standings).sort((a, b) => standings[a] - standings[b]);
          const pos = sorted.indexOf(pilotId);
          // Known pilot → their position; newcomer → after all ranked
          return pos >= 0 ? pos + 1 : sorted.length + 1;
        }
      }
    }

    // First rally (or no times yet): sequential MAX + 1
    const { data: maxRow } = await supabase
      .from('inscriptions')
      .select('dorsal_num')
      .eq('rally_id', rallyId)
      .not('dorsal_num', 'is', null)
      .order('dorsal_num', { ascending: false })
      .limit(1);

    return (maxRow?.[0]?.dorsal_num ?? 0) + 1;
  }, []);

  // ── Inscription: upsert pilot record → check dup → dorsal → insert ──────────

  const inscribirPiloto = useCallback(async (
    params: InscribirParams
  ): Promise<{ success: boolean; dorsal?: number; error?: string }> => {
    if (!userId) return { success: false, error: 'No autenticado.' };

    try {
      // 1. Find or create the pilot row for this user+club
      const { data: existing } = await supabase
        .from('pilots')
        .select('id')
        .eq('profile_id', userId)
        .eq('club_id', params.clubId)
        .maybeSingle();

      let pilotId: string;
      if (existing) {
        pilotId = existing.id;
      } else {
        const { data: newPilot, error: errPilot } = await supabase
          .from('pilots')
          .insert({ profile_id: userId, name: params.displayName, club_id: params.clubId })
          .select('id')
          .single();
        if (errPilot || !newPilot) throw new Error(errPilot?.message ?? 'Error al crear piloto.');
        pilotId = newPilot.id;
      }

      // 2. Duplicate check
      const { data: dup } = await supabase
        .from('inscriptions')
        .select('id')
        .eq('rally_id', params.rallyId)
        .eq('pilot_id', pilotId)
        .maybeSingle();
      if (dup) return { success: false, error: 'Ya estás inscrito en esta prueba.' };

      // 3. Dorsal based on championship standings
      const dorsal = await calculateDorsal(params.rallyId, params.championshipId, pilotId);

      // 4. Insert inscription
      const { error: insErr } = await supabase.from('inscriptions').insert({
        rally_id:    params.rallyId,
        session_id:  params.sessionId,
        pilot_id:    pilotId,
        category_id: params.categoryId,
        dorsal_num:  dorsal,
        car:  params.car  || null,
        team: params.team || null,
      });
      if (insErr) throw new Error(insErr.message);

      await reload();
      return { success: true, dorsal };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [userId, calculateDorsal, reload]);

  return { pilotRecords, clubs, myInscriptions, loading, inscribirPiloto, calculateDorsal, reload };
}
