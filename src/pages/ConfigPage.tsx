import React from "react";
import { useNavigate } from "react-router-dom";
import { useRallyData } from "../useRallyData";

const ConfigPage = () => {
  const {
    numPasadas,
    setNumPasadas,
    numTramos,
    setNumTramos,
    handleSaveConfig,
  } = useRallyData();
  const navigate = useNavigate();

  const handleStartRally = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSaveConfig();
    navigate("/rally");
  };

  return (
    <div className="flex items-center justify-center content-center min-h-screen bg-gray-950 font-sans p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h1 className="text-3xl md:text-4xl text-white font-bold text-center mb-6">
          Configuración del Rally
        </h1>
        <form onSubmit={handleStartRally}>
          <div className="mb-5">
            <label
              htmlFor="numPasadas"
              className="block text-gray-300 mb-2 font-medium"
            >
              Número de Pasadas:
            </label>
            <input
              id="numPasadas"
              type="number"
              className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 spin-button-none"
              value={numPasadas}
              onChange={(e) => setNumPasadas(parseInt(e.target.value, 10))}
              min="1"
              required
            />
          </div>
          <div className="mb-8">
            <label
              htmlFor="numTramos"
              className="block text-gray-300 mb-2 font-medium"
            >
              Número de Tramos por Pasada:
            </label>
            <input
              id="numTramos"
              type="number"
              className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 spin-button-none"
              value={numTramos}
              onChange={(e) => setNumTramos(parseInt(e.target.value, 10))}
              min="1"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg text-lg font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-transform duration-200 transform hover:scale-[1.02]"
          >
            Comenzar Rally
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigPage;