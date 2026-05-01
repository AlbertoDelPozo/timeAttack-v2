import React, { useState, useEffect } from 'react';
import { Flag, Car, Users } from 'lucide-react';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Spinner,
} from '@nextui-org/react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { InscribirParams } from '../../hooks/usePilotData';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RallyRef {
  id: string;
  name: string;
  championship_id: string;
  clubId: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rally: RallyRef | null;
  userId: string;
  displayName: string;
  inscribirPiloto: (params: InscribirParams) => Promise<{ success: boolean; dorsal?: number; error?: string }>;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InscripcionModal({ isOpen, onClose, rally, userId, displayName, inscribirPiloto }: Props) {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [sessions,   setSessions]   = useState<{ id: string; name: string }[]>([]);

  const [categoryId,    setCategoryId]    = useState('');
  const [sessionId,     setSessionId]     = useState('');
  const [car,           setCar]           = useState('');
  const [team,          setTeam]          = useState('');
  const [loading,       setLoading]       = useState(false);
  const [loadingData,   setLoadingData]   = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [successDorsal, setSuccessDorsal] = useState<number | null>(null);

  // Reset + load data when rally changes
  useEffect(() => {
    if (!isOpen || !rally) return;
    setError(null);
    setSuccessDorsal(null);
    setCategoryId('');
    setSessionId('');
    setCar('');
    setTeam('');

    setLoadingData(true);
    Promise.all([
      supabase.from('categories').select('id, name').eq('championship_id', rally.championship_id),
      supabase.from('rally_sessions').select('id, name').eq('rally_id', rally.id).order('created_at', { ascending: true }),
    ]).then(([catRes, sessRes]) => {
      setCategories(catRes.data || []);
      setSessions(sessRes.data || []);
      setLoadingData(false);
    });
  }, [isOpen, rally]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rally || !categoryId || !sessionId) return;
    setLoading(true);
    setError(null);

    const result = await inscribirPiloto({
      rallyId:        rally.id,
      championshipId: rally.championship_id,
      clubId:         rally.clubId,
      sessionId,
      categoryId:     Number(categoryId),
      car:  car.trim()  || undefined,
      team: team.trim() || undefined,
      displayName,
    });

    setLoading(false);
    if (result.success && result.dorsal !== undefined) {
      setSuccessDorsal(result.dorsal);
    } else {
      setError(result.error ?? 'Error desconocido.');
    }
  };

  if (!rally) return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      backdrop="blur"
      placement="bottom-center"
      size="md"
      classNames={{
        base:   "bg-zinc-900 border border-zinc-800/80 sm:rounded-2xl",
        header: "border-b border-zinc-800/60",
        footer: "border-t border-zinc-800/60",
      }}
    >
      <ModalContent>
        {(onModalClose) =>
          successDorsal !== null ? (
            /* ── Success screen ── */
            <>
              <ModalHeader className="text-white">¡Inscripción confirmada!</ModalHeader>
              <ModalBody className="py-10 flex flex-col items-center gap-3">
                <p className="text-zinc-500 text-sm font-medium">{rally.name}</p>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.05 }}
                  className="text-8xl font-black font-mono text-brand-500 tracking-tighter mt-2 leading-none"
                >
                  #{successDorsal}
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-zinc-600 text-[10px] uppercase tracking-widest"
                >
                  Tu dorsal asignado
                </motion.p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="shadow" onPress={onModalClose} className="font-semibold w-full">
                  Perfecto
                </Button>
              </ModalFooter>
            </>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex items-center gap-2">
                <Flag className="text-brand-500" size={18} />
                <span className="text-white text-sm font-bold truncate">Inscripción — {rally.name}</span>
              </ModalHeader>

              <ModalBody className="py-5 gap-4">
                {error && (
                  <div className="px-4 py-3 rounded-lg bg-brand-600/10 border border-brand-600/30 text-brand-400 text-sm font-semibold">
                    {error}
                  </div>
                )}

                {loadingData ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner color="primary" size="sm" />
                  </div>
                ) : (<>

                <Select
                  label="Categoría / Clase"
                  isRequired
                  variant="bordered"
                  color="primary"
                  selectedKeys={categoryId ? [categoryId] : []}
                  onSelectionChange={(keys) => setCategoryId(Array.from(keys)[0] as string)}
                  classNames={{ label: "text-zinc-400", value: "text-zinc-100", trigger: "border-zinc-700" }}
                >
                  {categories.map(c => (
                    <SelectItem key={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Corte / Sesión de salida"
                  isRequired
                  variant="bordered"
                  color="primary"
                  selectedKeys={sessionId ? [sessionId] : []}
                  onSelectionChange={(keys) => setSessionId(Array.from(keys)[0] as string)}
                  classNames={{ label: "text-zinc-400", value: "text-zinc-100", trigger: "border-zinc-700" }}
                >
                  {sessions.map(s => (
                    <SelectItem key={s.id}>{s.name}</SelectItem>
                  ))}
                </Select>

                <div className="border-t border-zinc-800/50 pt-4 flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Opcionales</p>
                  <Input
                    label="Coche / Vehículo"
                    placeholder="Ej: Renault Clio R3"
                    variant="bordered"
                    startContent={<Car size={13} className="text-zinc-600 shrink-0" />}
                    value={car}
                    onValueChange={setCar}
                    classNames={{ input: "text-zinc-100", label: "text-zinc-400", inputWrapper: "border-zinc-700" }}
                  />
                  <Input
                    label="Escudería / Team"
                    placeholder="Ej: Rally Team Galicia"
                    variant="bordered"
                    startContent={<Users size={13} className="text-zinc-600 shrink-0" />}
                    value={team}
                    onValueChange={setTeam}
                    classNames={{ input: "text-zinc-100", label: "text-zinc-400", inputWrapper: "border-zinc-700" }}
                  />
                </div>

                </>)}
              </ModalBody>

              <ModalFooter>
                <Button variant="flat" color="default" onPress={onModalClose} className="text-zinc-400">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" variant="shadow" isLoading={loading} className="font-semibold">
                  Inscribirme
                </Button>
              </ModalFooter>
            </form>
          )
        }
      </ModalContent>
    </Modal>
  );
}
