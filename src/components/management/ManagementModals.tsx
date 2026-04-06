import React, { useState } from 'react';
import { Trophy, Flag, Clock, Plus, X } from 'lucide-react';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Checkbox
} from '@nextui-org/react';

interface ManagementModalsProps {
  modalCamp: boolean;
  setModalCamp: (open: boolean) => void;
  formCamp: any;
  setFormCamp: React.Dispatch<React.SetStateAction<any>>;
  handleCreateChampionship: (e: React.FormEvent, categoriasCamp: string[]) => void;

  modalRally: { open: boolean, campId: string | null };
  setModalRally: (state: { open: boolean, campId: string | null }) => void;
  formRally: { name: string, stages: number, passes: number };
  setFormRally: (state: { name: string, stages: number, passes: number }) => void;
  handleCreateRally: (e: React.FormEvent, sessionsInRally: string[]) => void;

  modalSession: { open: boolean, rallyId: string | null };
  setModalSession: (state: { open: boolean, rallyId: string | null }) => void;
  formSession: { name: string };
  setFormSession: (state: { name: string }) => void;
  handleCreateSession: (e: React.FormEvent) => void;
}

export function ManagementModals({
  modalCamp, setModalCamp, formCamp, setFormCamp, handleCreateChampionship,
  modalRally, setModalRally, formRally, setFormRally, handleCreateRally,
  modalSession, setModalSession, formSession, setFormSession, handleCreateSession
}: ManagementModalsProps) {

  const [sessionsInRally, setSessionsInRally] = useState<string[]>(['Domingo Mañana']);
  const [newSessionName, setNewSessionName] = useState('');
  const [categoriasCamp, setCategoriasCamp] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const addCategory = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !(categoriasCamp || []).includes(newCategoryName.trim())) {
      setCategoriasCamp([...(categoriasCamp || []), newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };

  const removeCategory = (cat: string) => {
    setCategoriasCamp((categoriasCamp || []).filter(c => c !== cat));
  };

  const addSession = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newSessionName.trim() && !(sessionsInRally || []).includes(newSessionName.trim())) {
      setSessionsInRally([...(sessionsInRally || []), newSessionName.trim()]);
      setNewSessionName('');
    }
  };

  const removeSession = (ses: string) => {
    setSessionsInRally((sessionsInRally || []).filter(s => s !== ses));
  };

  return (
    <>
      {/* ─── Modal Nuevo Campeonato ─── */}
      <Modal
        isOpen={modalCamp}
        onOpenChange={(open) => setModalCamp(open)}
        backdrop="blur"
        placement="bottom-center"
        size="lg"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800/80 sm:rounded-2xl",
          header: "border-b border-zinc-800/60",
          footer: "border-t border-zinc-800/60",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={(e) => { handleCreateChampionship(e, categoriasCamp); setCategoriasCamp([]); onClose(); }}>
              <ModalHeader className="flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                <span className="text-white">Crear Campeonato</span>
              </ModalHeader>
              <ModalBody className="gap-4 py-6">
                <Input
                  label="Nombre del Campeonato"
                  variant="bordered"
                  color="primary"
                  value={formCamp.name}
                  onValueChange={(v) => setFormCamp({ ...formCamp, name: v })}
                  classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                  isRequired
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Tramos (x defecto)"
                    type="number"
                    variant="bordered"
                    color="primary"
                    value={String(formCamp.tramos)}
                    onValueChange={(v) => setFormCamp({ ...formCamp, tramos: Number(v) })}
                    classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                  />
                  <Input
                    label="Pasadas (x defecto)"
                    type="number"
                    variant="bordered"
                    color="primary"
                    value={String(formCamp.pasadas)}
                    onValueChange={(v) => setFormCamp({ ...formCamp, pasadas: Number(v) })}
                    classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                  />
                </div>
                <Checkbox
                  isSelected={formCamp.multi}
                  onValueChange={(v) => setFormCamp({ ...formCamp, multi: v })}
                  color="primary"
                  classNames={{ label: "text-zinc-200 text-sm" }}
                >
                  Permitir Multi-Categoría (un piloto en varias)
                </Checkbox>
                <Input
                  label="Sistema de Puntuación"
                  description="Posiciones del 1º hacia abajo, separadas por comas."
                  variant="bordered"
                  color="primary"
                  value={formCamp.points}
                  onValueChange={(v) => setFormCamp({ ...formCamp, points: v })}
                  classNames={{ input: "text-zinc-100 font-mono", label: "text-zinc-400" }}
                />
                {/* Categorías */}
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Categorías Permitidas</p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ej: Supercars, Grupo N..."
                      variant="bordered"
                      color="primary"
                      size="sm"
                      value={newCategoryName}
                      onValueChange={setNewCategoryName}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCategory(e); }}
                      classNames={{ input: "text-zinc-100", inputWrapper: "border-zinc-700" }}
                    />
                    <Button type="button" isIconOnly variant="flat" onPress={(e: any) => addCategory(e)} className="border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700">
                      <Plus size={18} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {(categoriasCamp || []).map(cat => (
                      <span key={cat} className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700 text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-md">
                        {cat}
                        <X size={12} className="cursor-pointer hover:text-danger text-zinc-400 transition-colors" onClick={() => removeCategory(cat)} />
                      </span>
                    ))}
                    {(!categoriasCamp || categoriasCamp.length === 0) && (
                      <span className="text-xs text-zinc-500 italic">No has añadido categorías.</span>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" color="default" onPress={onClose} className="text-zinc-300">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" variant="shadow" className="font-semibold">
                  Crear Campeonato
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* ─── Modal Nuevo Rally ─── */}
      <Modal
        isOpen={modalRally.open}
        onOpenChange={(open) => !open && setModalRally({ open: false, campId: null })}
        backdrop="blur"
        placement="bottom-center"
        size="md"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800/80 sm:rounded-2xl",
          header: "border-b border-zinc-800/60",
          footer: "border-t border-zinc-800/60",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={(e) => { handleCreateRally(e, sessionsInRally); setSessionsInRally(['Domingo Mañana']); onClose(); }}>
              <ModalHeader className="flex items-center gap-2">
                <Flag className="text-primary" size={20} />
                <span className="text-white">Nuevo Rally / Prueba</span>
              </ModalHeader>
              <ModalBody className="gap-4 py-6">
                <Input
                  label="Nombre de la prueba"
                  placeholder="Ej: Rally de Sierra Morena"
                  variant="bordered"
                  color="primary"
                  value={formRally.name}
                  onValueChange={(v) => setFormRally({ ...formRally, name: v })}
                  classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                  isRequired
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Tramos / Stages"
                    type="number"
                    variant="bordered"
                    color="primary"
                    value={String(formRally.stages)}
                    onValueChange={(v) => setFormRally({ ...formRally, stages: Number(v) })}
                    classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                  />
                  <Input
                    label="Pasadas / Passes"
                    type="number"
                    variant="bordered"
                    color="primary"
                    value={String(formRally.passes)}
                    onValueChange={(v) => setFormRally({ ...formRally, passes: Number(v) })}
                    classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                  />
                </div>
                {/* Sesiones */}
                <div className="pt-2 border-t border-zinc-800/40">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Configuración de Cortes / Sesiones</p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ej: Domingo Mañana"
                      variant="bordered"
                      size="sm"
                      value={newSessionName}
                      onValueChange={setNewSessionName}
                      onKeyDown={(e) => { if (e.key === 'Enter') addSession(e); }}
                      classNames={{ input: "text-zinc-100", inputWrapper: "border-zinc-700" }}
                    />
                    <Button type="button" isIconOnly variant="flat" onPress={(e: any) => addSession(e)} className="border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700">
                      <Plus size={18} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {(sessionsInRally || []).map(ses => (
                      <span key={ses} className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700 text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-md">
                        {ses}
                        <X size={12} className="cursor-pointer hover:text-danger text-zinc-400 transition-colors" onClick={() => removeSession(ses)} />
                      </span>
                    ))}
                    {(!sessionsInRally || sessionsInRally.length === 0) && (
                      <span className="text-xs text-zinc-500 italic">Sin cortes. Deberás añadirlos después.</span>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" color="default" onPress={onClose} className="text-zinc-300">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" variant="shadow" className="font-semibold">
                  Crear Prueba
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* ─── Modal Nueva Sesión ─── */}
      <Modal
        isOpen={modalSession.open}
        onOpenChange={(open) => !open && setModalSession({ open: false, rallyId: null })}
        backdrop="blur"
        placement="bottom-center"
        size="sm"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800/80 sm:rounded-2xl",
          header: "border-b border-zinc-800/60",
          footer: "border-t border-zinc-800/60",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={(e) => { handleCreateSession(e); onClose(); }}>
              <ModalHeader className="flex items-center gap-2">
                <Clock className="text-emerald-500" size={20} />
                <span className="text-white">Añadir Corte / Sesión</span>
              </ModalHeader>
              <ModalBody className="py-6">
                <Input
                  label="Nombre del Corte"
                  placeholder="Ej: Domingo - Mañana"
                  variant="bordered"
                  color="primary"
                  value={formSession.name}
                  onValueChange={(v) => setFormSession({ name: v })}
                  classNames={{ input: "text-zinc-100", label: "text-zinc-400" }}
                  isRequired
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" color="default" onPress={onClose} className="text-zinc-300">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" variant="shadow" className="font-semibold">
                  Añadir
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
