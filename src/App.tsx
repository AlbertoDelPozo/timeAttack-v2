import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RallyTable from './components/RallyTable';
import ConfigPage from './pages/ConfigPage';
import { RallyDataProvider } from './useRallyData';

function App() {
  return (
    <BrowserRouter>
      <RallyDataProvider>
        <div className="min-h-screen bg-gray-950 text-white font-sans">
          <main className="container mx-auto p-4 md:p-8">
            <Routes>
              <Route path="/" element={<ConfigPage />} />
              <Route path="/rally" element={<RallyTable />} />
            </Routes>
          </main>
        </div>
      </RallyDataProvider>
    </BrowserRouter>
  );
}

export default App;