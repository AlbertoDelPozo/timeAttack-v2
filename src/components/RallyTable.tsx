/* eslint-disable no-irregular-whitespace */
import React, { useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import PilotoRow from "../PilotoRow";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useRallyData } from "../useRallyData";

const RallyTable: React.FC = () => {
  const {
    pilotos,
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
  } = useRallyData();

  const navigate = useNavigate();

  const pasadasDisponibles = pilotos[0]?.pasadas || [];

  const fastestTimes = useMemo(() => {
    if (modoVista === "edicion" || selectedPasada === null) {
      return {};
    }

    const tiemposPorTramo: Record<number, number[]> = {};
    pilotos.forEach((piloto) => {
      const pasada = piloto.pasadas.find((p) => p.id === selectedPasada);
      if (pasada) {
        pasada.tramos.forEach((tramo) => {
          if (tramo.tiempo !== null) {
            if (!tiemposPorTramo[tramo.id]) {
              tiemposPorTramo[tramo.id] = [];
            }
            tiemposPorTramo[tramo.id].push(tramo.tiempo);
          }
        });
      }
    });

    const tiemposMasRapidos: Record<number, number> = {};
    for (const tramoId in tiemposPorTramo) {
      if (tiemposPorTramo[tramoId].length > 0) {
        tiemposMasRapidos[tramoId] = Math.min(...tiemposPorTramo[tramoId]);
      }
    }
    return tiemposMasRapidos;
  }, [pilotos, modoVista, selectedPasada]);

  const pasadaToShow = useMemo(() => {
    if (selectedPasada === null) return null;
    return pilotos.map(piloto => piloto.pasadas.find(p => p.id === selectedPasada)).find(Boolean) || null;
  }, [selectedPasada, pilotos]);

  const columns = useMemo(() => {
    if (selectedPasada === null) {
      return pasadasDisponibles.map((pasada) => ({
        id: pasada.id,
        label: `${pasada.nombre}`,
      }));
    } else {
      if (!pasadaToShow) return [];
      return pasadaToShow.tramos.map((tramo, index) => ({
        id: tramo.id,
        label: `Tramo ${index + 1}`,
      }));
    }
  }, [selectedPasada, pasadasDisponibles, pasadaToShow]);

  if (numPasadas === 0 || numTramos === 0) {
    navigate("/");
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 font-sans dark:bg-gray-950 dark:text-gray-100 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-white">Clasificación Rally Slot</h1>

      <div className="flex flex-col sm:flex-row justify-center items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
        <div>
          <label htmlFor="vista-select" className="block text-sm font-medium text-gray-300 mb-1">
            Modo:
          </label>
          <select
            id="vista-select"
            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
            value={modoVista}
            onChange={(e) =>
              setModoVista(e.target.value as "edicion" | "lectura")
            }
          >
            <option value="edicion">Edición</option>
            <option value="lectura">Solo Lectura</option>
          </select>
        </div>
        <div>
          <label htmlFor="pasada-select" className="block text-sm font-medium text-gray-300 mb-1">
            Ver:
          </label>
          {pasadasDisponibles.length > 0 && (
            <select
              id="pasada-select"
              className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
              value={selectedPasada === null ? "" : selectedPasada}
              onChange={(e) =>
                setSelectedPasada(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            >
              <option value="">Total General</option>
              {pasadasDisponibles.map((pasada) => (
                <option key={pasada.id} value={pasada.id}>
                  {pasada.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {pilotos.length > 0 && (
        <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Piloto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Coche
                </th>
                {columns.map((column) => (
                  <th key={column.id} className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {selectedPasada === null ? "Total" : "Subtotal"}
                </th>
                {modoVista === "edicion" && (
                  <th className="px-4 py-3 text-center">
                    <span className="sr-only">Eliminar</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {pilotos.map((piloto) => (
                <PilotoRow
                  key={piloto.id}
                  piloto={piloto}
                  onTimeChange={handleTimeChange}
                  onDeletePiloto={openModalForDeletion}
                  selectedPasada={selectedPasada}
                  isReadOnly={modoVista === "lectura"}
                  fastestTimes={fastestTimes}
                  pasadaToShow={pasadaToShow}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modoVista === "edicion" && (
        <div className="mt-8 p-6 rounded-xl shadow-lg border border-gray-700 bg-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1">
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
              value={nuevoPilotoNombre}
              onChange={(e) => setNuevoPilotoNombre(e.target.value)}
              placeholder="Nombre"
            />
          </div>
          <div className="lg:col-span-1">
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
              value={nuevoPilotoApellido}
              onChange={(e) => setNuevoPilotoApellido(e.target.value)}
              placeholder="Apellido"
            />
          </div>
          <div className="lg:col-span-1">
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
              value={nuevoPilotoCategory}
              onChange={(e) => setNuevoPilotoCategory(e.target.value)}
              placeholder="Categoría"
            />
          </div>
          <div className="lg:col-span-1">
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
              value={nuevoPilotoCar}
              onChange={(e) => setNuevoPilotoCar(e.target.value)}
              placeholder="Coche"
            />
          </div>
          <div className="lg:col-span-1">
            <button
              onClick={handleAddPiloto}
              className="w-full py-3 px-4 rounded-lg text-lg font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-transform duration-200 transform hover:scale-[1.02]"
            >
              Añadir Piloto
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeletePiloto}
        pilotoName={
          pilotoToDelete ? `${pilotoToDelete.nombre} ${pilotoToDelete.apellido}` : ""
        }
      />
    </div>
  );
};

export default RallyTable;