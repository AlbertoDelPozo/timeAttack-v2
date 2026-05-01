import React from "react";
import type { Piloto, Pasada } from "./types";

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

  const isFastestTime = (tramoId: number, tiempo: number | null): boolean => {
    return tiempo !== null && tiempo === fastestTimes[tramoId];
  };

  return (
    <tr className="hover:bg-gray-700 transition-colors duration-200">
      <td className="px-2 py-2 text-white font-medium text-xs max-w-[120px] overflow-hidden">
        <span className="block truncate text-center">
          {`${piloto.nombre} ${piloto.apellido}`}
        </span>
      </td>
      <td className="px-2 py-2 text-center text-xs text-gray-400">
        {piloto.category}
      </td>
      <td className="px-2 py-2 text-center text-xs text-gray-400">
        {piloto.car}
      </td>
      {selectedPasada === null ? (
        piloto.pasadas.map((pasada) => (
          <td
            key={pasada.id}
            className="px-2 py-2 text-center text-xs text-gray-400"
          >
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
            <td key={tramo.id} className="px-2 py-2 text-center">
              {isReadOnly ? (
                <span className={
                  isFastestTime(tramo.id, tramoTiempo)
                    ? "font-bold text-green-400"
                    : "text-gray-200"
                }>
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
                  className={`w-20 p-1 rounded-lg bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-500 transition-colors duration-200 ${isFastestTime(tramo.id, tramoTiempo) ? "font-bold text-green-400" : ""}`}
                />
              )}
            </td>
          );
        })
      )}
      <td className="px-2 py-2 text-center text-xs font-bold text-white">
        {getDisplayValue(
          selectedPasada === null
            ? piloto.total
            : piloto.pasadas.find((p) => p.id === selectedPasada)?.subtotal ||
            null
        )}
      </td>
      {!isReadOnly && (
        <td className="px-2 py-2 text-center">
          <button
            onClick={() => onDeletePiloto(piloto)}
            className="text-brand-600 hover:text-brand-400 transition-colors duration-200"
          >
            &times;
          </button>
        </td>
      )}
    </tr>
  );
};

export default PilotoRow;