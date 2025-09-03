import React, { useState, useContext, createContext, useMemo } from "react";
import { Piloto } from "./types";

interface RallyDataContextType {
  pilotos: Piloto[];
  numPasadas: number;
  numTramos: number;
  nuevoPilotoNombre: string;
  setNuevoPilotoNombre: React.Dispatch<React.SetStateAction<string>>;
  nuevoPilotoApellido: string;
  setNuevoPilotoApellido: React.Dispatch<React.SetStateAction<string>>;
  nuevoPilotoCategory: string;
  setNuevoPilotoCategory: React.Dispatch<React.SetStateAction<string>>;
  nuevoPilotoCar: string;
  setNuevoPilotoCar: React.Dispatch<React.SetStateAction<string>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pilotoToDelete: Piloto | null;
  selectedPasada: number | null;
  setSelectedPasada: React.Dispatch<React.SetStateAction<number | null>>;
  modoVista: "edicion" | "lectura";
  setModoVista: React.Dispatch<React.SetStateAction<"edicion" | "lectura">>;
  handleTimeChange: (
    pilotoId: number,
    pasadaId: number,
    tramoId: number,
    tiempo: number | null
  ) => void;
  handleAddPiloto: () => void;
  openModalForDeletion: (piloto: Piloto) => void;
  handleDeletePiloto: () => void;
  handleSaveConfig: () => void;
  setNumPasadas: React.Dispatch<React.SetStateAction<number>>;
  setNumTramos: React.Dispatch<React.SetStateAction<number>>;
}

const RallyContext = createContext<RallyDataContextType | undefined>(undefined);

const initialPilotos: Piloto[] = JSON.parse(
  localStorage.getItem("rallyPilotos") || "[]"
);

const initialNumPasadas: number =
  Number(localStorage.getItem("rallyNumPasadas")) || 0;
const initialNumTramos: number =
  Number(localStorage.getItem("rallyNumTramos")) || 0;

export const RallyDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pilotos, setPilotos] = useState<Piloto[]>(initialPilotos);
  const [numPasadas, setNumPasadas] = useState<number>(initialNumPasadas);
  const [numTramos, setNumTramos] = useState<number>(initialNumTramos);
  const [nuevoPilotoNombre, setNuevoPilotoNombre] = useState("");
  const [nuevoPilotoApellido, setNuevoPilotoApellido] = useState("");
  const [nuevoPilotoCategory, setNuevoPilotoCategory] = useState("");
  const [nuevoPilotoCar, setNuevoPilotoCar] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pilotoToDelete, setPilotoToDelete] = useState<Piloto | null>(null);
  const [selectedPasada, setSelectedPasada] = useState<number | null>(
    null
  );
  const [modoVista, setModoVista] = useState<"edicion" | "lectura">(
    "edicion"
  );

  const calculateTotal = (pasadas: Piloto["pasadas"]): number => {
    return pasadas.reduce((total, pasada) => {
      const subtotal = pasada.tramos.reduce(
        (sub, tramo) => sub + (tramo.tiempo || 0),
        0
      );
      pasada.subtotal = subtotal;
      return total + subtotal;
    }, 0);
  };

  const handleTimeChange = (
    pilotoId: number,
    pasadaId: number,
    tramoId: number,
    tiempo: number | null
  ) => {
    setPilotos((prevPilotos) => {
      const newPilotos = prevPilotos.map((piloto) => {
        if (piloto.id === pilotoId) {
          const newPasadas = piloto.pasadas.map((pasada) => {
            if (pasada.id === pasadaId) {
              const newTramos = pasada.tramos.map((tramo) =>
                tramo.id === tramoId ? { ...tramo, tiempo } : tramo
              );
              return { ...pasada, tramos: newTramos };
            }
            return pasada;
          });

          const total = calculateTotal(newPasadas);
          return { ...piloto, pasadas: newPasadas, total };
        }
        return piloto;
      });
      localStorage.setItem("rallyPilotos", JSON.stringify(newPilotos));
      return newPilotos;
    });
  };

  const handleAddPiloto = () => {
    if (nuevoPilotoNombre.trim() && nuevoPilotoApellido.trim()) {
      setPilotos((prevPilotos) => {
        const newPiloto: Piloto = {
          id: Date.now(),
          nombre: nuevoPilotoNombre,
          apellido: nuevoPilotoApellido,
          category: nuevoPilotoCategory,
          car: nuevoPilotoCar,
          pasadas: Array.from({ length: numPasadas }, (_, i) => ({
            id: i,
            nombre: `Pasada ${i + 1}`,
            tramos: Array.from({ length: numTramos }, (_, j) => ({
              id: j,
              tiempo: null,
            })),
            subtotal: 0,
          })),
          total: 0,
        };
        const updatedPilotos = [...prevPilotos, newPiloto];
        localStorage.setItem("rallyPilotos", JSON.stringify(updatedPilotos));
        return updatedPilotos;
      });
      setNuevoPilotoNombre("");
      setNuevoPilotoApellido("");
      setNuevoPilotoCategory("");
      setNuevoPilotoCar("");
    }
  };

  const openModalForDeletion = (piloto: Piloto) => {
    setPilotoToDelete(piloto);
    setIsModalOpen(true);
  };

  const handleDeletePiloto = () => {
    if (pilotoToDelete) {
      const updatedPilotos = pilotos.filter(
        (piloto) => piloto.id !== pilotoToDelete.id
      );
      setPilotos(updatedPilotos);
      localStorage.setItem("rallyPilotos", JSON.stringify(updatedPilotos));
      setIsModalOpen(false);
      setPilotoToDelete(null);
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem("rallyNumPasadas", String(numPasadas));
    localStorage.setItem("rallyNumTramos", String(numTramos));
  };

  const sortedPilotos = useMemo(() => {
    return [...pilotos].sort((a, b) => a.total - b.total);
  }, [pilotos]);

  const value = useMemo(
    () => ({
      pilotos: sortedPilotos,
      numPasadas,
      numTramos,
      nuevoPilotoNombre,
      setNuevoPilotoNombre,
      nuevoPilotoApellido,
      setNuevoPilotoApellido,
      nuevoPilotoCategory,
      setNuevoPilotoCategory,
      nuevoPilotoCar,
      setNuevoPilotoCar,
      isModalOpen,
      setIsModalOpen,
      pilotoToDelete,
      handleTimeChange,
      handleAddPiloto,
      openModalForDeletion,
      handleDeletePiloto,
      selectedPasada,
      setSelectedPasada,
      modoVista,
      setModoVista,
      handleSaveConfig,
      setNumPasadas,
      setNumTramos,
    }),
    [
      sortedPilotos,
      numPasadas,
      numTramos,
      nuevoPilotoNombre,
      nuevoPilotoApellido,
      nuevoPilotoCategory,
      nuevoPilotoCar,
      isModalOpen,
      pilotoToDelete,
      handleTimeChange,
      handleAddPiloto,
      openModalForDeletion,
      handleDeletePiloto,
      selectedPasada,
      modoVista,
      handleSaveConfig,
    ]
  );

  return (
    <RallyContext.Provider value={value}>
      {children}
    </RallyContext.Provider>
  );
};

export const useRallyData = () => {
  const context = useContext(RallyContext);
  if (context === undefined) {
    throw new Error("useRallyData must be used within a RallyDataProvider");
  }
  return context;
};