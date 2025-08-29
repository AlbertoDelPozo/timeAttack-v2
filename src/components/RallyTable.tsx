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

  // Mueve TODAS las llamadas a 'useMemo' al inicio del componente
  // para que siempre se llamen en el mismo orden.
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
  
  // Ahora, el 'return' condicional está después de todas las llamadas a los hooks
  if (numPasadas === 0 || numTramos === 0) {
    navigate("/");
    return null;
  }

  return (
    <div className="container-fluid mt-4">
      <h1 className="text-center mb-4">Clasificación Rally Slot</h1>
      
      {/*... El resto del componente permanece igual ...*/}
      
      <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center mb-4 w-100">
        <div className="mb-2 mb-sm-0 me-sm-2">
          <label htmlFor="vista-select" className="form-label me-2 mb-0">
            Modo:
          </label>
          <select
            id="vista-select"
            className="form-select"
            value={modoVista}
            onChange={(e) =>
              setModoVista(e.target.value as "edicion" | "lectura")
            }
          >
            <option value="edicion">Edición</option>
            <option value="lectura">Solo Lectura</option>
          </select>
        </div>
        <div className="mb-2 mb-sm-0">
          <label htmlFor="pasada-select" className="form-label me-2 mb-0">
            Ver:
          </label>
            {pasadasDisponibles.length > 0 && (
                <select
                id="pasada-select"
                className="form-select"
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
        <div className="table-responsive-sm rounded-3 shadow">
          <table className="table table-striped table-hover mb-0">
            <thead className="bg-light">
              <tr>
                <th scope="col" className="text-nowrap">
                  Piloto
                </th>
                <th scope="col" className="text-nowrap text-center">
                  Categoría
                </th>
                <th scope="col" className="text-nowrap text-center">
                  Coche
                </th>
                {columns.map((column) => (
                  <th key={column.id} scope="col" className="text-center text-nowrap">
                    {column.label}
                  </th>
                ))}
                <th scope="col" className="text-center text-nowrap">
                  {selectedPasada === null ? "Total" : "Subtotal"}
                </th>
                {modoVista === "edicion" && (
                  <th scope="col" className="text-center text-nowrap">
                    <span className="visually-hidden">Eliminar</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
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
        <div className="mt-4 row g-2">
          <div className="col-sm-6 col-lg-2">
            <input
              type="text"
              className="form-control"
              value={nuevoPilotoNombre}
              onChange={(e) => setNuevoPilotoNombre(e.target.value)}
              placeholder="Nombre"
            />
          </div>
          <div className="col-sm-6 col-lg-2">
            <input
              type="text"
              className="form-control"
              value={nuevoPilotoApellido}
              onChange={(e) => setNuevoPilotoApellido(e.target.value)}
              placeholder="Apellido"
            />
          </div>
          <div className="col-sm-6 col-lg-2">
            <input
              type="text"
              className="form-control"
              value={nuevoPilotoCategory}
              onChange={(e) => setNuevoPilotoCategory(e.target.value)}
              placeholder="Categoría"
            />
          </div>
          <div className="col-sm-6 col-lg-2">
            <input
              type="text"
              className="form-control"
              value={nuevoPilotoCar}
              onChange={(e) => setNuevoPilotoCar(e.target.value)}
              placeholder="Coche"
            />
          </div>
          <div className="col-12 col-lg-4">
            <button
              onClick={handleAddPiloto}
              className="btn btn-primary w-100"
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