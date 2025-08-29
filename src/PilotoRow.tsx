import React from "react";
import type { Piloto, Tramo, Pasada } from "./types";

interface PilotoRowProps {
  piloto: Piloto;
  onTimeChange: (
    pilotoId: number,
    pasadaId: number,
    tramoId: number,
    tiempo: number | null
  ) => void;
  onDeletePiloto: (piloto: Piloto) => void;
  selectedPasada: number | null;
  isReadOnly: boolean;
  fastestTimes: { [key: number]: number };
  pasadaToShow: Pasada | null;
}

const PilotoRow: React.FC<PilotoRowProps> = ({
  piloto,
  onTimeChange,
  onDeletePiloto,
  selectedPasada,
  isReadOnly,
  fastestTimes,
  pasadaToShow,
}) => {
  const getDisplayValue = (value: number | null): string => {
    if (value === null) return "";
    return (value / 1000).toFixed(2);
  };

  const getStyle = (
    tramo: Tramo,
    fastestTimes: { [key: number]: number }
  ): React.CSSProperties => {
    if (tramo.tiempo === fastestTimes[tramo.id]) {
      return { backgroundColor: "#d4edda", fontWeight: "bold" };
    }
    return {};
  };

  return (
    <tr>
      <td>{`${piloto.nombre} ${piloto.apellido}`}</td>
      {/* Se añaden las celdas para Categoría y Coche */}
      <td>{piloto.category}</td>
      <td>{piloto.car}</td>
      {selectedPasada === null ? (
        piloto.pasadas.map((pasada) => (
          <td key={pasada.id} className="text-center">
            {getDisplayValue(pasada.subtotal)}
          </td>
        ))
      ) : (
        pasadaToShow?.tramos.map((tramo) => {
          const pilotoTramo = piloto.pasadas
            .find((p) => p.id === selectedPasada)
            ?.tramos.find((t) => t.id === tramo.id);
          const tramoTiempo = pilotoTramo ? pilotoTramo.tiempo : null;

          return (
            <td key={tramo.id} className="text-center">
              {isReadOnly ? (
                <span style={getStyle(tramo, fastestTimes)}>
                  {getDisplayValue(tramoTiempo)}
                </span>
              ) : (
                <input
                  type="number"
                  step="any"
                  value={tramoTiempo === null ? "" : tramoTiempo / 1000}
                  onChange={(e) =>
                    onTimeChange(
                      piloto.id,
                      selectedPasada,
                      tramo.id,
                      e.target.value === ""
                        ? null
                        : parseFloat(e.target.value) * 1000
                    )
                  }
                  className="form-control form-control-sm text-center"
                  style={getStyle(tramo, fastestTimes)}
                  disabled={isReadOnly}
                />
              )}
            </td>
          );
        })
      )}
      <td className="text-center">
        {getDisplayValue(
          selectedPasada === null
            ? piloto.total
            : piloto.pasadas.find((p) => p.id === selectedPasada)?.subtotal ||
                null
        )}
      </td>
      {!isReadOnly && (
        <td className="text-center">
          <button
            onClick={() => onDeletePiloto(piloto)}
            className="btn btn-danger btn-sm"
          >
            &times;
          </button>
        </td>
      )}
    </tr>
  );
};

export default PilotoRow;